<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type");

require_once __DIR__ . '/../../../conexion/conexion.php';

try {
    $pdo = getConnection();

    // Llamada al procedimiento almacenado con parámetro
    $stmt = $pdo->prepare("CALL sp_get_em()");
    $stmt->execute();

    $result = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($result, JSON_PRETTY_PRINT);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "error" => "Database Error",
        "message" => $e->getMessage(),
        "code" => $e->getCode()
    ]);
}
