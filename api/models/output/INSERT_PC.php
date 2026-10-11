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

    // ── Validar que llegue id_emisor y el arreglo de items ──
    if (empty($data['id_emisor']) || empty($data['items']) || !is_array($data['items'])) {
        throw new Exception("Faltan parámetros requeridos: id_emisor e items[]");
    }

    $id_emisor = $data['id_emisor'];
    $items     = $data['items'];
    $campos_requeridos = ['fecha_doc', 'id_concepto_mvto', 'id_almacen', 'id_prod_carta', 'cantidad'];

    // ── Validar cada item antes de insertar cualquiera ──
    foreach ($items as $index => $item) {
        foreach ($campos_requeridos as $campo) {
            if (!isset($item[$campo]) || $item[$campo] === '' || $item[$campo] === null) {
                throw new Exception("Item #" . ($index + 1) . ": falta el campo '$campo'");
            }
        }
    }

    $pdo->beginTransaction();

    // ── Obtener el siguiente id para este emisor dentro de la transacción ──
    // Usando FOR UPDATE para evitar condición de carrera con inserciones concurrentes
    $stmtId = $pdo->prepare("SELECT COALESCE(MAX(id), 0) + 1 AS siguiente_id FROM e_entrance_items WHERE id_emisor = ? FOR UPDATE");
    $stmtId->execute([$id_emisor]);
    $siguiente_id = (int) $stmtId->fetchColumn();
    $stmtId->closeCursor();

    // ── Insertar cada item compartiendo el mismo id de entrada ──
    $stmt = $pdo->prepare("CALL sp_insert_output_prod(?, ?, ?, ?, ?, ?, ?, ? ,?)");

    foreach ($items as $item) {
        $stmt->execute([
            $item['cantidad'],
            $item['fecha_doc'],
            $siguiente_id,
            $item['id_almacen'],
            $item['id_prod_carta'],
            $item['observaciones'],
            $item['id_concepto_mvto'],
            $id_emisor,
            $item['id_usuario']
        ]);
        $stmt->closeCursor();
    }

    $pdo->commit();

    echo json_encode([
        "success" => true,
        "id"      => $siguiente_id,
        "message" => "Se insertaron " . count($items) . " registro(s) correctamente"
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