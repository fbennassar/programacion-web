<?php
session_start();

// Comprobar si el usuario ha iniciado sesión
if (!isset($_SESSION["loggedin"]) || $_SESSION["loggedin"] !== true) {
    header("location: login.php");
    exit;
}

require_once "includes/db.php";

// Tipo y paginación: una sola vista con 3 páginas de 8 ejercicios
$tipo = isset($_GET['tipo']) && $_GET['tipo'] === 'restas' ? 'restas' : 'sumas';
$symbol = $tipo === 'restas' ? '-' : '+';
$page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
if ($page > 3) $page = 3;

// Asegurar existencia de la tabla operations
$create_table_sql = "CREATE TABLE IF NOT EXISTS operations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  code VARCHAR(32) NOT NULL,
  tipo CHAR(1) NOT NULL,
  a SMALLINT NOT NULL,
  b SMALLINT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  answered_at DATETIME NULL,
  INDEX (user_id),
  INDEX (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";

$conn->query($create_table_sql);

// Manejar peticiones AJAX
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
    header('Content-Type: application/json');
    $action = $_POST['action'];

    if ($action === 'check') {
        $op_id = intval($_POST['op_id']);
        $answer = intval($_POST['answer']);

        // Obtener operación desde la B/D
        $sql = "SELECT id, tipo, a, b, status FROM operations WHERE id = ? AND user_id = ? LIMIT 1";
        if ($stmt = $conn->prepare($sql)) {
            $stmt->bind_param('ii', $op_id, $_SESSION['id']);
            $stmt->execute();
            $res = $stmt->get_result();
            if ($row = $res->fetch_assoc()) {
                $correct = false;
                if ($row['tipo'] === 'S') {
                    $correct = ($row['a'] + $row['b']) === $answer;
                } else {
                    $correct = ($row['a'] - $row['b']) === $answer;
                }

                if ($correct) {
                    $upd = $conn->prepare("UPDATE operations SET status = 'done', answered_at = NOW() WHERE id = ? AND user_id = ?");
                    $upd->bind_param('ii', $op_id, $_SESSION['id']);
                    $upd->execute();
                }

                echo json_encode(['success' => true, 'correct' => $correct]);
                exit;
            } else {
                echo json_encode(['success' => false, 'error' => 'Operación no encontrada']);
                exit;
            }
        }
        echo json_encode(['success' => false, 'error' => 'Error en la consulta']);
        exit;
    }

    if ($action === 'reset') {
        // Eliminar todas las operaciones del usuario y crear 24 S y 24 R nuevas
        $del = $conn->prepare("DELETE FROM operations WHERE user_id = ?");
        $del->bind_param('i', $_SESSION['id']);
        $del->execute();

        $created = [];
        $insert_sql = "INSERT INTO operations (user_id, code, tipo, a, b, status, created_at) VALUES (?,?,?,?,?,'pending',NOW())";
        for ($t = 0; $t < 2; $t++) {
            $tipo_letter = $t === 0 ? 'S' : 'R';
            for ($i = 0; $i < 24; $i++) {
                // Para restas, asegurarnos que a >= b para evitar resultados negativos
                if ($tipo_letter === 'R') {
                    $a = rand(10, 99);
                    $b = rand(10, $a);
                } else {
                    $a = rand(10, 99);
                    $b = rand(10, 99);
                }
                $code = $tipo_letter . "-{$a}-{$b}";
                if ($stmt = $conn->prepare($insert_sql)) {
                    $stmt->bind_param('issii', $_SESSION['id'], $code, $tipo_letter, $a, $b);
                    $stmt->execute();
                    $created[] = ['id' => $stmt->insert_id, 'code' => $code, 'a' => $a, 'b' => $b, 'tipo' => $tipo_letter];
                    $stmt->close();
                }
            }
        }

        echo json_encode(['success' => true, 'created' => count($created)]);
        exit;
    }
}

// A este punto, asegurar que el usuario tiene 24 sumas y 24 restas en B/D
$ensure_sql = "SELECT tipo, COUNT(*) as cnt FROM operations WHERE user_id = ? GROUP BY tipo";
$have = ['S' => 0, 'R' => 0];
if ($stmt = $conn->prepare($ensure_sql)) {
    $stmt->bind_param('i', $_SESSION['id']);
    $stmt->execute();
    $res = $stmt->get_result();
    while ($r = $res->fetch_assoc()) {
        $have[$r['tipo']] = intval($r['cnt']);
    }
    $stmt->close();
}

$insert_sql = "INSERT INTO operations (user_id, code, tipo, a, b, status, created_at) VALUES (?,?,?,?,?,'pending',NOW())";
foreach (['S','R'] as $tipo_letter) {
    $needed = 24 - $have[$tipo_letter];
    for ($i = 0; $i < $needed; $i++) {
        // Para restas, asegurarnos que a >= b
        if ($tipo_letter === 'R') {
            $a = rand(10, 99);
            $b = rand(10, $a);
        } else {
            $a = rand(10, 99);
            $b = rand(10, 99);
        }
        $code = $tipo_letter . "-{$a}-{$b}";
        if ($stmt = $conn->prepare($insert_sql)) {
            $stmt->bind_param('issii', $_SESSION['id'], $code, $tipo_letter, $a, $b);
            $stmt->execute();
            $stmt->close();
        }
    }
}

// Obtener hasta 24 operaciones del tipo seleccionado (3 páginas de 8)
$operations = [];
$select_sql = "SELECT id, code, tipo, a, b, status FROM operations WHERE user_id = ? AND tipo = ? ORDER BY id ASC LIMIT 24";
if ($stmt = $conn->prepare($select_sql)) {
    $t_letter = $tipo === 'restas' ? 'R' : 'S';
    $stmt->bind_param('is', $_SESSION['id'], $t_letter);
    $stmt->execute();
    $res = $stmt->get_result();
    while ($r = $res->fetch_assoc()) {
        $operations[] = $r;
    }
    $stmt->close();
}

// Calcular progreso
$done_count = 0;
foreach ($operations as $op) if ($op['status'] === 'done') $done_count++;

// Slicing para la página actual
$total = count($operations);
$start = ($page - 1) * 8;
$page_ops = array_slice($operations, $start, 8);

?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo ucfirst($tipo); ?> - Mates Mágicas</title>
    <link rel="stylesheet" href="css/welcome.css">
    <link rel="stylesheet" href="css/ejercicios.css">
</head>
<body>
    <header class="main-header">
        <div class="header-content">
            <div class="logo-container">
                <span class="logo-text"><?php echo $tipo === 'restas' ? 'Restas' : 'Sumas'; ?></span>
            </div>
            <div class="user-info">
                <span>Hola, <strong><?php echo htmlspecialchars($_SESSION["username"]); ?></strong></span>
                <a href="welcome.php" class="logout-btn">Volver</a>
                <button id="resetBtn" class="logout-btn" style="margin-left:12px;">Reiniciar ejercicios</button>
            </div>
        </div>
    </header>

    <main class="ejercicios-container">
        <div class="progress-bar" style="max-width:1000px;margin:18px auto; text-align:center;">
            <strong>Progreso:</strong> <?php echo $done_count; ?> / <?php echo max(24, $total); ?> resueltos
        </div>

        <div class="grid">
            <?php foreach ($page_ops as $op): ?>
                <div class="card <?php echo ($op['status'] === 'done') ? 'done' : ''; ?>" data-id="<?php echo $op['id'] ?? 0; ?>" data-a="<?php echo $op['a']; ?>" data-b="<?php echo $op['b']; ?>" data-code="<?php echo $op['code']; ?>">
                    <div class="card-inner">
                        <?php
                        $sa = strval($op['a']);
                        $sb = strval($op['b']);
                        $maxLenSmall = max(strlen($sa), strlen($sb));
                        ?>
                        <div class="mini-calc" style="grid-template-columns: auto repeat(<?php echo $maxLenSmall; ?>, 1fr);">
                            <div class="mini-cell mini-empty"></div>
                            <?php
                            // top digits (A)
                            for ($i = 0; $i < $maxLenSmall; $i++) {
                                $idx = $i - ($maxLenSmall - strlen($sa));
                                $ch = $idx >= 0 ? $sa[$idx] : '';
                                echo "<div class=\"mini-cell mini-top\">" . htmlspecialchars($ch) . "</div>";
                            }
                            // bottom row: operator + digits B
                            echo "<div class=\"mini-cell mini-operator\">" . ($symbol) . "</div>";
                            for ($i = 0; $i < $maxLenSmall; $i++) {
                                $idx = $i - ($maxLenSmall - strlen($sb));
                                $ch = $idx >= 0 ? $sb[$idx] : '';
                                echo "<div class=\"mini-cell mini-bot\">" . htmlspecialchars($ch) . "</div>";
                            }
                            ?>
                        </div>
                        <div class="status"><?php
                            if ($op['status'] === 'done') {
                                if ($op['tipo'] === 'S') echo '✅ ' . ($op['a'] + $op['b']);
                                else echo '✅ ' . ($op['a'] - $op['b']);
                            } else {
                                echo 'Pendiente';
                            }
                        ?></div>
                    </div>
                </div>
            <?php endforeach; ?>
        </div>

        <div class="pagination" aria-label="Paginación de ejercicios">
            <?php for ($p = 1; $p <= 3; $p++): ?>
                <?php $isActive = $p === $page; ?>
                <a href="?tipo=<?php echo $tipo; ?>&page=<?php echo $p; ?>" class="page-dot <?php echo $isActive ? 'active' : ''; ?>" aria-label="Ir a página <?php echo $p; ?>" aria-current="<?php echo $isActive ? 'page' : 'false'; ?>">
                    <span class="dot-label"><?php echo $p; ?></span>
                    <span class="sr-only">Página <?php echo $p; ?></span>
                </a>
            <?php endfor; ?>
        </div>

        <div id="overlay" class="overlay hidden">
            <div class="overlay-content">
                <button id="closeOverlay" class="close-btn">✕</button>
                <div class="big-op">
                    <div class="big-numbers">
                        <span id="bigA">00</span>
                        <span class="big-sym"><?php echo $symbol; ?></span>
                        <span id="bigB">00</span>
                    </div>
                    <div id="answerDisplay" class="answer-display">—</div>
                </div>

                <div class="keypad" id="keypad">
                    <div class="row">
                        <button class="key">1</button>
                        <button class="key">2</button>
                        <button class="key">3</button>
                    </div>
                    <div class="row">
                        <button class="key">4</button>
                        <button class="key">5</button>
                        <button class="key">6</button>
                    </div>
                    <div class="row">
                        <button class="key">7</button>
                        <button class="key">8</button>
                        <button class="key">9</button>
                    </div>
                    <div class="row">
                        <button class="key">0</button>
                        <button id="clearBtn" class="key special">C</button>
                        <button id="submitBtn" class="key special">OK</button>
                    </div>
                </div>
                <div id="feedback" class="feedback"></div>
            </div>
        </div>
    </main>

    <script>
        const OPERATIONS = <?php echo json_encode($operations); ?>;
        const TIPO = '<?php echo ($tipo === 'restas' ? 'R' : 'S'); ?>';
    </script>
    <script src="js/ejercicios.js"></script>
</body>
</html>
