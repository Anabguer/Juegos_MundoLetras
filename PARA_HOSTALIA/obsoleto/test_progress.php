<?php
// Test para debuggear progress.php desde sistema_apps_upload
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "🔧 TEST: Probando progress.php desde sistema_apps_upload\n\n";

// Test 1: Verificar configuración
echo "1. Verificando config.php...\n";
try {
    require_once 'sistema_apps_api/mundoletras/config.php';
    echo "✅ config.php cargado correctamente\n";
    echo "📊 DB Host: " . DB_HOST . "\n";
    echo "📊 DB Name: " . DB_NOMBRE . "\n";
} catch (Exception $e) {
    echo "❌ Error cargando config.php: " . $e->getMessage() . "\n";
    exit();
}

// Test 2: Verificar conexión a BBDD
echo "\n2. Verificando conexión a BBDD...\n";
try {
    if (isset($db) && $db) {
        echo "✅ Conexión a BBDD establecida\n";
    } else {
        echo "❌ Variable \$db no está disponible\n";
        exit();
    }
} catch (Exception $e) {
    echo "❌ Error de conexión: " . $e->getMessage() . "\n";
    exit();
}

// Test 3: Verificar tabla de progreso
echo "\n3. Verificando tabla mundoletras_progreso...\n";
try {
    $result = $db->query("DESCRIBE mundoletras_progreso");
    if ($result) {
        echo "✅ Tabla existe\n";
        $rows = $result->fetchAll();
        foreach ($rows as $row) {
            echo "   - " . $row['Field'] . " (" . $row['Type'] . ")\n";
        }
    } else {
        echo "❌ Error describiendo tabla\n";
    }
} catch (Exception $e) {
    echo "❌ Error verificando tabla: " . $e->getMessage() . "\n";
}

// Test 4: Verificar datos existentes
echo "\n4. Verificando datos existentes...\n";
try {
    $result = $db->query("SELECT * FROM mundoletras_progreso LIMIT 5");
    if ($result) {
        echo "✅ Consulta ejecutada\n";
        $rows = $result->fetchAll();
        $count = count($rows);
        foreach ($rows as $index => $row) {
            echo "   Registro " . ($index + 1) . ": " . json_encode($row) . "\n";
        }
        if ($count === 0) {
            echo "   📭 No hay registros en la tabla\n";
        }
    } else {
        echo "❌ Error consultando datos\n";
    }
} catch (Exception $e) {
    echo "❌ Error consultando datos: " . $e->getMessage() . "\n";
}

// Test 5: Simular llamada a progress.php
echo "\n5. Simulando llamada a progress.php...\n";
try {
    $testData = [
        'action' => 'get',
        'usuario_aplicacion_key' => '1954amg@gmail.com_mundoletras'
    ];
    
    echo "📤 Datos de prueba: " . json_encode($testData) . "\n";
    
    // Simular la consulta
    $stmt = $db->query("
        SELECT nivel_max, monedas, puntuacion_total 
        FROM mundoletras_progreso 
        WHERE usuario_aplicacion_key = ?
    ", [$testData['usuario_aplicacion_key']]);
    
    $rows = $stmt->fetchAll();
    
    if (count($rows) > 0) {
        $row = $rows[0];
        echo "✅ Usuario encontrado: " . json_encode($row) . "\n";
    } else {
        echo "📭 Usuario no encontrado, creando registro...\n";
        
        // Crear registro de prueba
        $result = $db->query("
            INSERT INTO mundoletras_progreso 
            (usuario_aplicacion_key, nivel_max, monedas, puntuacion_total, actualizado_at) 
            VALUES (?, 1, 50, 0, NOW())
        ", [$testData['usuario_aplicacion_key']]);
        
        if ($result) {
            echo "✅ Registro creado exitosamente\n";
        } else {
            echo "❌ Error creando registro\n";
        }
    }
    
} catch (Exception $e) {
    echo "❌ Error en simulación: " . $e->getMessage() . "\n";
}

echo "\n🏁 Test completado\n";
?>
