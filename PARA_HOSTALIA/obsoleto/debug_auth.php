<?php
/**
 * Debug de la API de autenticación
 */

// Headers CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Content-Type: application/json; charset=utf-8');

// Manejar preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Log de entrada
error_log("DEBUG AUTH: Método: " . $_SERVER['REQUEST_METHOD']);
error_log("DEBUG AUTH: Content-Type: " . ($_SERVER['CONTENT_TYPE'] ?? 'NO DEFINIDO'));

// Obtener datos de entrada
$input = file_get_contents('php://input');
error_log("DEBUG AUTH: Input raw: " . $input);

$data = json_decode($input, true);
if (json_last_error() !== JSON_ERROR_NONE) {
    error_log("DEBUG AUTH: Error JSON: " . json_last_error_msg());
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'data' => null,
        'message' => 'JSON inválido: ' . json_last_error_msg(),
        'timestamp' => date('Y-m-d H:i:s')
    ]);
    exit();
}

$action = $data['action'] ?? '';
error_log("DEBUG AUTH: Acción: " . $action);

// Cargar configuración
try {
    require_once 'sistema_apps_api/mundoletras/config.php';
    error_log("DEBUG AUTH: Config cargado correctamente");
} catch (Exception $e) {
    error_log("DEBUG AUTH: Error cargando config: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'data' => null,
        'message' => 'Error de configuración: ' . $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ]);
    exit();
}

// Verificar conexión a BD
if (!isset($db) || !$db) {
    error_log("DEBUG AUTH: Variable \$db no disponible");
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'data' => null,
        'message' => 'Error de conexión a base de datos',
        'timestamp' => date('Y-m-d H:i:s')
    ]);
    exit();
}

error_log("DEBUG AUTH: Conexión a BD OK");

// Procesar acción
switch ($action) {
    case 'register':
        handleRegisterDebug($data);
        break;
    case 'test':
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'data' => null,
            'message' => 'Acción no válida (esto es esperado)',
            'timestamp' => date('Y-m-d H:i:s')
        ]);
        break;
    default:
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'data' => null,
            'message' => 'Acción no válida: ' . $action,
            'timestamp' => date('Y-m-d H:i:s')
        ]);
}

function handleRegisterDebug($input) {
    global $db;
    
    error_log("DEBUG REGISTER: Iniciando registro");
    
    // Validar campos
    $email = $input['email'] ?? '';
    $password = $input['password'] ?? '';
    $nombre = $input['nombre'] ?? '';
    
    error_log("DEBUG REGISTER: Email: $email, Nombre: $nombre, Password length: " . strlen($password));
    
    if (empty($email) || empty($password) || empty($nombre)) {
        error_log("DEBUG REGISTER: Campos vacíos");
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'data' => null,
            'message' => 'Todos los campos son obligatorios',
            'timestamp' => date('Y-m-d H:i:s')
        ]);
        return;
    }
    
    try {
        $userKey = $email . '_mundoletras';
        error_log("DEBUG REGISTER: UserKey: $userKey");
        
        // Verificar si existe
        $existing = $db->fetchOne(
            "SELECT usuario_aplicacion_id FROM usuarios_aplicaciones WHERE usuario_aplicacion_key = ?",
            [$userKey]
        );
        
        if ($existing) {
            error_log("DEBUG REGISTER: Usuario ya existe");
            http_response_code(409);
            echo json_encode([
                'success' => false,
                'data' => null,
                'message' => 'El usuario ya existe',
                'timestamp' => date('Y-m-d H:i:s')
            ]);
            return;
        }
        
        // Insertar usuario
        $verificationCode = sprintf('%06d', mt_rand(100000, 999999));
        $verificationExpiry = date('Y-m-d H:i:s', time() + 3600);
        $passwordHash = password_hash($password . 'MundoLetras_Salt_2024', PASSWORD_DEFAULT);
        
        error_log("DEBUG REGISTER: Insertando usuario...");
        
        $result = $db->query(
            "INSERT INTO usuarios_aplicaciones (
                usuario_aplicacion_key, email, nombre, password_hash, app_codigo,
                verification_code, verification_expiry, fecha_registro, activo
            ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), 0)",
            [$userKey, $email, $nombre, $passwordHash, 'mundoletras', $verificationCode, $verificationExpiry]
        );
        
        if ($result) {
            $userId = $db->lastInsertId();
            error_log("DEBUG REGISTER: Usuario insertado con ID: $userId");
            
            // Crear progreso
            $progressResult = $db->query(
                "INSERT INTO mundoletras_progreso (usuario_aplicacion_key, nivel_max, monedas) VALUES (?, 1, ?)",
                [$userKey, 50]
            );
            
            if ($progressResult) {
                error_log("DEBUG REGISTER: Progreso creado");
            } else {
                error_log("DEBUG REGISTER: Error creando progreso");
            }
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => [
                    'user_id' => $userId,
                    'email_sent' => false
                ],
                'message' => 'Usuario registrado correctamente',
                'timestamp' => date('Y-m-d H:i:s')
            ]);
        } else {
            error_log("DEBUG REGISTER: Error insertando usuario");
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'data' => null,
                'message' => 'Error insertando usuario',
                'timestamp' => date('Y-m-d H:i:s')
            ]);
        }
        
    } catch (Exception $e) {
        error_log("DEBUG REGISTER: Exception: " . $e->getMessage());
        error_log("DEBUG REGISTER: Trace: " . $e->getTraceAsString());
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'data' => null,
            'message' => 'Error en el registro: ' . $e->getMessage(),
            'timestamp' => date('Y-m-d H:i:s')
        ]);
    }
}
?>
