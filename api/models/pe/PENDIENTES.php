<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }
require_once __DIR__ . '/../../conexion/conexion.php';
try {
    $pdo = getConnection();
    if (empty($_GET['id_emisor'])) throw new Exception("Falta id_emisor");

    $stmt = $pdo->prepare("CALL sp_get_pend_pago(?)");
    $stmt->execute([$_GET['id_emisor']]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $stmt->closeCursor();

    echo json_encode($rows);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}