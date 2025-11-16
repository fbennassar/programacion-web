<?php
session_start();

// Comprobar si el usuario ha iniciado sesión, si no, redirigirlo a la página de login
if (!isset($_SESSION["loggedin"]) || $_SESSION["loggedin"] !== true) {
    header("location: login.php");
    exit;
}
?>

<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bienvenido - Mates Mágicas</title>
    <link rel="stylesheet" href="css/welcome.css">
</head>
<body>

    <header class="main-header">
        <div class="header-content">
            <div class="logo-container">
                <span class="logo-text">¡A practicar Mates!</span>
            </div>
            <div class="user-info">
                <span>Hola, <strong><?php echo htmlspecialchars($_SESSION["username"]); ?></strong></span>
                <a href="logout.php" class="logout-btn">Cerrar Sesión</a>
            </div>
        </div>
    </header>

    <main class="welcome-container">
        <div class="welcome-content">
            <h1>¿Qué vamos a practicar hoy?</h1>
            <p>¡Elige una opción para empezar!</p>
            <div class="options-container">
                <a href="ejercicios.php?tipo=sumas" class="option-card option-sumas">
                    <span class="option-icon">+</span>
                    <span class="option-text">Sumas</span>
                </a>
                <a href="ejercicios.php?tipo=restas" class="option-card option-restas">
                    <span class="option-icon">-</span>
                    <span class="option-text">Restas</span>
                </a>
            </div>
        </div>
    </main>

</body>
</html>