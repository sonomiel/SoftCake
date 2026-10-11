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
        !isset($data['ciudad']) ||
        !isset($data['clave_proveedor']) ||
        !isset($data['codigo_postal']) ||
        !isset($data['colonia']) ||
        !isset($data['correo_electronico']) ||
        !isset($data['credito']) ||
        !isset($data['direccion']) ||
        !isset($data['estado_provincia']) ||
        !isset($data['nombre']) ||
        !isset($data['no_exterior']) ||
        !isset($data['no_interior']) ||
        !isset($data['pais']) ||
        !isset($data['rfc']) ||
        !isset($data['telefono1']) ||
        !isset($data['telefono2']) ||
        !isset($data['tipo']) ||
        !isset($data['id_emisor']) 
    ) {
        throw new Exception("Faltan parámetros requeridos");
    }


    $stmt = $pdo->prepare("CALL sp_insert_pr(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([
        $data['ciudad'],
        $data['clave_proveedor'],
        $data['codigo_postal'],
        $data['colonia'],
        $data['correo_electronico'],
        $data['credito'],
        $data['direccion'],
        $data['estado_provincia'],
        $data['nombre'],
        $data['no_exterior'],
        $data['no_interior'],
        $data['pais'],
        $data['rfc'],
        $data['telefono1'],
        $data['telefono2'],
        $data['tipo'],
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