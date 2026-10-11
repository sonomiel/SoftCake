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
        !isset($data['id_pedido'])      ||
        !isset($data['id_metodo_pago']) ||
        !isset($data['importe'])        ||
        !isset($data['id_usuario'])     ||
        !isset($data['id_emisor'])        

    ) throw new Exception("Faltan parámetros requeridos");

    // Generar siguiente id para este pedido
    $stmtId = $pdo->prepare("SELECT COALESCE(MAX(id), 0) + 1 FROM m_prod_pagos_pedidos");
    
    $stmtId->execute();
    $nuevoId = (int)$stmtId->fetchColumn();  // ← faltaba definir $nuevoId
    $stmtId->closeCursor();

    $pdo->beginTransaction();

    $stmt = $pdo->prepare("CALL sp_insert_pago_ped(?, ?, ?, ?, ?, ?)");
    $stmt->execute([
        $data['id_pedido'],     
        $data['id_metodo_pago'],
        $data['importe'],
        $data['fecha'],          
        $data['id_usuario'],
        $data['id_emisor']
    ]);
    $stmt->closeCursor();

$pdo->commit();
echo json_encode(["success" => true]);

    $pdo->commit();
    echo json_encode(["success" => true]);
} catch (Exception $e) {
    if (isset($pdo) && $pdo->inTransaction()) $pdo->rollBack();
    http_response_code(500);
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}