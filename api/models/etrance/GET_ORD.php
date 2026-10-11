<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type");

require_once __DIR__ . '/../../conexion/conexion.php';

try {
    $pdo = getConnection();

    // Validar que el parámetro llegue en la URL
    if (!isset($_GET['id_emisor'])) {
        throw new Exception("Falta el parámetro requerido: id_emisor");
    }

    $id_emisor = $_GET['id_emisor'];

    // Llamada al procedimiento almacenado con parámetro
    $stmt = $pdo->prepare("CALL sp_get_etrance(?)");
    $stmt->execute([$id_emisor]);

    $result = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($result, JSON_PRETTY_PRINT);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "error" => "Database Error",
        "message" => $e->getMessage(),
        "code" => $e->getCode()
    ]);
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        "error" => "Bad Request",
        "message" => $e->getMessage()
    ]);
}
?>
