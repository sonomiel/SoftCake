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

    if (!$id_usuario) {
        http_response_code(400);
        echo json_encode(["success" => false, "error" => "id_usuario es requerido"]);
        exit();
    }

    $stmt = $pdo->prepare("CALL sp_get_cierre_gral(?)");
    $stmt->execute([$id_usuario]);  // ← falta esta línea
    $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $stmt->closeCursor();

    echo json_encode($result, JSON_PRETTY_PRINT);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "error"   => $e->getMessage()
    ]);
}