<?php
// Test simple para progress.php
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "🔧 TEST: Probando progress.php directamente\n\n";

// Simular llamada GET
$testData = [
    'action' => 'get',
    'usuario_aplicacion_key' => '1954amg@gmail.com_mundoletras'
];

echo "📤 Datos de prueba: " . json_encode($testData) . "\n\n";

// Simular POST request
$_SERVER['REQUEST_METHOD'] = 'POST';
$_SERVER['CONTENT_TYPE'] = 'application/json';

// Simular input
$input = json_encode($testData);
$temp = tmpfile();
fwrite($temp, $input);
rewind($temp);

// Redirigir php://input temporalmente
$originalInput = 'php://input';
$tempPath = stream_get_meta_data($temp)['uri'];

echo "🔍 Ejecutando progress.php...\n";

// Capturar output
ob_start();

// Incluir progress.php
include 'sistema_apps_api/mundoletras/progress.php';

$output = ob_get_clean();

echo "📊 Respuesta de progress.php:\n";
echo $output . "\n";

echo "\n🏁 Test completado\n";
?>
