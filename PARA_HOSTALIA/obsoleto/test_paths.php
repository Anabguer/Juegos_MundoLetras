<?php
// Test simple para verificar rutas desde sistema_apps_upload
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "🔧 TEST: Verificando rutas desde sistema_apps_upload\n\n";

echo "📁 Directorio actual: " . getcwd() . "\n";
echo "📁 __DIR__: " . __DIR__ . "\n\n";

echo "🔍 Verificando archivos:\n";

$files_to_check = [
    'sistema_apps_api/mundoletras/config.php',
    'config.php',
    '../sistema_apps_api/mundoletras/config.php'
];

foreach ($files_to_check as $file) {
    if (file_exists($file)) {
        echo "✅ $file - EXISTE\n";
    } else {
        echo "❌ $file - NO EXISTE\n";
    }
}

echo "\n🔍 Listando directorio actual:\n";
$files = scandir('.');
foreach ($files as $file) {
    if ($file != '.' && $file != '..') {
        echo "   - $file\n";
    }
}

echo "\n🔍 Listando sistema_apps_api:\n";
if (is_dir('sistema_apps_api')) {
    $files = scandir('sistema_apps_api');
    foreach ($files as $file) {
        if ($file != '.' && $file != '..') {
            echo "   - sistema_apps_api/$file\n";
        }
    }
} else {
    echo "❌ Directorio sistema_apps_api no existe\n";
}

echo "\n🔍 Listando directorio padre:\n";
if (is_dir('..')) {
    $files = scandir('..');
    foreach ($files as $file) {
        if ($file != '.' && $file != '..') {
            echo "   - ../$file\n";
        }
    }
} else {
    echo "❌ No se puede acceder al directorio padre\n";
}

echo "\n🏁 Test de rutas completado\n";
?>
