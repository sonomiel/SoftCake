<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type");

require_once __DIR__ . '/../../conexion/conexion.php';

try {
    $pdo = getConnection();

    $tipo = $_GET['tipo'];
    $fecha_inicio = $_GET['fecha_inicio'];
    $fecha_fin = $_GET['fecha_fin'];
    $mostrar_concepto = $_GET['mostrar_concepto'];


    // Llamada al procedimiento almacenado con parámetro
    $stmt = $pdo->prepare("CALL sp_get_entradas(?, ?, ?, ?)");
    $stmt->execute([$tipo, $fecha_inicio, $fecha_fin, $mostrar_concepto]);

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
