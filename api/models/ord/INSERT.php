<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, PUT, DELETE, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../../conexion/conexion.php';

try {
    $pdo = getConnection();
    $data = json_decode(file_get_contents("php://input"), true);

    // Validar parámetros base
    if (
        !isset($data['fecha_emision']) ||
        !isset($data['id_emisor'])     ||
        !isset($data['id_usuario'])     ||
        !isset($data['id_metodo_pago']) ||
        !isset($data['items'])         ||
        !is_array($data['items'])      ||
        empty($data['items'])
    ) {
        throw new Exception("Faltan parámetros requeridos");
    }

    // Validar que cada item tenga sus campos
    foreach ($data['items'] as $index => $item) {
        if (
            !isset($item['importe'])       ||
            !isset($item['id_prod']) ||
            !isset($item['tipo'])
        ) {
            throw new Exception("Item [{$index}] incompleto: faltan campos requeridos");
        }
    }

    $pdo->beginTransaction();

    // ── Obtener último id y generar el siguiente ───────────────────────────
    $stmtOrd = $pdo->prepare("CALL sp_get_id_ord(?)");
    $stmtOrd->execute([$data['id_emisor']]);
    $row = $stmtOrd->fetch(PDO::FETCH_ASSOC);
    $stmtOrd->closeCursor();

    $ultimoId  = $row ? intval($row['id_orden']) : 0;
    $nuevoId  = str_pad($ultimoId + 1, 11, '0', STR_PAD_LEFT); 

    // Insertar cada item con el mismo id de orden
    $stmtIns = $pdo->prepare("CALL sp_insert_orden(?, ?, ?, ?, ?, ?, ?, ?)");
    foreach ($data['items'] as $item) {
        $stmtIns->execute([
            $nuevoId,
            $data['fecha_emision'],
            $item['id_prod'],
            $item['importe'],
            $item['tipo'],
            $data['id_metodo_pago'],
            $data['id_usuario'],
            $data['id_emisor']
        ]);
        $stmtIns->closeCursor();
    }

    $pdo->commit();

    echo json_encode([
        "success" => true,
        "message" => "Guardado correctamente",
        "total"   => count($data['items'])
    ]);

} catch (Exception $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "error"   => $e->getMessage()
    ]);
}