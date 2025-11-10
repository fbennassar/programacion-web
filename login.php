<?php
// Iniciar la sesión
session_start();

// Si el usuario ya ha iniciado sesión, redirigirlo a la página de bienvenida
if (isset($_SESSION["loggedin"]) && $_SESSION["loggedin"] === true) {
    header("location: welcome.php");
    exit;
}

// Incluir el archivo de conexión a la base de datos
require_once "includes/db.php";

// Definir variables e inicializarlas con valores vacíos
$username = $password = "";
$username_err = $password_err = $login_err = "";

// Procesar los datos del formulario cuando se envía
if ($_SERVER["REQUEST_METHOD"] == "POST") {

    // Comprobar si el nombre de usuario está vacío
    if (empty(trim($_POST["username"]))) {
        $username_err = "Por favor, introduce tu usuario o correo.";
    } else {
        $username = trim($_POST["username"]);
    }

    // Comprobar si la contraseña está vacía
    if (empty(trim($_POST["password"]))) {
        $password_err = "Por favor, introduce tu contraseña.";
    } else {
        $password = trim($_POST["password"]);
    }

    // Validar las credenciales
    if (empty($username_err) && empty($password_err)) {
        // Preparar una sentencia SELECT
        $sql = "SELECT id, username, password_hash FROM users WHERE username = ?";

        if ($stmt = $conn->prepare($sql)) {
            // Vincular variables a la sentencia preparada como parámetros
            $stmt->bind_param("s", $param_username);

            // Establecer los parámetros
            $param_username = $username;

            // Intentar ejecutar la sentencia preparada
            if ($stmt->execute()) {
                // Almacenar el resultado
                $stmt->store_result();

                // Comprobar si el usuario existe, si es así, verificar la contraseña
                if ($stmt->num_rows == 1) {
                    // Vincular las variables del resultado
                    $stmt->bind_result($id, $username_db, $hashed_password);
                    if ($stmt->fetch()) {
                        if (password_verify($password, $hashed_password)) {
                            // La contraseña es correcta, así que iniciar una nueva sesión
                            session_start();

                            // Almacenar datos en las variables de sesión
                            $_SESSION["loggedin"] = true;
                            $_SESSION["id"] = $id;
                            $_SESSION["username"] = $username_db;

                            // Redirigir al usuario a la página de bienvenida
                            header("location: welcome.php");
                        } else {
                            // La contraseña no es válida, mostrar un mensaje de error genérico
                            $login_err = "Usuario o contraseña incorrectos.";
                        }
                    }
                } else {
                    // El usuario no existe, mostrar un mensaje de error genérico
                    $login_err = "Usuario o contraseña incorrectos.";
                }
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
    <title>Login - Mates Mágicas</title>
    <link rel="stylesheet" href="css/style.css">
</head>

<body>

    <div class="login-container">
        <svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 24 24">
            <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" 
            stroke-width="1.5" 
            d="M3.429 18.366h6M15 8.707h6m-6-4.39h6M3 6.512h3.429m0 0h3.428m-3.428 
            0V3m0 3.512v3.512M15.6 21l2.425-2.484m0 0l2.424-2.483m-2.424 2.483L15.6 16.033m2.425 2.483L20.449 21" />
        </svg>
        <h1>¡Bienvenido a Mates Mágicas!</h1>
        
        <?php 
        if(!empty($login_err)){
            echo '<div class="alert alert-danger">' . $login_err . '</div>';
        }        
        ?>

        <form action="<?php echo htmlspecialchars($_SERVER["PHP_SELF"]); ?>" method="post">
            <div class="input-group <?php echo (!empty($username_err)) ? 'has-error' : ''; ?>">
                <label for="username">Usuario o Correo</label>
                <div class="input-wrapper">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="#888" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                        <path d="M22 6L12 13L2 6" stroke="#888" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                    <input type="text" id="username" name="username" placeholder="Escribe tu usuario o correo" value="<?php echo $username; ?>">
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
            <button type="submit" class="login-btn">Iniciar Sesión</button>
            <a href="register.php" class="register-link">¿No tienes cuenta? ¡Regístrate!</a>
        </form>
    </div>

    <script src="js/main.js"></script>
</body>

</html>