<?php
/**
 * API de Autenticación - Mundo Letras
 * Maneja login, registro y verificación de usuarios
 */

// Activar reporte de errores para debugging
error_reporting(E_ALL);
ini_set('display_errors', 0); // No mostrar errores en pantalla
ini_set('log_errors', 1);

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

// Cargar configuración
try {
    require_once 'config.php';
} catch (Exception $e) {
    error_log("Error cargando config.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'data' => null,
        'message' => 'Error de configuración: ' . $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ]);
    exit();
} catch (Error $e) {
    error_log("Error fatal cargando config.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'data' => null,
        'message' => 'Error fatal de configuración',
        'timestamp' => date('Y-m-d H:i:s')
    ]);
    exit();
}

// Obtener datos de entrada
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (json_last_error() !== JSON_ERROR_NONE) {
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

try {
    switch ($action) {
        case 'register':
            handleRegister($data);
            break;
        case 'verify':
            handleVerify($data);
            break;
        case 'login':
            handleLogin($data);
            break;
        case 'refresh':
            handleRefresh($data);
            break;
        case 'forgot_password':
            handleForgotPassword($data);
            break;
        case 'reset_password':
            handleResetPassword($data);
            break;
        default:
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'data' => null,
                'message' => 'Acción no válida: ' . $action,
                'timestamp' => date('Y-m-d H:i:s')
            ]);
            exit();
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'data' => null,
        'message' => 'Error interno del servidor',
        'timestamp' => date('Y-m-d H:i:s')
    ]);
    exit();
} catch (Error $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'data' => null,
        'message' => 'Error fatal del servidor',
        'timestamp' => date('Y-m-d H:i:s')
    ]);
    exit();
}

/**
 * Registrar nuevo usuario
 */
function handleRegister($input) {
    global $db;
    
    // Validar campos
    $email = $input['email'] ?? '';
    $password = $input['password'] ?? '';
    $nombre = $input['nombre'] ?? '';
    $nick = $input['nick'] ?? '';
    
    if (empty($email) || empty($password) || empty($nombre) || empty($nick)) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'data' => null,
            'message' => 'Todos los campos son obligatorios',
            'timestamp' => date('Y-m-d H:i:s')
        ]);
        return;
    }
    
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'data' => null,
            'message' => 'Email no válido',
            'timestamp' => date('Y-m-d H:i:s')
        ]);
        return;
    }
    
    // Validar que el nick no contenga espacios
    if (strpos($nick, ' ') !== false) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'data' => null,
            'message' => 'El nick no puede contener espacios',
            'timestamp' => date('Y-m-d H:i:s')
        ]);
        return;
    }
    
    if (strlen($password) < 6) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'data' => null,
            'message' => 'La contraseña debe tener al menos 6 caracteres',
            'timestamp' => date('Y-m-d H:i:s')
        ]);
        return;
    }
    
    try {
        $userKey = $email . '_mundoletras';
        
        // Verificar si existe el email
        $existingEmail = $db->fetchOne(
            "SELECT usuario_aplicacion_id FROM usuarios_aplicaciones WHERE usuario_aplicacion_key = ?",
            [$userKey]
        );
        
        if ($existingEmail) {
            http_response_code(409);
            echo json_encode([
                'success' => false,
                'data' => null,
                'message' => 'Ya existe un usuario con este correo electrónico',
                'timestamp' => date('Y-m-d H:i:s')
            ]);
            return;
        }
        
        // Verificar si existe el nick
        $existingNick = $db->fetchOne(
            "SELECT usuario_aplicacion_id FROM usuarios_aplicaciones WHERE nick = ? AND app_codigo = 'mundoletras'",
            [$nick]
        );
        
        if ($existingNick) {
            http_response_code(409);
            echo json_encode([
                'success' => false,
                'data' => null,
                'message' => 'El nick ya existe. Elija otro.',
                'timestamp' => date('Y-m-d H:i:s')
            ]);
            return;
        }
        
        // Insertar usuario
        $verificationCode = sprintf('%06d', mt_rand(100000, 999999));
        $verificationExpiry = date('Y-m-d H:i:s', time() + 3600);
        $passwordHash = password_hash($password . 'MundoLetras_Salt_2024', PASSWORD_DEFAULT);
        
        $result = $db->query(
            "INSERT INTO usuarios_aplicaciones (
                usuario_aplicacion_key, email, nombre, nick, password_hash, app_codigo,
                verification_code, verification_expiry, fecha_registro, activo
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), 0)",
            [$userKey, $email, $nombre, $nick, $passwordHash, 'mundoletras', $verificationCode, $verificationExpiry]
        );
        
        if ($result) {
            $userId = $db->lastInsertId();
            
            // Crear progreso
            $progressResult = $db->query(
                "INSERT INTO mundoletras_progreso (usuario_aplicacion_key, nivel_max, monedas) VALUES (?, 1, ?)",
                [$userKey, 50]
            );
            
            // Enviar email (opcional)
            $emailSent = false;
            try {
                $emailSent = Utils::sendVerificationEmail($email, $nombre, $verificationCode);
            } catch (Exception $e) {
                // Email no es crítico
            }
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => [
                    'user_id' => $userId,
                    'email_sent' => $emailSent
                ],
                'message' => 'Usuario registrado correctamente',
                'timestamp' => date('Y-m-d H:i:s')
            ]);
        } else {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'data' => null,
                'message' => 'Error insertando usuario',
                'timestamp' => date('Y-m-d H:i:s')
            ]);
        }
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'data' => null,
            'message' => 'Error en el registro: ' . $e->getMessage(),
            'timestamp' => date('Y-m-d H:i:s')
        ]);
    }
}

/**
 * Verificar código de email
 */
function handleVerify($input) {
    global $db;
    
    $code = $input['code'] ?? '';
    
    if (empty($code)) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'data' => null,
            'message' => 'Código de verificación requerido',
            'timestamp' => date('Y-m-d H:i:s')
        ]);
        return;
    }
    
    try {
        // Buscar usuario por código
        $user = $db->fetchOne(
            "SELECT usuario_aplicacion_id, usuario_aplicacion_key, email, nombre, verification_expiry 
             FROM usuarios_aplicaciones 
             WHERE verification_code = ? AND activo = 0",
            [$code]
        );
        
        if (!$user) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'data' => null,
                'message' => 'Código de verificación inválido',
                'timestamp' => date('Y-m-d H:i:s')
            ]);
            return;
        }
        
        // Verificar si no ha expirado
        if (strtotime($user['verification_expiry']) < time()) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'data' => null,
                'message' => 'Código de verificación expirado',
                'timestamp' => date('Y-m-d H:i:s')
            ]);
            return;
        }
        
        // Activar usuario
        $db->query(
            "UPDATE usuarios_aplicaciones 
             SET activo = 1, verified_at = NOW(), verification_code = NULL, verification_expiry = NULL 
             WHERE usuario_aplicacion_id = ?",
            [$user['usuario_aplicacion_id']]
        );
        
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'data' => [
                'user_id' => $user['usuario_aplicacion_id'],
                'email' => $user['email'],
                'nombre' => $user['nombre']
            ],
            'message' => 'Cuenta verificada correctamente',
            'timestamp' => date('Y-m-d H:i:s')
        ]);
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'data' => null,
            'message' => 'Error en la verificación: ' . $e->getMessage(),
            'timestamp' => date('Y-m-d H:i:s')
        ]);
    }
}

/**
 * Iniciar sesión
 */
function handleLogin($input) {
    global $db;
    
    $email = $input['email'] ?? '';
    $password = $input['password'] ?? '';
    
    if (empty($email) || empty($password)) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'data' => null,
            'message' => 'Email y contraseña requeridos',
            'timestamp' => date('Y-m-d H:i:s')
        ]);
        return;
    }
    
    try {
        $userKey = $email . '_mundoletras';
        
        // Buscar usuario
        $user = $db->fetchOne(
            "SELECT usuario_aplicacion_id, usuario_aplicacion_key, email, nombre, nick, password_hash, activo
             FROM usuarios_aplicaciones 
             WHERE usuario_aplicacion_key = ?",
            [$userKey]
        );
        
        if (!$user) {
            http_response_code(401);
            echo json_encode([
                'success' => false,
                'data' => null,
                'message' => 'Credenciales incorrectas',
                'timestamp' => date('Y-m-d H:i:s')
            ]);
            return;
        }
        
        if (!$user['activo']) {
            http_response_code(401);
            echo json_encode([
                'success' => false,
                'data' => null,
                'message' => 'Cuenta no verificada. Revisa tu email.',
                'timestamp' => date('Y-m-d H:i:s')
            ]);
            return;
        }
        
        if (!password_verify($password . 'MundoLetras_Salt_2024', $user['password_hash'])) {
            http_response_code(401);
            echo json_encode([
                'success' => false,
                'data' => null,
                'message' => 'Credenciales incorrectas',
                'timestamp' => date('Y-m-d H:i:s')
            ]);
            return;
        }
        
        // Actualizar último acceso
        $db->query(
            "UPDATE usuarios_aplicaciones SET last_login = NOW(), ultimo_acceso = NOW() WHERE usuario_aplicacion_id = ?",
            [$user['usuario_aplicacion_id']]
        );
        
        // Obtener progreso
        $progress = $db->fetchOne(
            "SELECT nivel_max, monedas, actualizado_at FROM mundoletras_progreso WHERE usuario_aplicacion_key = ?",
            [$user['usuario_aplicacion_key']]
        );
        
        if (!$progress) {
            // Crear progreso inicial si no existe
            $db->query(
                "INSERT INTO mundoletras_progreso (usuario_aplicacion_key, nivel_max, monedas) VALUES (?, 1, ?)",
                [$user['usuario_aplicacion_key'], 50]
            );
            
            $progress = [
                'nivel_max' => 1,
                'monedas' => 50,
                'actualizado_at' => date('Y-m-d H:i:s')
            ];
        }
        
        // Preparar respuesta
        $userData = [
            'usuario_aplicacion_id' => $user['usuario_aplicacion_id'],
            'usuario_aplicacion_key' => $user['usuario_aplicacion_key'],
            'email' => $user['email'],
            'nombre' => $user['nombre'],
            'nick' => $user['nick'],
            'app_codigo' => 'mundoletras',
            'verified_at' => date('Y-m-d H:i:s'),
            'last_login' => date('Y-m-d H:i:s')
        ];
        
        $progressData = [
            'usuario_aplicacion_key' => $user['usuario_aplicacion_key'],
            'nivel_max' => (int)$progress['nivel_max'],
            'monedas' => (int)$progress['monedas'],
            'actualizado_at' => $progress['actualizado_at']
        ];
        
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'data' => [
                'user' => $userData,
                'progress' => $progressData
            ],
            'message' => 'Login exitoso',
            'timestamp' => date('Y-m-d H:i:s')
        ]);
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'data' => null,
            'message' => 'Error en el login: ' . $e->getMessage(),
            'timestamp' => date('Y-m-d H:i:s')
        ]);
    }
}

/**
 * Refrescar sesión (placeholder para futuras implementaciones JWT)
 */
function handleRefresh($input) {
    http_response_code(501);
    echo json_encode([
        'success' => false,
        'data' => null,
        'message' => 'Funcionalidad no implementada aún',
        'timestamp' => date('Y-m-d H:i:s')
    ]);
}

/**
 * Manejar olvido de contraseña
 */
function handleForgotPassword($input) {
    global $db;
    
    $email = $input['email'] ?? '';
    
    if (empty($email)) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'data' => null,
            'message' => 'Email requerido',
            'timestamp' => date('Y-m-d H:i:s')
        ]);
        return;
    }
    
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'data' => null,
            'message' => 'Email no válido',
            'timestamp' => date('Y-m-d H:i:s')
        ]);
        return;
    }
    
    // Verificar que el email existe
    $user = $db->fetchOne(
        "SELECT usuario_aplicacion_id, email, nombre, nick FROM usuarios_aplicaciones 
         WHERE email = ? AND app_codigo = 'mundoletras'",
        [$email]
    );
    
    if (!$user) {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'data' => null,
            'message' => 'Email no encontrado',
            'timestamp' => date('Y-m-d H:i:s')
        ]);
        return;
    }
    
    // Generar código de 6 dígitos (igual que en registro)
    $verificationCode = sprintf('%06d', mt_rand(100000, 999999));
    $verificationExpiry = date('Y-m-d H:i:s', time() + 900); // 15 minutos
    
    // Actualizar código en la base de datos
    $result = $db->query(
        "UPDATE usuarios_aplicaciones 
         SET verification_code = ?, verification_expiry = ? 
         WHERE email = ? AND app_codigo = 'mundoletras'",
        [$verificationCode, $verificationExpiry, $email]
    );
    
    if ($result) {
        // Enviar email de recuperación
        $emailSent = false;
        try {
            $emailSent = Utils::sendPasswordResetEmail($email, $user['nombre'], $verificationCode);
        } catch (Exception $e) {
            // Email no es crítico
        }
        
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'data' => [
                'email' => $email,
                'email_sent' => $emailSent,
                'message' => $emailSent ? 'Código enviado por email' : 'Código generado (revisa logs)'
            ],
            'message' => 'Código de recuperación enviado',
            'timestamp' => date('Y-m-d H:i:s')
        ]);
    } else {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'data' => null,
            'message' => 'Error generando código de recuperación',
            'timestamp' => date('Y-m-d H:i:s')
        ]);
    }
}

/**
 * Manejar cambio de contraseña
 */
function handleResetPassword($input) {
    global $db;
    
    $email = $input['email'] ?? '';
    $code = $input['code'] ?? '';
    $newPassword = $input['new_password'] ?? '';
    
    if (empty($email) || empty($code) || empty($newPassword)) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'data' => null,
            'message' => 'Todos los campos son requeridos',
            'timestamp' => date('Y-m-d H:i:s')
        ]);
        return;
    }
    
    if (strlen($newPassword) < 6) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'data' => null,
            'message' => 'La contraseña debe tener al menos 6 caracteres',
            'timestamp' => date('Y-m-d H:i:s')
        ]);
        return;
    }
    
    // Verificar código válido y no expirado (igual que en verificación de registro)
    $user = $db->fetchOne(
        "SELECT usuario_aplicacion_id, email, nombre, nick FROM usuarios_aplicaciones 
         WHERE email = ? AND verification_code = ? AND verification_expiry > NOW() AND app_codigo = 'mundoletras'",
        [$email, $code]
    );
    
    if (!$user) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'data' => null,
            'message' => 'Código inválido o expirado',
            'timestamp' => date('Y-m-d H:i:s')
        ]);
        return;
    }
    
    // Actualizar contraseña (usando el mismo hash que en registro)
    $passwordHash = password_hash($newPassword . 'MundoLetras_Salt_2024', PASSWORD_DEFAULT);
    
    $result = $db->query(
        "UPDATE usuarios_aplicaciones 
         SET password_hash = ?, verification_code = NULL, verification_expiry = NULL 
         WHERE email = ? AND app_codigo = 'mundoletras'",
        [$passwordHash, $email]
    );
    
    if ($result) {
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'data' => [
                'email' => $email,
                'message' => 'Contraseña actualizada'
            ],
            'message' => 'Contraseña cambiada exitosamente',
            'timestamp' => date('Y-m-d H:i:s')
        ]);
    } else {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'data' => null,
            'message' => 'Error actualizando contraseña',
            'timestamp' => date('Y-m-d H:i:s')
        ]);
    }
}
?>
