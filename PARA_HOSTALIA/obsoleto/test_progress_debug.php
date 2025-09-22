<?php
// Test para debuggear el guardado en todas las tablas
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "🔧 TEST: Debuggeando guardado en todas las tablas\n\n";

// Cargar configuración
require_once 'sistema_apps_api/mundoletras/config.php';

// Simular datos de prueba
$testData = [
    'action' => 'save',
    'usuario_aplicacion_key' => '1954amg@gmail.com_mundoletras',
    'nivel_max' => 3,
    'monedas' => 100,
    'puntuacion_total' => 500
];

echo "📤 Datos de prueba: " . json_encode($testData) . "\n\n";

// Simular llamada a progress.php
$_SERVER['REQUEST_METHOD'] = 'POST';
$_SERVER['CONTENT_TYPE'] = 'application/json';

echo "🔍 Ejecutando progress.php...\n\n";

// Simular el input correctamente
$input = json_encode($testData);

// Crear un stream temporal para simular php://input
$temp = tmpfile();
fwrite($temp, $input);
rewind($temp);

// Redirigir php://input temporalmente
$originalInput = 'php://input';
$tempPath = stream_get_meta_data($temp)['uri'];

// Capturar output
ob_start();

// Incluir progress.php
include 'sistema_apps_api/mundoletras/progress.php';

$output = ob_get_clean();

// Cerrar el stream temporal
fclose($temp);

echo "📊 Respuesta de progress.php:\n";
echo $output . "\n\n";

// Verificar qué se guardó en cada tabla
echo "🔍 Verificando datos guardados:\n\n";

// 1. Verificar mundoletras_progreso
echo "1. mundoletras_progreso:\n";
try {
    $stmt = $db->query("SELECT * FROM mundoletras_progreso WHERE usuario_aplicacion_key = ?", [$testData['usuario_aplicacion_key']]);
    $rows = $stmt->fetchAll();
    foreach ($rows as $row) {
        echo "   " . json_encode($row) . "\n";
    }
} catch (Exception $e) {
    echo "   ❌ Error: " . $e->getMessage() . "\n";
}

// 2. Verificar mundoletras_niveles
echo "\n2. mundoletras_niveles:\n";
try {
    $stmt = $db->query("SELECT * FROM mundoletras_niveles WHERE usuario_aplicacion_key = ?", [$testData['usuario_aplicacion_key']]);
    $rows = $stmt->fetchAll();
    if (count($rows) > 0) {
        foreach ($rows as $row) {
            echo "   " . json_encode($row) . "\n";
        }
    } else {
        echo "   📭 No hay datos\n";
    }
} catch (Exception $e) {
    echo "   ❌ Error: " . $e->getMessage() . "\n";
}

// 3. Verificar mundoletras_scores
echo "\n3. mundoletras_scores:\n";
try {
    $stmt = $db->query("SELECT * FROM mundoletras_scores WHERE usuario_aplicacion_key = ?", [$testData['usuario_aplicacion_key']]);
    $rows = $stmt->fetchAll();
    if (count($rows) > 0) {
        foreach ($rows as $row) {
            echo "   " . json_encode($row) . "\n";
        }
    } else {
        echo "   📭 No hay datos\n";
    }
} catch (Exception $e) {
    echo "   ❌ Error: " . $e->getMessage() . "\n";
}

// 4. Verificar mundoletras_ranking_cache
echo "\n4. mundoletras_ranking_cache:\n";
try {
    $stmt = $db->query("SELECT * FROM mundoletras_ranking_cache WHERE usuario_aplicacion_key = ?", [$testData['usuario_aplicacion_key']]);
    $rows = $stmt->fetchAll();
    if (count($rows) > 0) {
        foreach ($rows as $row) {
            echo "   " . json_encode($row) . "\n";
        }
    } else {
        echo "   📭 No hay datos\n";
    }
} catch (Exception $e) {
    echo "   ❌ Error: " . $e->getMessage() . "\n";
}

// 5. Verificar mundoletras_boosters
echo "\n5. mundoletras_boosters:\n";
try {
    $stmt = $db->query("SELECT * FROM mundoletras_boosters WHERE usuario_aplicacion_key = ?", [$testData['usuario_aplicacion_key']]);
    $rows = $stmt->fetchAll();
    if (count($rows) > 0) {
        foreach ($rows as $row) {
            echo "   " . json_encode($row) . "\n";
        }
    } else {
        echo "   📭 No hay datos\n";
    }
} catch (Exception $e) {
    echo "   ❌ Error: " . $e->getMessage() . "\n";
}

echo "\n🏁 Test completado\n";
?>
