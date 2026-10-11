<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, PUT, DELETE, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }
require_once __DIR__ . '/../../conexion/conexion.php';
try {
    $pdo  = getConnection();
    $data = json_decode(file_get_contents("php://input"), true);

    if (
        !isset($data['id_almacen'])    ||
        !isset($data['id_empleado_manda'])    ||
        !isset($data['id_empleado_recibe'])     ||
        !isset($data['fecha_emision'])||
        !isset($data['salida_directa'])||
        !isset($data['id_emisor'])        ||
        !isset($data['items'])            ||
        !is_array($data['items'])         ||
        empty($data['items'])
    ) throw new Exception("Faltan parámetros requeridos");

    $pdo->beginTransaction();

    // Generar siguiente id
    $stmtId = $pdo->prepare("SELECT COALESCE(MAX(CAST(id AS UNSIGNED)), 0) + 1 FROM transferencias WHERE id_emisor = ? FOR UPDATE");
    $stmtId->execute([$data['id_emisor']]);
    $nuevoId = str_pad((int)$stmtId->fetchColumn(), 11, '0', STR_PAD_LEFT);
    $stmtId->closeCursor();

    $stmt = $pdo->prepare("CALL sp_insert_trans(?, ?, ?, ?, ?, ?, ?, ?)");
    foreach ($data['items'] as $item) {
        $stmt->execute([
            $nuevoId,
            $item['id_pedido'],
            $data['id_almacen'],
            $data['id_empleado_manda'],
            $data['id_empleado_recibe'],
            $data['fecha_emision'],
            $data['salida_directa'],
            $data['id_emisor']
        ]);
        $stmt->closeCursor();
    }

    $pdo->commit();
    echo json_encode(["success" => true, "id" => $nuevoId]);
} catch (Exception $e) {
    if (isset($pdo) && $pdo->inTransaction()) $pdo->rollBack();
    http_response_code(500);
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}