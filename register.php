<?php
// Incluir el archivo de conexión a la base de datos
require_once "includes/db.php";

// Definir variables e inicializarlas con valores vacíos
$username = $password = $confirm_password = "";
$username_err = $password_err = $confirm_password_err = "";

// Procesar los datos del formulario cuando se envía
if ($_SERVER["REQUEST_METHOD"] == "POST") {

    // Validar nombre de usuario
    if (empty(trim($_POST["username"]))) {
        $username_err = "Por favor, introduce un nombre de usuario.";
    } else {
        // Preparar una sentencia SELECT para comprobar si el usuario ya existe
        $sql = "SELECT id FROM users WHERE username = ?";
        
        if ($stmt = $conn->prepare($sql)) {
            $stmt->bind_param("s", $param_username);
            $param_username = trim($_POST["username"]);
            
            if ($stmt->execute()) {
                $stmt->store_result();
                
                if ($stmt->num_rows == 1) {
                    $username_err = "Este nombre de usuario ya está en uso.";
                } else {
                    $username = trim($_POST["username"]);
                }
            } else {
                echo "¡Ups! Algo salió mal. Por favor, inténtalo de nuevo más tarde.";
            }
            $stmt->close();
        }
    }

    // Validar contraseña
    if (empty(trim($_POST["password"]))) {
        $password_err = "Por favor, introduce una contraseña.";     
    } elseif (strlen(trim($_POST["password"])) < 6) {
        $password_err = "La contraseña debe tener al menos 6 caracteres.";
    } else {
        $password = trim($_POST["password"]);
    }
    
    // Validar la confirmación de la contraseña
    if (empty(trim($_POST["confirm_password"]))) {
        $confirm_password_err = "Por favor, confirma la contraseña.";     
    } else {
        $confirm_password = trim($_POST["confirm_password"]);
        if (empty($password_err) && ($password != $confirm_password)) {
            $confirm_password_err = "Las contraseñas no coinciden.";
        }
    }
    
    // Comprobar si hay errores antes de insertar en la base de datos
    if (empty($username_err) && empty($password_err) && empty($confirm_password_err)) {
        
        // Preparar una sentencia INSERT
        $sql = "INSERT INTO users (username, password_hash) VALUES (?, ?)";
         
        if ($stmt = $conn->prepare($sql)) {
            // Vincular variables a la sentencia preparada como parámetros
            $stmt->bind_param("ss", $param_username, $param_password);
            
            // Establecer los parámetros
            $param_username = $username;
            $param_password = password_hash($password, PASSWORD_DEFAULT); // Hashear la contraseña
            
            // Intentar ejecutar la sentencia preparada
            if ($stmt->execute()) {
                // Redirigir a la página de login
                header("location: login.php");
            } else {
                echo "¡Ups! Algo salió mal. Por favor, inténtalo de nuevo más tarde.";
            }

            // Cerrar la sentencia
            $stmt->close();
        }
    }
    
    // Cerrar la conexión
    $conn->close();
}
?>

<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Registro - Mates Mágicas</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>

    <div class="login-container">
        <h1>Crea tu Cuenta</h1>
        <p>Por favor, completa este formulario para crear una cuenta.</p>
        <form action="<?php echo htmlspecialchars($_SERVER["PHP_SELF"]); ?>" method="post">
            <div class="input-group <?php echo (!empty($username_err)) ? 'has-error' : ''; ?>">
                <label for="username">Usuario</label>
                <div class="input-wrapper">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20 21V19C20 16.7909 18.2091 15 16 15H8C5.79086 15 4 16.7909 4 19V21" stroke="#888" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="#888" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <input type="text" id="username" name="username" placeholder="Escribe tu usuario" value="<?php echo $username; ?>">
                </div>
                <span class="help-block"><?php echo $username_err; ?></span>
            </div>
            <div class="input-group <?php echo (!empty($password_err)) ? 'has-error' : ''; ?>">
                <label for="password">Contraseña</label>
                <div class="input-wrapper">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M7 11V7C7 4.23858 9.23858 2 12 2C14.7614 2 17 4.23858 17 7V11" stroke="#888" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                        <path d="M5 11H19V21C19 21.5523 18.5523 22 18 22H6C5.44772 22 5 21.5523 5 21V11Z" stroke="#888" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                        <path d="M12 15V18" stroke="#888" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                    <input type="password" id="password" name="password" placeholder="Escribe tu contraseña">
                </div>
                <span class="help-block"><?php echo $password_err; ?></span>
            </div>
            <div class="input-group <?php echo (!empty($confirm_password_err)) ? 'has-error' : ''; ?>">
                <label for="confirm_password">Confirma tu Contraseña</label>
                <div class="input-wrapper">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M7 11V7C7 4.23858 9.23858 2 12 2C14.7614 2 17 4.23858 17 7V11" stroke="#888" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                        <path d="M5 11H19V21C19 21.5523 18.5523 22 18 22H6C5.44772 22 5 21.5523 5 21V11Z" stroke="#888" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                        <path d="M12 15V18" stroke="#888" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                    <input type="password" id="confirm_password" name="confirm_password" placeholder="Confirma tu contraseña">
                </div>
                <span class="help-block"><?php echo $confirm_password_err; ?></span>
            </div>
            <div class="input-group">
                <button type="submit" class="login-btn">Registrarse</button>
            </div>
            <p>¿Ya tienes una cuenta? <a href="login.php" class="register-link">Inicia sesión aquí</a>.</p>
        </form>
    </div>

</body>
</html>
