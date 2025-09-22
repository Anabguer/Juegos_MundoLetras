<?php
/**
 * Test simple de la API de autenticación
 */

// Headers CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Content-Type: application/json; charset=utf-8');

echo "<h1>Test Simple API Mundo Letras</h1>";

// Test 1: Verificar que config.php se carga
echo "<h2>Test 1: Cargando config.php</h2>";
try {
    require_once 'sistema_apps_api/mundoletras/config.php';
    echo "<p>✅ config.php cargado correctamente</p>";
    echo "<p><strong>APP_CODIGO:</strong> " . (defined('APP_CODIGO') ? APP_CODIGO : 'NO DEFINIDO') . "</p>";
    echo "<p><strong>DEFAULT_COINS:</strong> " . (defined('DEFAULT_COINS') ? DEFAULT_COINS : 'NO DEFINIDO') . "</p>";
} catch (Exception $e) {
    echo "<p>❌ Error cargando config.php: " . $e->getMessage() . "</p>";
}

// Test 2: Verificar conexión a BD
echo "<h2>Test 2: Conexión a Base de Datos</h2>";
try {
    if (isset($db) && $db) {
        echo "<p>✅ Conexión a BD disponible</p>";
        
        // Test simple de consulta
        $result = $db->fetchOne("SELECT COUNT(*) as count FROM usuarios_aplicaciones");
        echo "<p><strong>Usuarios en BD:</strong> " . $result['count'] . "</p>";
    } else {
        echo "<p>❌ Variable \$db no disponible</p>";
    }
} catch (Exception $e) {
    echo "<p>❌ Error en BD: " . $e->getMessage() . "</p>";
}

// Test 3: Simular registro
echo "<h2>Test 3: Simulación de Registro</h2>";
try {
    if (isset($db) && $db) {
        $testEmail = 'test_simple_' . time() . '@ejemplo.com';
        $testKey = $testEmail . '_mundoletras';
        
        echo "<p><strong>Email de prueba:</strong> $testEmail</p>";
        echo "<p><strong>UserKey:</strong> $testKey</p>";
        
        // Verificar si ya existe
        $existing = $db->fetchOne(
            "SELECT usuario_aplicacion_id FROM usuarios_aplicaciones WHERE usuario_aplicacion_key = ?",
            [$testKey]
        );
        
        if ($existing) {
            echo "<p>⚠️ Usuario ya existe, eliminando...</p>";
            $db->query("DELETE FROM mundoletras_progreso WHERE usuario_aplicacion_key = ?", [$testKey]);
            $db->query("DELETE FROM usuarios_aplicaciones WHERE usuario_aplicacion_key = ?", [$testKey]);
        }
        
        // Insertar usuario de prueba
        $verificationCode = sprintf('%06d', mt_rand(100000, 999999));
        $verificationExpiry = date('Y-m-d H:i:s', time() + 3600);
        $passwordHash = password_hash('123456' . 'MundoLetras_Salt_2024', PASSWORD_DEFAULT);
        
        $insertResult = $db->query(
            "INSERT INTO usuarios_aplicaciones (
                usuario_aplicacion_key, email, nombre, password_hash, app_codigo,
                verification_code, verification_expiry, fecha_registro, activo
            ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), 0)",
            [$testKey, $testEmail, 'Test Simple', $passwordHash, 'mundoletras', $verificationCode, $verificationExpiry]
        );
        
        if ($insertResult) {
            $userId = $db->lastInsertId();
            echo "<p>✅ Usuario insertado con ID: $userId</p>";
            
            // Crear progreso
            $progressResult = $db->query(
                "INSERT INTO mundoletras_progreso (usuario_aplicacion_key, nivel_max, monedas) VALUES (?, 1, ?)",
                [$testKey, 50]
            );
            
            if ($progressResult) {
                echo "<p>✅ Progreso creado</p>";
            } else {
                echo "<p>❌ Error creando progreso</p>";
            }
            
            // Limpiar
            $db->query("DELETE FROM mundoletras_progreso WHERE usuario_aplicacion_key = ?", [$testKey]);
            $db->query("DELETE FROM usuarios_aplicaciones WHERE usuario_aplicacion_key = ?", [$testKey]);
            echo "<p>🧹 Datos de prueba eliminados</p>";
            
        } else {
            echo "<p>❌ Error insertando usuario</p>";
        }
        
    } else {
        echo "<p>❌ No hay conexión a BD</p>";
    }
} catch (Exception $e) {
    echo "<p>❌ Error en simulación: " . $e->getMessage() . "</p>";
    echo "<p><strong>Trace:</strong> " . $e->getTraceAsString() . "</p>";
}

echo "<hr>";
echo "<p><a href='test_api.html'>← Volver al Test API</a></p>";
?>
