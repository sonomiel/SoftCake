<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(["success" => false, "error" => "Método no permitido"]);
    exit();
}

require_once __DIR__ . '/../../conexion/conexion.php';

try {
    $pdo = getConnection();
    $pdo->setAttribute(PDO::ATTR_EMULATE_PREPARES, true);

    $id_usuario = $_GET['id_usuario'] ?? null;
    $fecha      = $_GET['fecha']      ?? date('Y-m-d'); // hoy por defecto

    if (!$id_usuario) {
        http_response_code(400);
        echo json_encode(["success" => false, "error" => "id_usuario es requerido"]);
        exit();
    }

    $stmt = $pdo->prepare("CALL sp_get_apertura(?, ?)");
    $stmt->execute([$fecha, $id_usuario]);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    $stmt->closeCursor();

    echo json_encode([
        "success"      => true,
        "puede_abrir"  => (bool) $result['puede_abrir'],
        "mensaje"      => $result['mensaje'],
        "apertura"     => $result['puede_abrir'] ? null : $result,
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "error"   => $e->getMessage()
    ]);
}