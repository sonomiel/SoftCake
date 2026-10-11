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

    // Validar parámetros obligatorios
    if (
        !isset($data['complemento']) ||
        !isset($data['importe']) ||
        !isset($data['id_almacen']) ||
        !isset($data['factor_unitario']) ||
        !isset($data['id_emisor']) 
    ) {
        throw new Exception("Faltan parámetros requeridos");
    }

    $stmt = $pdo->prepare("CALL sp_insert_comp(?, ?, ?, ?, ?, ?)");
    $stmt->execute([
        $data['complemento'],
        $data['importe'],
        $data['id_almacen'],
        $data['factor_unitario'],
        $data['id_ins_gral'],
        $data['id_emisor']
    ]);

    echo json_encode([
        "success" => true,
        "message" => "Insertado correctamente"
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "error" => $e->getMessage()
    ]);
}