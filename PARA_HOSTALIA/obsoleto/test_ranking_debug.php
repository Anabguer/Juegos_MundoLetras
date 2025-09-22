<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
header('Content-Type: text/plain; charset=utf-8');

echo "🔧 TEST: Debug específico de mundoletras_ranking_cache\n\n";

try {
    require_once 'sistema_apps_api/mundoletras/config.php';
    
    echo "✅ Config cargado correctamente\n";
    
    $test_usuario_key = '1954amg@gmail.com_mundoletras';
    $test_nivel = 3;
    $test_puntuacion = 500;
    
    // Crear payload JSON
    $payload = json_encode([
        'usuario_aplicacion_key' => $test_usuario_key,
        'nombre_usuario' => 'Antonio',
        'email_usuario' => 'test@example.com',
        'nivel_max' => $test_nivel,
        'puntuacion_total' => $test_puntuacion
    ]);
    
    echo "📦 Payload JSON: " . $payload . "\n\n";
    
    // Probar INSERT simple
    echo "--- Probando INSERT simple ---\n";
    try {
        $result = $db->query("
            INSERT INTO mundoletras_ranking_cache 
            (tipo, periodo, payload_json, actualizado_at, expira_at) 
            VALUES (?, ?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 1 WEEK))
        ", ['usuario', $test_usuario_key, $payload]);
        echo "✅ INSERT simple: OK\n";
    } catch (Exception $e) {
        echo "❌ INSERT simple: " . $e->getMessage() . "\n";
    }
    
    // Probar SELECT para verificar
    echo "\n--- Verificando datos ---\n";
    try {
        $rows = $db->fetchAll("SELECT * FROM mundoletras_ranking_cache WHERE periodo = ?", [$test_usuario_key]);
        echo "📊 Registros encontrados: " . count($rows) . "\n";
        if (count($rows) > 0) {
            echo "📋 Datos: " . json_encode($rows[0]) . "\n";
        }
    } catch (Exception $e) {
        echo "❌ SELECT: " . $e->getMessage() . "\n";
    }
    
} catch (Exception $e) {
    echo "❌ Error fatal: " . $e->getMessage() . "\n";
}
?>
