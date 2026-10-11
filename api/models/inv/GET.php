<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../../conexion/conexion.php';

try {
    $pdo = getConnection();

    if (!isset($_GET['inv']) || !isset($_GET['sel']) || !isset($_GET['id_emisor'])) {
        throw new Exception("Faltan parámetros requeridos: inv, sel, id_emisor");
    }

    $inv       = (int)$_GET['inv'];
    $sel       = (int)$_GET['sel'];
    $id_emisor = (int)$_GET['id_emisor'];

    $stmt = $pdo->prepare("CALL sp_get_inv(?, ?, ?)");
    $stmt->execute([$inv, $sel, $id_emisor]);

    $result = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

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