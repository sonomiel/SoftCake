<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["success" => false, "mensaje" => "Método no permitido"]);
    exit();
}

require_once __DIR__ . '/../../../conexion/conexion.php';

try {
    $body     = json_decode(file_get_contents("php://input"), true);
    $username = trim($body['username'] ?? '');
    $password = $body['password'] ?? '';

    if (empty($username) || empty($password)) {
        http_response_code(400);
        echo json_encode([
            "success" => false,
            "mensaje" => "username y password son requeridos"
        ]);
        exit();
    }

    $pdo = getConnection();

    // ✅ Paso 1: obtener el hash almacenado en BD
    $stmtHash = $pdo->prepare(
        "SELECT password FROM seg_usuarios 
         WHERE username = :username 
           AND estatus = 1 
           AND fecha_fin >= CURDATE() 
         LIMIT 1"
    );
    $stmtHash->bindParam(':username', $username, PDO::PARAM_STR);
    $stmtHash->execute();
    $userRow = $stmtHash->fetch(PDO::FETCH_ASSOC);

    if (!$userRow) {
        http_response_code(401);
        echo json_encode([
            "success" => false,
            "mensaje" => "Usuario no encontrado o inactivo"
        ]);
        exit();
    }

    // ✅ Paso 2: verificar contraseña con password_verify
    if (!password_verify($password, $userRow['password'])) {
        http_response_code(401);
        echo json_encode([
            "success" => false,
            "mensaje" => "Contraseña incorrecta"
        ]);
        exit();
    }

    // ✅ Paso 3: llamar al SP pasando el hash (para que v_stored_password = p_password sea true)
    $stmt = $pdo->prepare("CALL sp_validar(:username, :password)");
    $stmt->bindParam(':username', $username,              PDO::PARAM_STR);
    $stmt->bindParam(':password', $userRow['password'],   PDO::PARAM_STR); // ← hash, no texto plano
    $stmt->execute();
    $result = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$result || $result['valido'] != 1) {
        http_response_code(401);
        echo json_encode([
            "success" => false,
            "mensaje" => $result['mensaje'] ?? "Error al obtener datos"
        ]);
        exit();
    }

    http_response_code(200);
        echo json_encode([
            "success" => true,
            "token"   => bin2hex(random_bytes(32)),
            "data"    => [
                "id_usuario"    => $result['id_usuario'],
                "username"      => $result['username'],
                "id_emisor"     => $result['id_emisor'],
                "nombre"        => $result['nombre'],
                "rfc"           => $result['rfc'],
                "telefono"      => $result['telefono'],
                "ids_roles"     => $result['ids_roles'],
                "ids_permisos"  => $result['ids_permisos'],
                "ids_modulos"   => $result['ids_modulos'],
                "dias_restantes" => (int)$result['dias_restantes'],  
                "mensaje"       => $result['mensaje'],
            ]
        ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "error"   => "Database Error",
        "message" => $e->getMessage(),
        "code"    => $e->getCode()
    ]);
}