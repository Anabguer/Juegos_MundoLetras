<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
header('Content-Type: text/plain; charset=utf-8');

echo "🔧 TEST: Debug SQL específico de mundoletras_ranking_cache\n\n";

try {
    require_once 'sistema_apps_api/mundoletras/config.php';
    
    echo "✅ Config cargado correctamente\n";
    
    $test_usuario_key = '1954amg@gmail.com_mundoletras';
    $payload = '{"test": "data"}';
    
    // Probar cada parte de la consulta por separado
    echo "\n--- 1. Probando INSERT básico ---\n";
    try {
        $result = $db->query("
            INSERT INTO mundoletras_ranking_cache 
            (tipo, periodo, payload_json) 
            VALUES (?, ?, ?)
        ", ['usuario', $test_usuario_key, $payload]);
        echo "✅ INSERT básico: OK\n";
    } catch (Exception $e) {
        echo "❌ INSERT básico: " . $e->getMessage() . "\n";
    }
    
    echo "\n--- 2. Probando con NOW() ---\n";
    try {
        $result = $db->query("
            INSERT INTO mundoletras_ranking_cache 
            (tipo, periodo, payload_json, actualizado_at) 
            VALUES (?, ?, ?, NOW())
        ", ['usuario', $test_usuario_key . '_2', $payload]);
        echo "✅ INSERT con NOW(): OK\n";
    } catch (Exception $e) {
        echo "❌ INSERT con NOW(): " . $e->getMessage() . "\n";
    }
    
    echo "\n--- 3. Probando con DATE_ADD ---\n";
    try {
        $result = $db->query("
            INSERT INTO mundoletras_ranking_cache 
            (tipo, periodo, payload_json, actualizado_at, expira_at) 
            VALUES (?, ?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 1 WEEK))
        ", ['usuario', $test_usuario_key . '_3', $payload]);
        echo "✅ INSERT con DATE_ADD: OK\n";
    } catch (Exception $e) {
        echo "❌ INSERT con DATE_ADD: " . $e->getMessage() . "\n";
    }
    
    echo "\n--- 4. Verificando estructura de tabla ---\n";
    try {
        $rows = $db->fetchAll("DESCRIBE mundoletras_ranking_cache");
        echo "📋 Estructura de tabla:\n";
        foreach ($rows as $row) {
            echo "   - {$row['Field']}: {$row['Type']} (Null: {$row['Null']}, Key: {$row['Key']})\n";
        }
    } catch (Exception $e) {
        echo "❌ DESCRIBE: " . $e->getMessage() . "\n";
    }
    
} catch (Exception $e) {
    echo "❌ Error fatal: " . $e->getMessage() . "\n";
}
?>
