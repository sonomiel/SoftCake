<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type");
require_once __DIR__ . '/../../conexion/conexion.php';
try {
    $pdo = getConnection();

    if (!isset($_GET['id_emisor']) || !isset($_GET['fecha_ini']) || !isset($_GET['fecha_fin'])) {
        throw new Exception("Faltan parámetros requeridos: id_emisor, fecha_ini, fecha_fin");
    }

    $id_emisor  = $_GET['id_emisor'];
    $fecha_ini  = $_GET['fecha_ini'];
    $fecha_fin  = $_GET['fecha_fin'];

    $stmt = $pdo->prepare("CALL sp_get_g(?, ?, ?)");
    $stmt->execute([$id_emisor, $fecha_ini, $fecha_fin]);
    $result = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($result, JSON_PRETTY_PRINT);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "error"   => "Database Error",
        "message" => $e->getMessage(),
        "code"    => $e->getCode()
    ]);
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        "error"   => "Bad Request",
        "message" => $e->getMessage()
    ]);
}
?>