<?php
// Test directo para guardar en todas las tablas
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "🔧 TEST: Guardado directo en todas las tablas\n\n";

// Cargar configuración
require_once 'sistema_apps_api/mundoletras/config.php';

$usuario_aplicacion_key = '1954amg@gmail.com_mundoletras';
$nivel_max = 3;
$monedas = 100;
$puntuacion_total = 500;

echo "📤 Datos: usuario=$usuario_aplicacion_key, nivel=$nivel_max, monedas=$monedas, score=$puntuacion_total\n\n";

try {
    // 1. Guardar en mundoletras_progreso
    echo "1. Guardando en mundoletras_progreso...\n";
    $result1 = $db->query("
        INSERT INTO mundoletras_progreso 
        (usuario_aplicacion_key, nivel_max, monedas, puntuacion_total, actualizado_at) 
        VALUES (?, ?, ?, ?, NOW())
        ON DUPLICATE KEY UPDATE 
        nivel_max = VALUES(nivel_max),
        monedas = VALUES(monedas),
        puntuacion_total = VALUES(puntuacion_total),
        actualizado_at = VALUES(actualizado_at)
    ", [$usuario_aplicacion_key, $nivel_max, $monedas, $puntuacion_total]);
    echo "   ✅ Resultado: " . ($result1 ? 'OK' : 'ERROR') . "\n";
    
    // 2. Guardar en mundoletras_niveles
    echo "\n2. Guardando en mundoletras_niveles...\n";
    $tema = 1; // Tema básico
    try {
        $result2 = $db->query("
            INSERT INTO mundoletras_niveles 
            (usuario_aplicacion_key, nivel, tema_id, puntuacion, completado_at) 
            VALUES (?, ?, ?, ?, NOW())
            ON DUPLICATE KEY UPDATE 
            puntuacion = VALUES(puntuacion), 
            completado_at = VALUES(completado_at)
        ", [$usuario_aplicacion_key, $nivel_max, $tema, $puntuacion_total]);
        echo "   ✅ Resultado: " . ($result2 ? 'OK' : 'ERROR') . "\n";
    } catch (Exception $e) {
        echo "   ❌ Error específico: " . $e->getMessage() . "\n";
    }
    
    // 3. Guardar en mundoletras_scores (adaptado a estructura real)
    echo "\n3. Guardando en mundoletras_scores...\n";
    try {
        $result3 = $db->query("
            INSERT INTO mundoletras_scores 
            (usuario_aplicacion_key, nivel_id, score, tiempo_ms, estrellas, fecha, device_hash, validado) 
            VALUES (?, ?, ?, ?, ?, NOW(), ?, ?)
            ON DUPLICATE KEY UPDATE 
            score = VALUES(score),
            tiempo_ms = VALUES(tiempo_ms),
            estrellas = VALUES(estrellas),
            fecha = VALUES(fecha),
            device_hash = VALUES(device_hash),
            validado = VALUES(validado)
        ", [$usuario_aplicacion_key, $nivel_max, $puntuacion_total, 0, 3, 'test_device', 1]);
        echo "   ✅ Resultado: " . ($result3 ? 'OK' : 'ERROR') . "\n";
    } catch (Exception $e) {
        echo "   ❌ Error específico: " . $e->getMessage() . "\n";
    }
    
    // 4. Guardar en mundoletras_ranking_cache (adaptado a estructura real)
    echo "\n4. Guardando en mundoletras_ranking_cache...\n";
    try {
        // Crear payload JSON
        $payload = json_encode([
            'usuario_aplicacion_key' => $usuario_aplicacion_key,
            'nombre_usuario' => 'Antonio',
            'email_usuario' => 'test@example.com',
            'nivel_max' => $nivel_max,
            'puntuacion_total' => $puntuacion_total
        ]);
        
        $result4 = $db->query("
            INSERT INTO mundoletras_ranking_cache 
            (tipo, periodo, payload_json, actualizado_at, expira_at) 
            VALUES (?, ?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 1 WEEK))
            ON DUPLICATE KEY UPDATE 
            payload_json = VALUES(payload_json),
            actualizado_at = VALUES(actualizado_at),
            expira_at = VALUES(expira_at)
        ", ['global', substr($usuario_aplicacion_key, 0, 20), $payload]);
        echo "   ✅ Resultado: " . ($result4 ? 'OK' : 'ERROR') . "\n";
    } catch (Exception $e) {
        echo "   ❌ Error específico: " . $e->getMessage() . "\n";
    }
    
    // 5. Guardar en mundoletras_boosters
    echo "\n5. Guardando en mundoletras_boosters...\n";
    $boosters = [
        ['pista', 3],
        ['revelar_letra', 1],
        ['quitar_niebla', 1]
    ];
    
    foreach ($boosters as $booster) {
        $result5 = $db->query("
            INSERT INTO mundoletras_boosters 
            (usuario_aplicacion_key, tipo, cantidad) 
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE 
            cantidad = VALUES(cantidad)
        ", [$usuario_aplicacion_key, $booster[0], $booster[1]]);
        echo "   ✅ Booster {$booster[0]}: " . ($result5 ? 'OK' : 'ERROR') . "\n";
    }
    
    echo "\n🏁 Test completado\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
?>
