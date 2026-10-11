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
        !isset($data['id_modificadores']) ||
        !is_array($data['id_modificadores']) ||
        !isset($data['id_prod_carta'])       ||
        !isset($data['id_emisor'])
    ) {
        throw new Exception("Faltan parámetros requeridos");
    }

    $pdo->beginTransaction();

    // 1️⃣ Borrar todos los modificadores anteriores del producto
    $stmtDel = $pdo->prepare("CALL sp_delete_md_c(?, ?)");
    $stmtDel->execute([
        $data['id_prod_carta'],
        $data['id_emisor']
    ]);
    $stmtDel->closeCursor();

    // 2️⃣ Reinsertar solo los seleccionados (si hay)
    if (!empty($data['id_modificadores'])) {
        $stmt = $pdo->prepare("CALL sp_insert_md_c(?, ?, ?)");
        foreach ($data['id_modificadores'] as $id_modificador) {
            $stmt->execute([
                $id_modificador,
                $data['id_prod_carta'],
                $data['id_emisor']
            ]);
            $stmt->closeCursor();
        }
    }

    $pdo->commit();

    echo json_encode([
        "success" => true,
        "message" => "Guardado correctamente",
        "total"   => count($data['id_modificadores'])
    ]);

} catch (Exception $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }

    http_response_code(500);
    echo json_encode([
        "success" => false,
        "error"   => $e->getMessage()
    ]);
}