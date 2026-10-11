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
        !isset($data['fecha_emision'])  ||
        !isset($data['id_emisor'])      ||
        !isset($data['fecha_entrega'])  ||
        !isset($data['items'])          ||
        !is_array($data['items'])       ||
        empty($data['items'])
    ) {
        throw new Exception("Faltan parámetros requeridos");
    }

    // Validar que cada item tenga sus campos
    foreach ($data['items'] as $index => $item) {
        if (
            !isset($item['id_ins_gral'])       ||
            !isset($item['cantidad']) 
        ) {
            throw new Exception("Item [{$index}] incompleto: faltan campos requeridos");
        }
    }

    $pdo->beginTransaction();

    // ── Obtener último id y generar el siguiente ───────────────────────────
    $stmtId = $pdo->prepare("SELECT COALESCE(MAX(CAST(id AS UNSIGNED)), 0) + 1 FROM m_prod_ord_ins_gral WHERE id_emisor = ? FOR UPDATE");
    $stmtId->execute([$data['id_emisor']]);
    $nuevoId = str_pad((int)$stmtId->fetchColumn(), 11, '0', STR_PAD_LEFT);
    $stmtId->closeCursor();

    // Insertar cada item con el mismo id de orden
    $stmtIns = $pdo->prepare("CALL sp_insert_ord_ins(?, ?, ?, ?, ?, ?)");
    foreach ($data['items'] as $item) {
        $stmtIns->execute([
            $nuevoId,
            $item['id_ins_gral'],
            $item['cantidad'],
            $data['fecha_emision'],
            $data['fecha_entrega'],
            $data['id_emisor']
        ]);
        $stmtIns->closeCursor();
    }

    $pdo->commit();

    echo json_encode([
        "success" => true,
        "message" => "Insertado correctamente",
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