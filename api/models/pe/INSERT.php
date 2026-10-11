<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, PUT, DELETE, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }
require_once __DIR__ . '/../../conexion/conexion.php';
try {
    $pdo  = getConnection();
    $data = json_decode(file_get_contents("php://input"), true);

    if (
        !isset($data['fecha_emision'])    ||
        !isset($data['fecha_entrega'])    ||
        !isset($data['destinatario'])     ||
        !isset($data['direccion_entrega'])||
        !isset($data['origen'])           ||
        !isset($data['destino'])           ||
        !isset($data['id_emisor'])        ||
        !isset($data['items'])            ||
        !is_array($data['items'])         ||
        empty($data['items'])
    ) throw new Exception("Faltan parámetros requeridos");

    foreach ($data['items'] as $i => $item) {
        if (!isset($item['id_prod']) || !isset($item['tipo']) || !isset($item['importe']))
            throw new Exception("Item [{$i}] incompleto");
    }

// Procesar imagen base64 si viene
$urlImagen = $data['url_img'] ?? null;

if (!empty($urlImagen) && str_starts_with($urlImagen, 'data:image/')) {
    // Extraer tipo y datos
    preg_match('/data:image\/(\w+);base64,(.+)/', $urlImagen, $matches);
    $extension  = strtolower($matches[1]); // jpg, png, webp
    $base64Data = $matches[2];

    // Carpeta destino
    $carpeta = __DIR__ . "/../../uploads/pedidos/";
    if (!is_dir($carpeta)) {
        mkdir($carpeta, 0755, true);
    }

    // Nombre único
    $nombreArchivo = uniqid('pe_', true) . '.' . $extension;
    $rutaCompleta  = $carpeta . $nombreArchivo;

    // Guardar archivo
    file_put_contents($rutaCompleta, base64_decode($base64Data));

    $urlImagen = "uploads/pedidos/" . $nombreArchivo;
}

    $pdo->beginTransaction();

    // Generar siguiente id
    $stmtId = $pdo->prepare("SELECT COALESCE(MAX(CAST(id AS UNSIGNED)), 0) + 1 FROM m_pedidos WHERE id_emisor = ? FOR UPDATE");
    $stmtId->execute([$data['id_emisor']]);
    $nuevoId = str_pad((int)$stmtId->fetchColumn(), 11, '0', STR_PAD_LEFT);
    $stmtId->closeCursor();

    $stmt = $pdo->prepare("CALL sp_insert_pe(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    foreach ($data['items'] as $item) {
        $stmt->execute([
            $nuevoId,
            $data['fecha_emision'],
            $data['fecha_entrega'],
            $data['destinatario'],
            $data['direccion_entrega'],
            $item['id_prod'],
            $item['tipo'],
            $item['importe'],
            $data['origen'],
            $data['origenOtro'],
            $data['destino'],
            $data['hora_entrega'],
            $data['telefono_cliente'],
            $urlImagen,
            $data['id_emisor']
        ]);
        $stmt->closeCursor();
    }

    $pdo->commit();
    echo json_encode(["success" => true, "id" => $nuevoId]);
} catch (Exception $e) {
    if (isset($pdo) && $pdo->inTransaction()) $pdo->rollBack();

    $msg = $e->getMessage();
    $msg = preg_replace('/SQLSTATE\[.*?\].*?:\s*\d+\s*/i', '', $msg);
    $msg = trim($msg);

    $esNegocio = str_contains($msg, 'Stock insuficiente')
              || str_contains($msg, 'No existe receta');

    http_response_code($esNegocio ? 200 : 500);
    echo json_encode(["success" => false, "error" => $msg]);
}