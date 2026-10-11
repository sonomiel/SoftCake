<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, PUT, DELETE, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

// Manejo de preflight (OPTIONS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../../../conexion/conexion.php';

try {
    $pdo = getConnection();

    $data = json_decode(file_get_contents("php://input"), true);

    $stmt = $pdo->prepare("CALL sp_delete_alm(?)");
    $stmt->execute([$data['id']]);

    echo json_encode(["success" => true, "message" => "Eliminado correctamente"]);
} catch (Exception $e) {
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}
