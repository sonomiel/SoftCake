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
    $pdo = getConnection();

    $data = json_decode(file_get_contents("php://input"), true);

    // Validar parámetros obligatorios
    if (
        !isset($data['descripcion'])     ||
        !isset($data['id_almacen'])      ||
        !isset($data['id_tipo'])         ||
        !isset($data['precio'])          ||
        !isset($data['producto'])        ||
        !isset($data['id_emisor'])       ||
        !isset($data['id_subcategoria']) ||
        !isset($data['factor_unitario'])
    ) {
        throw new Exception("Faltan parámetros requeridos");
    }

    $urlImagen = $data['txt_img'];

    // 1️⃣ Si viene imagen en base64, guardarla físicamente
    if (!empty($data['txt_img']) && !empty($data['nombre_img'])) {

        $carpeta = __DIR__ . "/../../uploads/productos/";
        if (!is_dir($carpeta)) {
            mkdir($carpeta, 0755, true);
        }

        $nombreArchivo = time() . "_" . preg_replace('/[^a-zA-Z0-9._-]/', '_', $data['nombre_img']);
        $rutaFisica    = $carpeta . $nombreArchivo;

        $decoded = base64_decode($data['txt_img']);
        if ($decoded === false) {
            throw new Exception("El base64 de la imagen no es válido");
        }

        file_put_contents($rutaFisica, $decoded);

        // 2️⃣ URL relativa para guardar en BD
        $urlImagen = "uploads/productos/" . $nombreArchivo;
    }

    // 3️⃣ Insertar en BD
    $stmt = $pdo->prepare("CALL sp_insert_pc(?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([
        $data['descripcion'],
        $data['id_almacen'],
        $data['id_tipo'],
        $data['precio'],
        $data['producto'],
        $urlImagen,           // ← URL generada aquí, no el base64
        $data['id_emisor'],
        $data['id_subcategoria'],
        $data['factor_unitario']
    ]);

    echo json_encode([
        "success"  => true,
        "message"  => "Insertado correctamente",
        "url_img"  => $urlImagen
    ]);

} catch (Exception $e) {
    // 🔥 Si falla la BD, eliminar la imagen física que ya se guardó
    if (isset($rutaFisica) && file_exists($rutaFisica)) {
        unlink($rutaFisica);
    }

    http_response_code(500);
    echo json_encode([
        "success" => false,
        "error"   => $e->getMessage()
    ]);
}