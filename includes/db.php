<?php
require_once 'config.php';

$conn = new mysqli(DB_SERVER, DB_USERNAME, DB_PASSWORD, DB_NAME);

if ($conn->connect_error) {
    die("Conexión fallida: " . $conn->connect_error);
}

// Mensaje de éxito para propósitos de depuración
// Este mensaje se puede eliminar más tarde
// echo "Conexión establecida de forma exitosa";
?>
