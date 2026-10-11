<?php
function getConnection() {
    static $pdo = null; 
    if ($pdo instanceof PDO) {
        return $pdo; 
    }
    $host = "193.203.166.238";
    $db   = "u428660411_soft_cake";  
    $user = "u428660411_soft_cake"; 
    $pass = 'I|VT@k2h';
    $port = "3306";
    try {
        $pdo = new PDO(
            "mysql:host=$host;port=$port;dbname=$db;charset=utf8",
            $user,
            $pass,
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_PERSISTENT => true 
            ]
        );
        $pdo->exec("SET time_zone = '-06:00'");
        return $pdo;
    } catch (PDOException $e) {
        header("Content-Type: application/json; charset=UTF-8");
        echo json_encode(["error" => "Error de conexión: " . $e->getMessage()]);
        exit;
    }
}
?>