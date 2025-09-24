<?php
// Incluir configuración
require_once 'config.php';

// Función para crear conexión PDO directa
function createPDOConnection() {
    try {
        $pdo = new PDO(
            "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NOMBRE . ";charset=" . DB_CHARSET,
            DB_USUARIO,
            DB_CONTRA,
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false
            ]
        );
        return $pdo;
    } catch (Exception $e) {
        error_log("Error de conexión PDO: " . $e->getMessage());
        throw $e;
    }
}

// Crear conexión PDO directa
$pdo = createPDOConnection();

// Función para verificar si las tablas existen
function checkTables($pdo) {
    try {
        $tables = ['usuarios_aplicaciones', 'mundoletras_progreso'];
        $existingTables = [];
        
        foreach ($tables as $table) {
            $stmt = $pdo->prepare("SHOW TABLES LIKE ?");
            $stmt->execute([$table]);
            $result = $stmt->fetch();
            if ($result) {
                $existingTables[] = $table;
            }
        }
        
        return $existingTables;
    } catch (Exception $e) {
        error_log("Error en checkTables: " . $e->getMessage());
        return [];
    }
}

// Función para obtener estructura de tablas
function getTableStructure($pdo) {
    try {
        $structure = [];
        
        // Verificar usuarios_aplicaciones
        try {
            $stmt = $pdo->prepare("DESCRIBE usuarios_aplicaciones");
            $stmt->execute();
            $result = $stmt->fetchAll();
            $structure['usuarios_aplicaciones'] = $result;
        } catch (Exception $e) {
            $structure['usuarios_aplicaciones'] = ['error' => $e->getMessage()];
        }
        
        // Verificar mundoletras_progreso
        try {
            $stmt = $pdo->prepare("DESCRIBE mundoletras_progreso");
            $stmt->execute();
            $result = $stmt->fetchAll();
            $structure['mundoletras_progreso'] = $result;
        } catch (Exception $e) {
            $structure['mundoletras_progreso'] = ['error' => $e->getMessage()];
        }
        
        return $structure;
    } catch (Exception $e) {
        error_log("Error en getTableStructure: " . $e->getMessage());
        return ['error' => $e->getMessage()];
    }
}

// Función para obtener ranking completo
function getRanking($pdo, $appCodigo = 'mundoletras', $limit = 50) {
    try {
        // Primero intentar con INNER JOIN (solo usuarios con progreso)
        $sql = "
            SELECT 
                ua.usuario_aplicacion_key,
                COALESCE(ua.nick, ua.nombre) as nick,
                p.nivel_max,
                p.puntuacion_total,
                p.actualizado_at
            FROM usuarios_aplicaciones ua
            INNER JOIN mundoletras_progreso p ON ua.usuario_aplicacion_key COLLATE utf8mb4_unicode_ci = p.usuario_aplicacion_key COLLATE utf8mb4_unicode_ci
            WHERE ua.app_codigo COLLATE utf8mb4_unicode_ci = ? 
            AND ua.activo = 1
            AND p.nivel_max > 0
            ORDER BY p.nivel_max DESC, p.puntuacion_total DESC
            LIMIT ?
        ";
        
        error_log("🔍 getRanking SQL: " . $sql);
        error_log("🔍 getRanking params: " . json_encode([$appCodigo, $limit]));
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$appCodigo, $limit]);
        $result = $stmt->fetchAll();
        error_log("🔍 getRanking result count: " . count($result));
        
        // Añadir posición manualmente
        foreach ($result as $index => &$player) {
            $player['posicion'] = $index + 1;
        }
        
        return $result;
    } catch (Exception $e) {
        error_log("❌ Error en getRanking: " . $e->getMessage());
        
        // Si falla, intentar con LEFT JOIN (incluir usuarios sin progreso)
        try {
            error_log("🔧 Intentando con LEFT JOIN...");
            $sql = "
                SELECT 
                    ua.usuario_aplicacion_key,
                    COALESCE(ua.nick, ua.nombre) as nick,
                    COALESCE(p.nivel_max, 0) as nivel_max,
                    COALESCE(p.puntuacion_total, 0) as puntuacion_total,
                    COALESCE(p.actualizado_at, ua.created_at) as actualizado_at
                FROM usuarios_aplicaciones ua
                LEFT JOIN mundoletras_progreso p ON ua.usuario_aplicacion_key COLLATE utf8mb4_unicode_ci = p.usuario_aplicacion_key COLLATE utf8mb4_unicode_ci
                WHERE ua.app_codigo COLLATE utf8mb4_unicode_ci = ? 
                AND ua.activo = 1
                ORDER BY nivel_max DESC, puntuacion_total DESC
                LIMIT ?
            ";
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$appCodigo, $limit]);
            $result = $stmt->fetchAll();
            
            // Añadir posición manualmente
            foreach ($result as $index => &$player) {
                $player['posicion'] = $index + 1;
            }
            
            error_log("🔧 LEFT JOIN result count: " . count($result));
            return $result;
        } catch (Exception $e2) {
            error_log("❌ Error en LEFT JOIN: " . $e2->getMessage());
            throw $e2;
        }
    }
}

// Función para obtener contexto del usuario
function getUserContext($pdo, $userKey, $appCodigo = 'mundoletras') {
    try {
        // Obtener ranking completo y encontrar posición del usuario
        $ranking = getRanking($pdo, $appCodigo, 1000); // Obtener más registros para encontrar posición
        
        $userPosition = null;
        foreach ($ranking as $index => $player) {
            if ($player['usuario_aplicacion_key'] === $userKey) {
                $userPosition = $index + 1;
                break;
            }
        }
        
        if (!$userPosition) {
            return ['error' => 'Usuario no encontrado'];
        }
        
        $startPos = max(1, $userPosition - 10);
        $endPos = min(count($ranking), $userPosition + 10);
        $contextRanking = array_slice($ranking, $startPos - 1, $endPos - $startPos + 1);
        
                return [
            'ranking' => $contextRanking,
            'user_position' => $userPosition,
            'start_position' => $startPos
        ];
    } catch (Exception $e) {
        error_log("Error en getUserContext: " . $e->getMessage());
        return ['error' => $e->getMessage()];
    }
}

// Procesar petición
$method = $_SERVER['REQUEST_METHOD'];

try {
    if ($method === 'GET') {
        $action = $_GET['action'] ?? 'full';
        $userKey = $_GET['user_key'] ?? null;
        
        switch ($action) {
            case 'test':
                // Función de test para debugging
                $existingTables = checkTables($pdo);
                echo json_encode([
                    'success' => true,
                    'data' => [
                        'tables_exist' => $existingTables,
                        'all_tables' => $existingTables === ['usuarios_aplicaciones', 'mundoletras_progreso'],
                        'db_connection' => 'OK'
                    ],
                    'message' => 'Test completado',
                    'timestamp' => date('Y-m-d H:i:s')
                ]);
                break;
                
            case 'structure':
                // Función para ver estructura de tablas
                $structure = getTableStructure($pdo);
                echo json_encode([
                    'success' => true,
                    'data' => $structure,
                    'message' => 'Estructura de tablas',
                    'timestamp' => date('Y-m-d H:i:s')
                ]);
                break;
                
            case 'test_sql':
                // Función para probar consulta SQL específica
                try {
                    error_log("🔧 Test SQL iniciado");
                    
                    // Test 1: Verificar si hay datos en usuarios_aplicaciones
                    $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM usuarios_aplicaciones WHERE app_codigo COLLATE utf8mb4_unicode_ci = ?");
                    $stmt->execute(['mundoletras']);
                    $usersCount = $stmt->fetch();
                    error_log("🔧 Usuarios encontrados: " . $usersCount['count']);
                    
                    // Test 2: Verificar si hay datos en mundoletras_progreso
                    $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM mundoletras_progreso");
                    $stmt->execute();
                    $progressCount = $stmt->fetch();
                    error_log("🔧 Progresos encontrados: " . $progressCount['count']);
                    
                    // Test 3: Verificar JOIN básico
                    $stmt = $pdo->prepare("
                        SELECT 
                            ua.usuario_aplicacion_key,
                            COALESCE(ua.nick, ua.nombre) as nick,
                            ua.app_codigo,
                            ua.activo,
                            p.nivel_max,
                            p.puntuacion_total
                        FROM usuarios_aplicaciones ua
                        LEFT JOIN mundoletras_progreso p ON ua.usuario_aplicacion_key COLLATE utf8mb4_unicode_ci = p.usuario_aplicacion_key COLLATE utf8mb4_unicode_ci
                        WHERE ua.app_codigo COLLATE utf8mb4_unicode_ci = 'mundoletras'
                        LIMIT 5
                    ");
                    $stmt->execute();
                    $joinTest = $stmt->fetchAll();
                    error_log("🔧 JOIN test: " . count($joinTest) . " registros");
                    
                    // Test 4: Intentar ranking completo
                    $ranking = getRanking($pdo);
                    
                    // Test 5: Verificar datos específicos
                    $allProgress = $pdo->prepare("SELECT * FROM mundoletras_progreso ORDER BY nivel_max DESC, puntuacion_total DESC");
                    $allProgress->execute();
                    $allProgressData = $allProgress->fetchAll();
                    
                    echo json_encode([
                        'success' => true,
                        'data' => [
                            'sql_test' => 'OK',
                            'users_count' => $usersCount['count'],
                            'progress_count' => $progressCount['count'],
                            'join_test_count' => count($joinTest),
                            'ranking_count' => count($ranking),
                            'all_progress_count' => count($allProgressData),
                            'join_sample' => array_slice($joinTest, 0, 3),
                            'ranking_sample' => array_slice($ranking, 0, 3),
                            'all_progress_sample' => array_slice($allProgressData, 0, 3)
                        ],
                        'message' => 'Test SQL completado',
                        'timestamp' => date('Y-m-d H:i:s')
                    ]);
                } catch (Exception $e) {
                    error_log("❌ Error en test SQL: " . $e->getMessage());
                    echo json_encode([
                        'success' => false,
                        'data' => [
                            'sql_test' => 'ERROR',
                            'error' => $e->getMessage(),
                            'trace' => $e->getTraceAsString()
                        ],
                        'message' => 'Error en test SQL',
                        'timestamp' => date('Y-m-d H:i:s')
                    ]);
                    http_response_code(500);
                }
                break;
                
            case 'full':
                $ranking = getRanking($pdo);
                echo json_encode([
                    'success' => true,
                    'data' => $ranking,
                    'message' => '',
                    'timestamp' => date('Y-m-d H:i:s')
                ]);
                break;
                
            case 'user_context':
                if (!$userKey) {
                    echo json_encode([
                        'success' => false,
                        'data' => null,
                        'message' => 'user_key requerido',
                        'timestamp' => date('Y-m-d H:i:s')
                    ]);
                    http_response_code(400);
                    break;
                }
                
                // Si es usuario guest, devolver ranking general
                if (strpos($userKey, 'guest_') === 0) {
                    error_log("🔍 Usuario guest detectado: " . $userKey);
                    $ranking = getRanking($pdo);
                    error_log("🔍 Ranking obtenido para guest: " . count($ranking) . " registros");
                    echo json_encode([
                        'success' => true,
                        'data' => [
                            'ranking' => $ranking,
                            'user_position' => null,
                            'start_position' => 1,
                            'is_guest' => true
                        ],
                        'message' => 'Ranking general para usuario guest',
                        'timestamp' => date('Y-m-d H:i:s')
                    ]);
                    break;
                }
                
                $context = getUserContext($pdo, $userKey);
                if (isset($context['error'])) {
                    echo json_encode([
                        'success' => false,
                        'data' => null,
                        'message' => $context['error'],
                        'timestamp' => date('Y-m-d H:i:s')
                    ]);
                    http_response_code(404);
                    break;
                }
                
                echo json_encode([
                    'success' => true,
                    'data' => $context,
                    'message' => '',
                    'timestamp' => date('Y-m-d H:i:s')
                ]);
                break;
                
            default:
                echo json_encode([
                    'success' => false,
                    'data' => null,
                    'message' => 'Acción no válida',
                    'timestamp' => date('Y-m-d H:i:s')
                ]);
                http_response_code(400);
        }
        
    } else {
        echo json_encode([
            'success' => false,
            'data' => null,
            'message' => 'Método no permitido',
            'timestamp' => date('Y-m-d H:i:s')
        ]);
        http_response_code(405);
    }
        
    } catch (Exception $e) {
    error_log("Error en ranking.php: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'data' => null,
        'message' => 'Error del servidor: ' . $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ]);
    http_response_code(500);
}
?>