<?php
/**
 * API de Autenticación - Mundo Letras
 * Maneja login, registro y verificación de usuarios
 */

require_once 'config.php';

// Obtener datos de entrada
$input = Utils::getJsonInput();
$action = $input['action'] ?? '';

switch ($action) {
    case 'register':
        handleRegister($input);
        break;
    case 'verify':
        handleVerify($input);
        break;
    case 'login':
        handleLogin($input);
        break;
    case 'refresh':
        handleRefresh($input);
        break;
    default:
        Utils::jsonResponse(false, null, 'Acción no válida', 400);
}

/**
 * Registrar nuevo usuario
 */
function handleRegister($input) {
    global $db;
    
    // Validar campos requeridos
    $email = Utils::sanitizeInput($input['email'] ?? '');
    $password = $input['password'] ?? '';
    $nombre = Utils::sanitizeInput($input['nombre'] ?? '');
    $appCodigo = $input['app_codigo'] ?? APP_CODIGO;
    
    if (empty($email) || empty($password) || empty($nombre)) {
        Utils::jsonResponse(false, null, 'Todos los campos son obligatorios', 400);
    }
    
    if (!Utils::validateEmail($email)) {
        Utils::jsonResponse(false, null, 'Email no válido', 400);
    }
    
    if (strlen($password) < 6) {
        Utils::jsonResponse(false, null, 'La contraseña debe tener al menos 6 caracteres', 400);
    }
    
    try {
        $userKey = Utils::generateUserKey($email, $appCodigo);
        
        // Verificar si el usuario ya existe
        $existingUser = $db->fetchOne(
            "SELECT usuario_aplicacion_id FROM usuarios_aplicaciones WHERE usuario_aplicacion_key = ?",
            [$userKey]
        );
        
        if ($existingUser) {
            Utils::jsonResponse(false, null, 'El usuario ya existe', 409);
        }
        
        // Generar código de verificación
        $verificationCode = Utils::generateVerificationCode();
        $verificationExpiry = date('Y-m-d H:i:s', time() + VERIFICATION_CODE_EXPIRY);
        $passwordHash = Utils::hashPassword($password);
        
        // Insertar usuario
        $db->query(
            "INSERT INTO usuarios_aplicaciones (
                usuario_aplicacion_key, email, nombre, password_hash, app_codigo,
                verification_code, verification_expiry, fecha_registro, activo
            ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), 0)",
            [$userKey, $email, $nombre, $passwordHash, $appCodigo, $verificationCode, $verificationExpiry]
        );
        
        $userId = $db->lastInsertId();
        
        // Crear progreso inicial
        $db->query(
            "INSERT INTO mundoletras_progreso (usuario_aplicacion_key, nivel_max, monedas) VALUES (?, 1, ?)",
            [$userKey, DEFAULT_COINS]
        );
        
        // Enviar email de verificación
        $emailSent = Utils::sendVerificationEmail($email, $nombre, $verificationCode);
        
        if (!$emailSent) {
            Utils::logError("Error enviando email de verificación", ['email' => $email, 'user_id' => $userId]);
        }
        
        Utils::jsonResponse(true, [
            'user_id' => $userId,
            'email_sent' => $emailSent
        ], 'Usuario registrado. Revisa tu email para el código de verificación.');
        
    } catch (Exception $e) {
        Utils::logError("Error en registro", ['email' => $email, 'error' => $e->getMessage()]);
        Utils::jsonResponse(false, null, 'Error en el registro', 500);
    }
}

/**
 * Verificar código de email
 */
function handleVerify($input) {
    global $db;
    
    $code = Utils::sanitizeInput($input['code'] ?? '');
    
    if (empty($code)) {
        Utils::jsonResponse(false, null, 'Código de verificación requerido', 400);
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
            Utils::jsonResponse(false, null, 'Código de verificación inválido', 400);
        }
        
        // Verificar si no ha expirado
        if (strtotime($user['verification_expiry']) < time()) {
            Utils::jsonResponse(false, null, 'Código de verificación expirado', 400);
        }
        
        // Activar usuario
        $db->query(
            "UPDATE usuarios_aplicaciones 
             SET activo = 1, verified_at = NOW(), verification_code = NULL, verification_expiry = NULL 
             WHERE usuario_aplicacion_id = ?",
            [$user['usuario_aplicacion_id']]
        );
        
        Utils::jsonResponse(true, [
            'user_id' => $user['usuario_aplicacion_id'],
            'email' => $user['email'],
            'nombre' => $user['nombre']
        ], 'Cuenta verificada correctamente');
        
    } catch (Exception $e) {
        Utils::logError("Error en verificación", ['code' => $code, 'error' => $e->getMessage()]);
        Utils::jsonResponse(false, null, 'Error en la verificación', 500);
    }
}

/**
 * Iniciar sesión
 */
function handleLogin($input) {
    global $db;
    
    $email = Utils::sanitizeInput($input['email'] ?? '');
    $password = $input['password'] ?? '';
    
    if (empty($email) || empty($password)) {
        Utils::jsonResponse(false, null, 'Email y contraseña requeridos', 400);
    }
    
    try {
        $userKey = Utils::generateUserKey($email, APP_CODIGO);
        
        // Buscar usuario
        $user = $db->fetchOne(
            "SELECT usuario_aplicacion_id, usuario_aplicacion_key, email, nombre, password_hash, activo
             FROM usuarios_aplicaciones 
             WHERE usuario_aplicacion_key = ?",
            [$userKey]
        );
        
        if (!$user) {
            Utils::jsonResponse(false, null, 'Credenciales incorrectas', 401);
        }
        
        if (!$user['activo']) {
            Utils::jsonResponse(false, null, 'Cuenta no verificada. Revisa tu email.', 401);
        }
        
        if (!Utils::verifyPassword($password, $user['password_hash'])) {
            Utils::jsonResponse(false, null, 'Credenciales incorrectas', 401);
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
                [$user['usuario_aplicacion_key'], DEFAULT_COINS]
            );
            
            $progress = [
                'nivel_max' => 1,
                'monedas' => DEFAULT_COINS,
                'actualizado_at' => date('Y-m-d H:i:s')
            ];
        }
        
        // Preparar respuesta
        $userData = [
            'usuario_aplicacion_id' => $user['usuario_aplicacion_id'],
            'usuario_aplicacion_key' => $user['usuario_aplicacion_key'],
            'email' => $user['email'],
            'nombre' => $user['nombre'],
            'app_codigo' => APP_CODIGO,
            'verified_at' => date('Y-m-d H:i:s'),
            'last_login' => date('Y-m-d H:i:s')
        ];
        
        $progressData = [
            'usuario_aplicacion_key' => $user['usuario_aplicacion_key'],
            'nivel_max' => (int)$progress['nivel_max'],
            'monedas' => (int)$progress['monedas'],
            'actualizado_at' => $progress['actualizado_at']
        ];
        
        Utils::jsonResponse(true, [
            'user' => $userData,
            'progress' => $progressData
        ], 'Login exitoso');
        
    } catch (Exception $e) {
        Utils::logError("Error en login", ['email' => $email, 'error' => $e->getMessage()]);
        Utils::jsonResponse(false, null, 'Error en el login', 500);
    }
}

/**
 * Refrescar sesión (placeholder para futuras implementaciones JWT)
 */
function handleRefresh($input) {
    Utils::jsonResponse(false, null, 'Funcionalidad no implementada aún', 501);
}
?>
