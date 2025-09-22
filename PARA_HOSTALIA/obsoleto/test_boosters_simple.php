<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
header('Content-Type: text/plain; charset=utf-8');

echo "🔧 TEST: Debug INSERT simple de mundoletras_boosters\n\n";

try {
    require_once 'sistema_apps_api/mundoletras/config.php';
    
    echo "✅ Config cargado correctamente\n";
    
    $test_usuario_key = '1954amg@gmail.com_mundoletras';
    
    // Probar INSERT simple sin ON DUPLICATE KEY
    echo "\n--- 1. Probando INSERT simple ---\n";
    try {
        $result = $db->query("
            INSERT INTO mundoletras_boosters 
            (usuario_aplicacion_key, tipo, cantidad) 
            VALUES (?, ?, ?)
        ", [$test_usuario_key . '_test', 'tiempo_extra', 2]);
        echo "✅ INSERT simple: OK\n";
    } catch (Exception $e) {
        echo "❌ INSERT simple: " . $e->getMessage() . "\n";
    }
    
    // Probar con diferentes tipos
    echo "\n--- 2. Probando diferentes tipos ---\n";
    $tipos = ['eliminar_letras', 'revelar_palabra'];
    
    foreach ($tipos as $tipo) {
        try {
            $result = $db->query("
                INSERT INTO mundoletras_boosters 
                (usuario_aplicacion_key, tipo, cantidad) 
                VALUES (?, ?, ?)
            ", [$test_usuario_key . '_test2', $tipo, 1]);
            echo "✅ INSERT {$tipo}: OK\n";
        } catch (Exception $e) {
            echo "❌ INSERT {$tipo}: " . $e->getMessage() . "\n";
        }
    }
    
    // Verificar estructura de tabla
    echo "\n--- 3. Verificando estructura ---\n";
    try {
        $rows = $db->fetchAll("DESCRIBE mundoletras_boosters");
        echo "📋 Estructura de tabla:\n";
        foreach ($rows as $row) {
            echo "   - {$row['Field']}: {$row['Type']} (Null: {$row['Null']}, Key: {$row['Key']})\n";
        }
    } catch (Exception $e) {
        echo "❌ DESCRIBE: " . $e->getMessage() . "\n";
    }
    
    // Verificar datos existentes
    echo "\n--- 4. Verificando datos existentes ---\n";
    try {
        $rows = $db->fetchAll("
            SELECT * FROM mundoletras_boosters 
            WHERE usuario_aplicacion_key LIKE ? 
            ORDER BY tipo
        ", [$test_usuario_key . '%']);
        
        echo "📊 Registros encontrados: " . count($rows) . "\n";
        foreach ($rows as $row) {
            echo "   - {$row['usuario_aplicacion_key']}: {$row['tipo']} = {$row['cantidad']}\n";
        }
    } catch (Exception $e) {
        echo "❌ SELECT: " . $e->getMessage() . "\n";
    }
    
} catch (Exception $e) {
    echo "❌ Error fatal: " . $e->getMessage() . "\n";
}
?>
