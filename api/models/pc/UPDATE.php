<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, PUT, DELETE, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}
require_once __DIR__ . '/../../conexion/conexion.php';
try {
    $pdo  = getConnection();
    $data = json_decode(file_get_contents("php://input"), true);

    if (
        empty($data['id'])          ||
        empty(trim($data['producto']    ?? ''))
    ) {
        throw new Exception("Faltan parámetros requeridos");
    }

    // Por defecto conservar la imagen actual
    $urlImagen = $data['text_img_anterior'] ?? null;

    // Si viene imagen nueva, guardarla y borrar la anterior
    if (!empty($data['nombre_img']) && !empty($data['text_img'])) {
        $carpeta = __DIR__ . "/../../uploads/productos/";
        if (!is_dir($carpeta)) mkdir($carpeta, 0755, true);

        $nombreArchivo = time() . "_" . preg_replace('/[^a-zA-Z0-9._-]/', '_', $data['nombre_img']);
        $rutaFisica    = $carpeta . $nombreArchivo;

        $decoded = base64_decode($data['text_img']);
        if ($decoded === false) throw new Exception("El base64 de la imagen no es válido");

        file_put_contents($rutaFisica, $decoded);
        $urlImagen = "uploads/productos/" . $nombreArchivo;

        // Borrar imagen anterior del servidor
        if (!empty($data['text_img_anterior'])) {
            $rutaAnterior = __DIR__ . "/../../" . $data['text_img_anterior'];
            if (file_exists($rutaAnterior)) unlink($rutaAnterior);
        }
    }

    $stmt = $pdo->prepare("CALL sp_update_pc(?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([
        $data['id'],
        $data['descripcion'],
        $data['id_almacen']      ?? null,
        $data['id_tipo']         ?? null,
        $data['precio']          ?? null,
        $data['producto'],
        $urlImagen,
        $data['id_subcategoria'] ?? null
    ]);

    echo json_encode([
        "success" => true,
        "message" => "Actualizado correctamente",
        "url_img" => $urlImagen
    ]);

} catch (Exception $e) {
    if (isset($rutaFisica) && file_exists($rutaFisica)) unlink($rutaFisica);
    http_response_code(500);
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}