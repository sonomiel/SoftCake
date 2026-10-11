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
        !isset($data['id']) ||
        !isset($data['ciudad']) ||
        !isset($data['colonia']) ||
        !isset($data['cp']) ||
        !isset($data['cp_lugar_expedicion']) ||
        !isset($data['dir_matriz']) ||
        !isset($data['dir_sucursal']) ||
        !isset($data['estado']) ||
        !isset($data['localidad']) ||
        !isset($data['logo_empresa']) ||
        !isset($data['nombre']) ||
        !isset($data['nombre_comercial']) ||
        !isset($data['num_exterior']) ||
        !isset($data['num_interior']) ||
        !isset($data['pais']) ||
        !isset($data['regimen_fiscal']) ||
        !isset($data['rfc']) 
    ) {
        throw new Exception("Faltan parámetros requeridos");
    }

    $stmt = $pdo->prepare("CALL sp_update_em(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([
        $data['id'],
        $data['ciudad'],
        $data['colonia'],
        $data['cp'],
        $data['cp_lugar_expedicion'],
        $data['dir_matriz'],
        $data['dir_sucursal'],
        $data['estado'], 
        $data['localidad'],
        $data['logo_empresa'],
        $data['nombre'],
        $data['nombre_comercial'],
        $data['num_exterior'],
        $data['num_interior'],
        $data['pais'],
        $data['regimen_fiscal'],
        $data['rfc']
    ]);

    echo json_encode([
        "success" => true,
        "message" => "Actualizado correctamente"
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "error" => $e->getMessage()
    ]);
}
