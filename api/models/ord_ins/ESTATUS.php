<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, PUT, DELETE, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../../conexion/conexion.php';

try {
    $pdo = getConnection();

    $data = json_decode(file_get_contents("php://input"), true);

    // Validar parámetros obligatorios
    if (
        !isset($data['id'])        ||
        !isset($data['estatus'])   
    ) {
        throw new Exception("Faltan parámetros requeridos");
    }

    // 3️⃣ Insertar en BD
    $stmt = $pdo->prepare("CALL sp_update_estatus_ord_ins(?, ?)");
    $stmt->execute([
        $data['id'],
        $data['estatus']
    ]);

    echo json_encode([
        "success"  => true,
        "message"  => "Insertado correctamente"
    ]);

} catch (Exception $e) {

    http_response_code(500);
    echo json_encode([
        "success" => false,
        "error"   => $e->getMessage()
    ]);
}