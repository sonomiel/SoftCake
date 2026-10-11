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
        !isset($data['cdfi']) ||
        !isset($data['clave']) ||
        !isset($data['codigo_postal']) ||
        !isset($data['colonia']) ||
        !isset($data['correo_electronico']) ||
        !isset($data['direccion']) ||
        !isset($data['estado_provincia']) ||
        !isset($data['id_metodopago']) ||
        !isset($data['localidad']) ||
        !isset($data['municipio']) ||
        !isset($data['nombre']) ||
        !isset($data['no_exterior']) ||
        !isset($data['no_interior']) ||
        !isset($data['pais']) ||
        !isset($data['regimen_fiscal']) ||
        !isset($data['rfc']) ||
        !isset($data['telefono1']) ||
        !isset($data['telefono2']) ||
        !isset($data['id_emisor'])
    ) {
        throw new Exception("Faltan parámetros requeridos");
    }


    $stmt = $pdo->prepare("CALL sp_insert_cl(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([
        $data['cdfi'],
        $data['clave'],
        $data['codigo_postal'],
        $data['colonia'],
        $data['correo_electronico'],
        $data['direccion'],
        $data['estado_provincia'],
        $data['id_metodopago'],
        $data['localidad'],
        $data['municipio'],
        $data['nombre'],
        $data['no_exterior'],
        $data['no_interior'],
        $data['pais'],
        $data['regimen_fiscal'],
        $data['rfc'],
        $data['telefono1'],
        $data['telefono2'],
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