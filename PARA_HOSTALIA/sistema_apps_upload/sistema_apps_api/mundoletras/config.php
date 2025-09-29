<?php
/**
 * Configuración de la API de Mundo Letras
 * Sistema Multi-Aplicación Hostalia
 */

// Configuración de la base de datos
define('DB_HOST', 'PMYSQL165.dns-servicio.com');
define('DB_USUARIO', 'sistema_apps_user');
define('DB_CONTRA', 'GestionUploadSistemaApps!');
define('DB_NOMBRE', '9606966_sistema_apps_db');
define('DB_CHARSET', 'utf8');
define('DB_PORT', 3306);

// Configuración de la aplicación
define('APP_CODIGO', 'mundoletras');
define('APP_NOMBRE', 'Mundo Letras');

// URLs base
define('API_BASE_URL', 'https://colisan.com/sistema_apps_upload/sistema_apps_api/');
define('UPLOAD_BASE_URL', 'https://colisan.com/sistema_apps_upload/');
define('WEB_BASE_URL', 'https://colisan.com/sistema_apps_upload/');

// Configuración de seguridad
define('JWT_SECRET', 'MundoLetras_JWT_Secret_Key_2024!');
define('PASSWORD_SALT', 'MundoLetras_Salt_2024');

// Configuración de email para verificación
define('SMTP_HOST', 'smtp.hostalia.com');
define('SMTP_PORT', 587);
define('SMTP_USER', 'noreply@colisan.com');
define('SMTP_PASS', 'EmailPassword2024!');
define('FROM_EMAIL', 'noreply@colisan.com');
define('FROM_NAME', 'Mundo Letras');

// Configuración del juego
define('MAX_LEVELS', 1000);
define('DEFAULT_COINS', 50);
define('VERIFICATION_CODE_EXPIRY', 3600); // 1 hora en segundos

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

/**
 * Clase para manejo de base de datos
 */
class Database {
    private $connection;
    
    public function __construct() {
        try {
            $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NOMBRE . ";charset=" . DB_CHARSET;
            $this->connection = new PDO($dsn, DB_USUARIO, DB_CONTRA, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES " . DB_CHARSET
            ]);
        } catch (PDOException $e) {
            error_log("Error de conexión a la base de datos: " . $e->getMessage());
            throw new Exception("Error de conexión a la base de datos");
        }
    }
    
    public function getConnection() {
        return $this->connection;
    }
    
    public function query($sql, $params = []) {
        try {
            $stmt = $this->connection->prepare($sql);
            $stmt->execute($params);
            return $stmt;
        } catch (PDOException $e) {
            error_log("Error en consulta SQL: " . $e->getMessage());
            throw new Exception("Error en la consulta");
        }
    }
    
    public function fetchAll($sql, $params = []) {
        $stmt = $this->query($sql, $params);
        return $stmt->fetchAll();
    }
    
    public function fetchOne($sql, $params = []) {
        $stmt = $this->query($sql, $params);
        return $stmt->fetch();
    }
    
    public function execute($sql, $params = []) {
        $stmt = $this->query($sql, $params);
        return $stmt->rowCount();
    }
    
    public function lastInsertId() {
        return $this->connection->lastInsertId();
    }
}

/**
 * Funciones de utilidad
 */
class Utils {
    
    /**
     * Respuesta JSON estándar
     */
    public static function jsonResponse($success, $data = null, $message = '', $httpCode = 200) {
        http_response_code($httpCode);
        echo json_encode([
            'success' => $success,
            'data' => $data,
            'message' => $message,
            'timestamp' => date('Y-m-d H:i:s')
        ], JSON_UNESCAPED_UNICODE);
        exit();
    }
    
    /**
     * Validar email
     */
    public static function validateEmail($email) {
        return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
    }
    
    /**
     * Hash de contraseña
     */
    public static function hashPassword($password) {
        return password_hash($password . PASSWORD_SALT, PASSWORD_DEFAULT);
    }
    
    /**
     * Verificar contraseña
     */
    public static function verifyPassword($password, $hash) {
        return password_verify($password . PASSWORD_SALT, $hash);
    }
    
    /**
     * Generar código de verificación
     */
    public static function generateVerificationCode() {
        return sprintf('%06d', mt_rand(100000, 999999));
    }
    
    /**
     * Generar clave única de usuario
     */
    public static function generateUserKey($email, $appCodigo) {
        return $email . '_' . $appCodigo;
    }
    
    /**
     * Validar entrada JSON
     */
    public static function getJsonInput() {
        $input = file_get_contents('php://input');
        $data = json_decode($input, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            self::jsonResponse(false, null, 'JSON inválido', 400);
        }
        
        return $data ?: [];
    }
    
    /**
     * Limpiar datos de entrada
     */
    public static function sanitizeInput($data) {
        if (is_array($data)) {
            return array_map([self::class, 'sanitizeInput'], $data);
        }
        return htmlspecialchars(trim($data), ENT_QUOTES, 'UTF-8');
    }
    
    /**
     * Enviar email de verificación
     */
    public static function sendVerificationEmail($email, $nombre, $codigo) {
        // Implementación básica - en producción usar PHPMailer o similar
        $subject = "Verificación de cuenta - " . APP_NOMBRE;
        $message = "
        <html>
        <head>
            <title>Verificación de cuenta</title>
        </head>
        <body>
            <h2>¡Bienvenido a " . APP_NOMBRE . "!</h2>
            <p>Hola $nombre,</p>
            <p>Tu código de verificación es: <strong>$codigo</strong></p>
            <p>Este código expira en " . (VERIFICATION_CODE_EXPIRY / 60) . " minutos.</p>
            <p>Si no solicitaste esta cuenta, puedes ignorar este email.</p>
            <br>
            <p>¡Que disfrutes jugando!</p>
        </body>
        </html>
        ";
        
        $headers = [
            'MIME-Version: 1.0',
            'Content-type: text/html; charset=UTF-8',
            'From: ' . FROM_NAME . ' <' . FROM_EMAIL . '>',
            'Reply-To: ' . FROM_EMAIL,
            'X-Mailer: PHP/' . phpversion()
        ];
        
        return mail($email, $subject, $message, implode("\r\n", $headers));
    }
    
    /**
     * Enviar email de recuperación de contraseña
     */
    public static function sendPasswordResetEmail($email, $nombre, $codigo) {
        $subject = "Recuperar contraseña - " . APP_NOMBRE;
        $message = "
        <html>
        <head>
            <title>Recuperar contraseña</title>
        </head>
        <body>
            <h2>Recuperar contraseña - " . APP_NOMBRE . "</h2>
            <p>Hola $nombre,</p>
            <p>Has solicitado recuperar tu contraseña. Tu código de verificación es: <strong>$codigo</strong></p>
            <p>Este código expira en 15 minutos.</p>
            <p>Si no solicitaste este cambio, puedes ignorar este email.</p>
            <br>
            <p>¡Que disfrutes jugando!</p>
        </body>
        </html>
        ";
        
        $headers = [
            'MIME-Version: 1.0',
            'Content-type: text/html; charset=UTF-8',
            'From: ' . FROM_NAME . ' <' . FROM_EMAIL . '>',
            'Reply-To: ' . FROM_EMAIL,
            'X-Mailer: PHP/' . phpversion()
        ];
        
        return mail($email, $subject, $message, implode("\r\n", $headers));
    }
    
    /**
     * Validar hash de dispositivo para anti-trampas
     */
    public static function validateDeviceHash($levelId, $score, $timeMs, $seed, $clientHash) {
        // Generar hash esperado
        $expectedHash = hash('sha256', $levelId . $score . $timeMs . $seed . 'MUNDO_LETRAS_SALT');
        return hash_equals($expectedHash, $clientHash);
    }
    
    /**
     * Log de errores
     */
    public static function logError($message, $context = []) {
        $logEntry = date('Y-m-d H:i:s') . ' - ' . $message;
        if (!empty($context)) {
            $logEntry .= ' - Context: ' . json_encode($context);
        }
        error_log($logEntry);
    }
}

// Inicializar base de datos global
try {
    $db = new Database();
} catch (Exception $e) {
    Utils::jsonResponse(false, null, 'Error del servidor', 500);
}
?>
