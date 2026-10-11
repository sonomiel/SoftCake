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
        !isset($data['clave']) ||
        !isset($data['fecha_fin']) ||
        !isset($data['fecha_inicio']) ||
        !isset($data['id_emisor']) ||
        !isset($data['nombre']) ||
        !isset($data['password']) ||
        !isset($data['telefono']) ||
        !isset($data['username']) 
    ) {
        throw new Exception("Faltan parámetros requeridos");
    }

    // Hashear el password usando PASSWORD_DEFAULT (bcrypt)
    $hashedPassword = password_hash($data['password'], PASSWORD_DEFAULT);

    $stmt = $pdo->prepare("CALL sp_insert_us(?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([
        $data['clave'],
        $data['fecha_fin'],
        $data['fecha_inicio'],
        $data['id_emisor'],
        $data['nombre'],
        $hashedPassword,  // Aquí se envía el password hasheado
        $data['telefono'],
        $data['username']
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