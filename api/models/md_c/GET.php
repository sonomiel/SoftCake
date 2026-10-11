<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../../conexion/conexion.php';

try {
    $pdo = getConnection();

    $id_emisor = $_GET['id_emisor'] ?? null;
    $id_prod_carta = $_GET['id_prod_carta'] ?? null;

    if (!$id_emisor) throw new Exception("Falta id_emisor");

    $stmt = $pdo->prepare("CALL sp_get_md_c(?, ?)");
    $stmt->execute([$id_emisor, $id_prod_carta]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Construir URL base del servidor
    $protocol  = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? "https" : "http";
    $host      = $_SERVER['HTTP_HOST'];
    $base_url  = $protocol . "://" . $host . "/api/";

    // Agregar URL completa a cada imagen
    foreach ($rows as &$row) {
        if (!empty($row['txt_img'])) {
            $row['text_img'] = $base_url . $row['txt_img'];
        } else {
            $row['text_img'] = null;
        }
    }

    echo json_encode($rows);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "error"   => $e->getMessage()
    ]);
}