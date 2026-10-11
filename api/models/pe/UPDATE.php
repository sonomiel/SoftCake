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
        !isset($data['id'])               ||
        !isset($data['fecha_emision'])    ||
        !isset($data['fecha_entrega'])    ||
        !isset($data['destinatario'])     ||
        !isset($data['direccion_entrega'])||
        !isset($data['id_emisor'])        ||
        !isset($data['items'])            ||
        !is_array($data['items'])         ||
        empty($data['items'])
    ) throw new Exception("Faltan parámetros requeridos");

    $pdo->beginTransaction();

    // Eliminar registros anteriores del pedido
    $stmtDel = $pdo->prepare("DELETE FROM m_pedidos WHERE id = ?");
    $stmtDel->execute([$data['id']]);
    $stmtDel->closeCursor();

    // Reinsertar con los nuevos items
     $stmt = $pdo->prepare("CALL sp_insert_pe(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    foreach ($data['items'] as $item) {
        $stmt->execute([
            $nuevoId,
            $data['fecha_emision'],
            $data['fecha_entrega'],
            $data['destinatario'],
            $data['direccion_entrega'],
            $item['id_prod'],
            $item['tipo'],
            $item['importe'],
            $data['origen'],
            $data['origenOtro'],
            $data['destino'],
            $data['hora_entrega'],
            $data['telefono_cliente'],
            $data['url_img'],
            $data['id_emisor']
        ]);
        $stmt->closeCursor();
    }

    $pdo->commit();
    echo json_encode(["success" => true]);
} catch (Exception $e) {
    if (isset($pdo) && $pdo->inTransaction()) $pdo->rollBack();
    http_response_code(500);
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}