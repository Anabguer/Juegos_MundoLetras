<?php
/**
 * Test de conexión a la base de datos
 */

// Configuración de la base de datos
define('DB_HOST', 'PMYSQL165.dns-servicio.com');
define('DB_USUARIO', 'sistema_apps_user');
define('DB_CONTRA', 'GestionUploadSistemaApps!');
define('DB_NOMBRE', '9606966_sistema_apps_db');
define('DB_CHARSET', 'utf8');
define('DB_PORT', 3306);

// Headers CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Content-Type: application/json; charset=utf-8');

echo "<h1>Test de Base de Datos - Mundo Letras</h1>";

try {
    $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NOMBRE . ";charset=" . DB_CHARSET;
    $pdo = new PDO($dsn, DB_USUARIO, DB_CONTRA, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES " . DB_CHARSET
    ]);
    
    echo "<h2>✅ Conexión exitosa</h2>";
    echo "<p><strong>Host:</strong> " . DB_HOST . "</p>";
    echo "<p><strong>Base de datos:</strong> " . DB_NOMBRE . "</p>";
    echo "<p><strong>Usuario:</strong> " . DB_USUARIO . "</p>";
    
    // Verificar tablas
    echo "<h3>Verificando tablas:</h3>";
    
    $tables = ['usuarios_aplicaciones', 'mundoletras_progreso'];
    
    foreach ($tables as $table) {
        try {
            $stmt = $pdo->query("SHOW TABLES LIKE '$table'");
            $exists = $stmt->fetch();
            
            if ($exists) {
                echo "<p>✅ Tabla <strong>$table</strong> existe</p>";
                
                // Contar registros
                $countStmt = $pdo->query("SELECT COUNT(*) as count FROM $table");
                $count = $countStmt->fetch()['count'];
                echo "<p>   └─ Registros: $count</p>";
            } else {
                echo "<p>❌ Tabla <strong>$table</strong> NO existe</p>";
            }
        } catch (Exception $e) {
            echo "<p>❌ Error verificando tabla <strong>$table</strong>: " . $e->getMessage() . "</p>";
        }
    }
    
    // Test de inserción simple
    echo "<h3>Test de inserción:</h3>";
    
    try {
        $testEmail = 'test_' . time() . '@ejemplo.com';
        $testKey = $testEmail . '_mundoletras';
        
        // Insertar usuario de prueba
        $stmt = $pdo->prepare("
            INSERT INTO usuarios_aplicaciones (
                usuario_aplicacion_key, email, nombre, password_hash, app_codigo,
                verification_code, verification_expiry, fecha_registro, activo
            ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), 0)
        ");
        
        $result = $stmt->execute([
            $testKey,
            $testEmail,
            'Test User',
            password_hash('123456' . 'MundoLetras_Salt_2024', PASSWORD_DEFAULT),
            'mundoletras',
            '123456',
            date('Y-m-d H:i:s', time() + 3600)
        ]);
        
        if ($result) {
            $userId = $pdo->lastInsertId();
            echo "<p>✅ Usuario de prueba insertado con ID: $userId</p>";
            
            // Crear progreso
            $progressStmt = $pdo->prepare("
                INSERT INTO mundoletras_progreso (usuario_aplicacion_key, nivel_max, monedas) 
                VALUES (?, 1, 50)
            ");
            
            $progressResult = $progressStmt->execute([$testKey]);
            
            if ($progressResult) {
                echo "<p>✅ Progreso de prueba creado</p>";
            } else {
                echo "<p>❌ Error creando progreso de prueba</p>";
            }
            
            // Limpiar datos de prueba
            $pdo->prepare("DELETE FROM mundoletras_progreso WHERE usuario_aplicacion_key = ?")->execute([$testKey]);
            $pdo->prepare("DELETE FROM usuarios_aplicaciones WHERE usuario_aplicacion_key = ?")->execute([$testKey]);
            echo "<p>🧹 Datos de prueba eliminados</p>";
            
        } else {
            echo "<p>❌ Error insertando usuario de prueba</p>";
        }
        
    } catch (Exception $e) {
        echo "<p>❌ Error en test de inserción: " . $e->getMessage() . "</p>";
    }
    
} catch (Exception $e) {
    echo "<h2>❌ Error de conexión</h2>";
    echo "<p><strong>Error:</strong> " . $e->getMessage() . "</p>";
    echo "<p><strong>Configuración:</strong></p>";
    echo "<ul>";
    echo "<li>Host: " . DB_HOST . "</li>";
    echo "<li>Puerto: " . DB_PORT . "</li>";
    echo "<li>Base de datos: " . DB_NOMBRE . "</li>";
    echo "<li>Usuario: " . DB_USUARIO . "</li>";
    echo "</ul>";
}

echo "<hr>";
echo "<p><a href='test_api.html'>← Volver al Test API</a></p>";
?>
