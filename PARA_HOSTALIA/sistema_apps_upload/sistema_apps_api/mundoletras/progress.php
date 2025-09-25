<?php
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


// Cargar configuración
try {
    require_once 'config.php';
} catch (Exception $e) {
    error_log("Error cargando config.php: " . $e->getMessage());
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

$action = $data['action'] ?? '';

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
    
    $usuario_aplicacion_key = $input['user_key'] ?? '';
    
    if (empty($usuario_aplicacion_key)) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'data' => null,
            'message' => 'user_key es requerido',
            'timestamp' => date('Y-m-d H:i:s')
        ]);
        return;
    }
    
    try {
        $stmt = $db->query("
            SELECT nivel_max, monedas, puntuacion_total 
            FROM mundoletras_progreso 
            WHERE usuario_aplicacion_key = ?
        ", [$usuario_aplicacion_key]);
        
        $rows = $stmt->fetchAll();
        if (count($rows) > 0) {
            $row = $rows[0];
            
            // Inicializar boosters si es necesario
            initializeBoosters($usuario_aplicacion_key);
            
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
            // Inicializar boosters para usuario nuevo
            initializeBoosters($usuario_aplicacion_key);
            
            // No hay progreso, devolver valores por defecto
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
        error_log("Error obteniendo progreso: " . $e->getMessage());
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
    
    $usuario_aplicacion_key = $input['user_key'] ?? '';
    $nivel_max = (int)($input['nivel_max'] ?? 1);
    $monedas = (int)($input['monedas'] ?? 50);
    $puntuacion_total = (int)($input['puntuacion_total'] ?? 0);
    
    if (empty($usuario_aplicacion_key)) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'data' => null,
            'message' => 'user_key es requerido',
            'timestamp' => date('Y-m-d H:i:s')
        ]);
        return;
    }
    
    try {
        // Verificar si ya existe progreso
        $stmt = $db->query("
            SELECT progreso_id FROM mundoletras_progreso 
            WHERE usuario_aplicacion_key = ?
        ", [$usuario_aplicacion_key]);
        
        $rows = $stmt->fetchAll();
        
        if (count($rows) > 0) {
            // Actualizar progreso existente
            $result = $db->query("
                UPDATE mundoletras_progreso 
                SET nivel_max = ?, monedas = ?, puntuacion_total = ?, actualizado_at = NOW()
                WHERE usuario_aplicacion_key = ?
            ", [$nivel_max, $monedas, $puntuacion_total, $usuario_aplicacion_key]);
        } else {
            // Crear nuevo progreso
            $result = $db->query("
                INSERT INTO mundoletras_progreso 
                (usuario_aplicacion_key, nivel_max, monedas, puntuacion_total, actualizado_at) 
                VALUES (?, ?, ?, ?, NOW())
            ", [$usuario_aplicacion_key, $nivel_max, $monedas, $puntuacion_total]);
        }
        
        if ($result) {
            // Guardar detalles del nivel completado
            saveLevelDetails($usuario_aplicacion_key, $nivel_max, $puntuacion_total, $monedas);
            
            // Actualizar ranking cache
            updateRankingCache($usuario_aplicacion_key, $puntuacion_total);
            
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
            throw new Exception("Error ejecutando consulta");
        }
        
    } catch (Exception $e) {
        error_log("Error guardando progreso: " . $e->getMessage());
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'data' => null,
            'message' => 'Error guardando progreso: ' . $e->getMessage(),
            'timestamp' => date('Y-m-d H:i:s')
        ]);
    }
}

/**
 * Guardar detalles del nivel completado
 */
function saveLevelDetails($usuario_aplicacion_key, $nivel, $puntuacion, $monedas) {
    global $db;
    
    try {
        // Obtener tema del nivel
        $tema = getTemaByLevel($nivel);
        
        // Guardar en mundoletras_niveles
        $result1 = $db->query("
            INSERT INTO mundoletras_niveles 
            (usuario_aplicacion_key, nivel, tema_id, puntuacion, monedas, completado_at) 
            VALUES (?, ?, ?, ?, ?, NOW())
            ON DUPLICATE KEY UPDATE 
            puntuacion = VALUES(puntuacion), 
            monedas = VALUES(monedas),
            completado_at = VALUES(completado_at)
        ", [$usuario_aplicacion_key, $nivel, $tema, $puntuacion, $monedas]);
        
        // Guardar en mundoletras_scores (adaptado a estructura real)
        $result2 = $db->query("
            INSERT INTO mundoletras_scores 
            (usuario_aplicacion_key, nivel_id, score, tiempo_ms, estrellas, monedas, fecha, device_hash, validado) 
            VALUES (?, ?, ?, ?, ?, ?, NOW(), ?, ?)
            ON DUPLICATE KEY UPDATE 
            score = VALUES(score),
            tiempo_ms = VALUES(tiempo_ms),
            estrellas = VALUES(estrellas),
            monedas = VALUES(monedas),
            fecha = VALUES(fecha),
            device_hash = VALUES(device_hash),
            validado = VALUES(validado)
        ", [$usuario_aplicacion_key, $nivel, $puntuacion, 0, 3, $monedas, 'test_device', 1]);
        
    } catch (Exception $e) {
        error_log("Error guardando detalles del nivel: " . $e->getMessage());
    }
}

/**
 * Obtener tema por nivel
 */
function getTemaByLevel($nivel) {
    // Mapeo de niveles a temas
    if ($nivel <= 3) return 1; // Básico
    if ($nivel <= 6) return 2; // Océano
    if ($nivel <= 9) return 3; // Bosque
    if ($nivel <= 12) return 4; // Montaña
    if ($nivel <= 15) return 5; // Espacio
    return 6; // Aventura
}

/**
 * Actualizar ranking cache
 */
function updateRankingCache($usuario_aplicacion_key, $puntuacion_total) {
    global $db;
    
    try {
        // Obtener información del usuario
        $stmt = $db->query("
            SELECT ua.nombre, ua.email, mp.nivel_max, mp.puntuacion_total
            FROM usuarios_aplicaciones ua
            JOIN mundoletras_progreso mp ON ua.usuario_aplicacion_key = mp.usuario_aplicacion_key
            WHERE ua.usuario_aplicacion_key = ?
        ", [$usuario_aplicacion_key]);
        
        $user = $stmt->fetch();
        
        if ($user) {
            // Crear payload JSON con los datos del usuario
            $payload = json_encode([
                'usuario_aplicacion_key' => $usuario_aplicacion_key,
                'nombre_usuario' => $user['nombre'],
                'email_usuario' => $user['email'],
                'nivel_max' => (int)$user['nivel_max'],
                'puntuacion_total' => (int)$puntuacion_total
            ]);
            
            // Actualizar ranking cache con estructura real
            $result = $db->query("
                INSERT INTO mundoletras_ranking_cache 
                (tipo, periodo, payload_json, actualizado_at, expira_at) 
                VALUES (?, ?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 1 WEEK))
                ON DUPLICATE KEY UPDATE 
                payload_json = VALUES(payload_json),
                actualizado_at = VALUES(actualizado_at),
                expira_at = VALUES(expira_at)
            ", ['global', substr($usuario_aplicacion_key, 0, 20), $payload]);
        }
        
    } catch (Exception $e) {
        error_log("Error actualizando ranking cache: " . $e->getMessage());
    }
}

/**
 * Inicializar boosters por defecto
 */
function initializeBoosters($usuario_aplicacion_key) {
    global $db;
    
    try {
        // Verificar si ya tiene boosters
        $stmt = $db->query("
            SELECT COUNT(*) as count FROM mundoletras_boosters 
            WHERE usuario_aplicacion_key = ?
        ", [$usuario_aplicacion_key]);
        
        $result = $stmt->fetch();
        
        if ($result['count'] == 0) {
            // Crear boosters por defecto (usando valores válidos del ENUM)
            $boosters = [
                ['pista', 3],
                ['revelar_letra', 1],
                ['quitar_niebla', 1]
            ];
            
            foreach ($boosters as $booster) {
                $db->query("
                    INSERT INTO mundoletras_boosters 
                    (usuario_aplicacion_key, tipo, cantidad) 
                    VALUES (?, ?, ?)
                ", [$usuario_aplicacion_key, $booster[0], $booster[1]]);
            }
        }
        
    } catch (Exception $e) {
        error_log("Error inicializando boosters: " . $e->getMessage());
    }
}
?>