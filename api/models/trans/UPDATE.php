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

require_once __DIR__ . '/../../conexion/conexion.php';

try {
    $pdo = getConnection();

    $data = json_decode(file_get_contents("php://input"), true);

    // Validar parámetros obligatorios
    if (
        !isset($data['id']) ||
        !isset($data['id_prod_carta']) ||
        !isset($data['cantidad']) ||
        !isset($data['id_almacen']) ||
        !isset($data['id_empleado_manda']) ||
        !isset($data['id_empleado_recibe'])
    ) {
        throw new Exception("Faltan parámetros requeridos");
    }

    $stmt = $pdo->prepare("CALL sp_update_trans(?, ?, ?, ?, ?, ?)");
    $stmt->execute([
        $data['id'],
        $data['id_prod_carta'],
        $data['cantidad'],
        $data[''],
        $data['id_empleado_manda'],
        $data['id_empleado_recibe']
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
