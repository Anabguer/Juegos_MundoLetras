<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
header('Content-Type: text/plain; charset=utf-8');

echo "🔧 TEST: Debug específico de mundoletras_boosters\n\n";

try {
    require_once 'sistema_apps_api/mundoletras/config.php';
    
    echo "✅ Config cargado correctamente\n";
    
    $test_usuario_key = '1954amg@gmail.com_mundoletras';
    $boosters = [
        ['pista', 3],
        ['tiempo_extra', 2],
        ['eliminar_letras', 1],
        ['revelar_palabra', 1]
    ];
    
    echo "\n--- Probando cada booster individualmente ---\n";
    
    foreach ($boosters as $index => $booster) {
        echo "\n" . ($index + 1) . ". Probando booster: {$booster[0]}\n";
        
        try {
            // Primero verificar si ya existe
            $existing = $db->fetchAll("
                SELECT * FROM mundoletras_boosters 
                WHERE usuario_aplicacion_key = ? AND tipo = ?
            ", [$test_usuario_key, $booster[0]]);
            
            if (count($existing) > 0) {
                echo "   ⚠️  Ya existe, actualizando...\n";
                $result = $db->query("
                    UPDATE mundoletras_boosters 
                    SET cantidad = ?, actualizado_at = NOW()
                    WHERE usuario_aplicacion_key = ? AND tipo = ?
                ", [$booster[1], $test_usuario_key, $booster[0]]);
            } else {
                echo "   ➕ No existe, insertando...\n";
                $result = $db->query("
                    INSERT INTO mundoletras_boosters 
                    (usuario_aplicacion_key, tipo, cantidad) 
                    VALUES (?, ?, ?)
                ", [$test_usuario_key, $booster[0], $booster[1]]);
            }
            
            echo "   ✅ Resultado: " . ($result ? 'OK' : 'ERROR') . "\n";
            
        } catch (Exception $e) {
            echo "   ❌ Error específico: " . $e->getMessage() . "\n";
        }
    }
    
    echo "\n--- Verificando datos finales ---\n";
    try {
        $rows = $db->fetchAll("
            SELECT * FROM mundoletras_boosters 
            WHERE usuario_aplicacion_key = ? 
            ORDER BY tipo
        ", [$test_usuario_key]);
        
        echo "📊 Boosters guardados: " . count($rows) . "\n";
        foreach ($rows as $row) {
            echo "   - {$row['tipo']}: {$row['cantidad']}\n";
        }
        
    } catch (Exception $e) {
        echo "❌ Error verificando: " . $e->getMessage() . "\n";
    }
    
} catch (Exception $e) {
    echo "❌ Error fatal: " . $e->getMessage() . "\n";
}
?>
