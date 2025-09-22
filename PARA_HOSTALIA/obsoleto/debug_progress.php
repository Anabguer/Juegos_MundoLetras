<?php
// Debug version de progress.php desde sistema_apps_upload
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Headers CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Content-Type: application/json; charset=utf-8');

// Manejar preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

echo "🔧 DEBUG: Iniciando progress.php desde sistema_apps_upload\n";

// Cargar configuración
try {
    require_once 'sistema_apps_api/mundoletras/config.php';
    echo "✅ Config cargado\n";
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'data' => null,
        'message' => 'Error de configuración: ' . $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ]);
    exit();
}

// Obtener datos de entrada
$input = file_get_contents('php://input');
echo "📥 Input recibido: " . $input . "\n";

$data = json_decode($input, true);

if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'data' => null,
        'message' => 'JSON inválido: ' . json_last_error_msg(),
        'timestamp' => date('Y-m-d H:i:s')
    ]);
    exit();
}

echo "📊 Datos parseados: " . json_encode($data) . "\n";

$action = $data['action'] ?? '';
echo "🎯 Acción: " . $action . "\n";

switch ($action) {
    case 'get':
        handleGetProgress($data);
        break;
    case 'save':
        handleSaveProgress($data);
        break;
    default:
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'data' => null,
            'message' => 'Acción no válida: ' . $action,
            'timestamp' => date('Y-m-d H:i:s')
        ]);
        exit();
}

function handleGetProgress($input) {
    global $db;
    
    echo "🔍 DEBUG: handleGetProgress iniciado\n";
    
    $usuario_aplicacion_key = $input['usuario_aplicacion_key'] ?? '';
    echo "🔑 Usuario key: " . $usuario_aplicacion_key . "\n";
    
    if (empty($usuario_aplicacion_key)) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'data' => null,
            'message' => 'usuario_aplicacion_key es requerido',
            'timestamp' => date('Y-m-d H:i:s')
        ]);
        return;
    }
    
    try {
        echo "🔍 Verificando conexión DB...\n";
        if (!isset($db) || !$db) {
            throw new Exception("Variable \$db no está disponible");
        }
        echo "✅ DB disponible\n";
        
        echo "🔍 Ejecutando consulta...\n";
        $stmt = $db->query("
            SELECT nivel_max, monedas, puntuacion_total 
            FROM mundoletras_progreso 
            WHERE usuario_aplicacion_key = ?
        ", [$usuario_aplicacion_key]);
        
        echo "✅ Consulta ejecutada\n";
        
        $rows = $stmt->fetchAll();
        if (count($rows) > 0) {
            $row = $rows[0];
            echo "✅ Usuario encontrado: " . json_encode($row) . "\n";
            echo json_encode([
                'success' => true,
                'data' => [
                    'nivel_max' => (int)$row['nivel_max'],
                    'monedas' => (int)$row['monedas'],
                    'puntuacion_total' => (int)$row['puntuacion_total']
                ],
                'message' => 'Progreso cargado exitosamente',
                'timestamp' => date('Y-m-d H:i:s')
            ]);
        } else {
            echo "📭 Usuario no encontrado, devolviendo valores por defecto\n";
            echo json_encode([
                'success' => true,
                'data' => [
                    'nivel_max' => 1,
                    'monedas' => 50,
                    'puntuacion_total' => 0
                ],
                'message' => 'No hay progreso guardado, valores por defecto',
                'timestamp' => date('Y-m-d H:i:s')
            ]);
        }
        
    } catch (Exception $e) {
        echo "❌ Error: " . $e->getMessage() . "\n";
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'data' => null,
            'message' => 'Error obteniendo progreso: ' . $e->getMessage(),
            'timestamp' => date('Y-m-d H:i:s')
        ]);
    }
}

function handleSaveProgress($input) {
    global $db;
    
    echo "💾 DEBUG: handleSaveProgress iniciado\n";
    
    $usuario_aplicacion_key = $input['usuario_aplicacion_key'] ?? '';
    $nivel_max = (int)($input['nivel_max'] ?? 1);
    $monedas = (int)($input['monedas'] ?? 50);
    $puntuacion_total = (int)($input['puntuacion_total'] ?? 0);
    
    echo "📊 Datos a guardar: nivel=$nivel_max, monedas=$monedas, score=$puntuacion_total\n";
    
    if (empty($usuario_aplicacion_key)) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'data' => null,
            'message' => 'usuario_aplicacion_key es requerido',
            'timestamp' => date('Y-m-d H:i:s')
        ]);
        return;
    }
    
    try {
        echo "🔍 Verificando si existe progreso...\n";
        $stmt = $db->query("
            SELECT progreso_id FROM mundoletras_progreso 
            WHERE usuario_aplicacion_key = ?
        ", [$usuario_aplicacion_key]);
        
        $rows = $stmt->fetchAll();
        
        if (count($rows) > 0) {
            echo "🔄 Actualizando progreso existente...\n";
            $result = $db->query("
                UPDATE mundoletras_progreso 
                SET nivel_max = ?, monedas = ?, puntuacion_total = ?, actualizado_at = NOW()
                WHERE usuario_aplicacion_key = ?
            ", [$nivel_max, $monedas, $puntuacion_total, $usuario_aplicacion_key]);
        } else {
            echo "➕ Creando nuevo progreso...\n";
            $result = $db->query("
                INSERT INTO mundoletras_progreso 
                (usuario_aplicacion_key, nivel_max, monedas, puntuacion_total, actualizado_at) 
                VALUES (?, ?, ?, ?, NOW())
            ", [$usuario_aplicacion_key, $nivel_max, $monedas, $puntuacion_total]);
        }
        
        if ($result) {
            echo "✅ Progreso guardado exitosamente\n";
            echo json_encode([
                'success' => true,
                'data' => [
                    'nivel_max' => $nivel_max,
                    'monedas' => $monedas,
                    'puntuacion_total' => $puntuacion_total
                ],
                'message' => 'Progreso guardado exitosamente',
                'timestamp' => date('Y-m-d H:i:s')
            ]);
        } else {
            throw new Exception("Error ejecutando consulta: " . $stmt->error);
        }
        
    } catch (Exception $e) {
        echo "❌ Error: " . $e->getMessage() . "\n";
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'data' => null,
            'message' => 'Error guardando progreso: ' . $e->getMessage(),
            'timestamp' => date('Y-m-d H:i:s')
        ]);
    }
}
?>
