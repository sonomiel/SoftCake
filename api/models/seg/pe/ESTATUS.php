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

    $id = $data['id'] ?? 0;
    $estatus = $data['estatus'] ?? 1;

    $stmt = $pdo->prepare("CALL sp_update_estatus_per(?, ?)");
    $stmt->execute([$id, $estatus]);

    echo json_encode(["success" => true, "message" => "Estatus actualizado correctamente"]);
} catch (Exception $e) {
    echo json_encode(["error" => $e->getMessage()]);
}
