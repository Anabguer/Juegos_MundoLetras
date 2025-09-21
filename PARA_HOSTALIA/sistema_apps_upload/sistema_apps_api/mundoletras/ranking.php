<?php
/**
 * API de Ranking - Mundo Letras
 * Maneja rankings globales, semanales y de amigos
 */

require_once 'config.php';

// Obtener datos de entrada
$input = Utils::getJsonInput();
$action = $input['action'] ?? '';

switch ($action) {
    case 'global':
        handleGlobalRanking($input);
        break;
    case 'weekly':
        handleWeeklyRanking($input);
        break;
    case 'level':
        handleLevelRanking($input);
        break;
    case 'user_stats':
        handleUserStats($input);
        break;
    default:
        Utils::jsonResponse(false, null, 'Acción no válida', 400);
}

/**
 * Obtener ranking global
 */
function handleGlobalRanking($input) {
    global $db;
    
    $limit = min(100, max(10, (int)($input['limit'] ?? 50)));
    $offset = max(0, (int)($input['offset'] ?? 0));
    
    try {
        // Calcular ranking basado en nivel máximo y puntuación total
        $ranking = $db->fetchAll(
            "SELECT 
                u.nombre,
                p.nivel_max,
                p.monedas,
                COALESCE(SUM(s.score), 0) as total_score,
                COUNT(DISTINCT s.nivel_id) as niveles_completados,
                MAX(s.fecha) as ultima_actividad,
                ROW_NUMBER() OVER (ORDER BY p.nivel_max DESC, COALESCE(SUM(s.score), 0) DESC) as posicion
             FROM usuarios_aplicaciones u
             JOIN mundoletras_progreso p ON u.usuario_aplicacion_key = p.usuario_aplicacion_key
             LEFT JOIN mundoletras_scores s ON u.usuario_aplicacion_key = s.usuario_aplicacion_key
             WHERE u.app_codigo = ? AND u.activo = 1
             GROUP BY u.usuario_aplicacion_id, u.nombre, p.nivel_max, p.monedas
             ORDER BY p.nivel_max DESC, total_score DESC
             LIMIT ? OFFSET ?",
            [APP_CODIGO, $limit, $offset]
        );
        
        // Obtener total de usuarios para paginación
        $totalUsers = $db->fetchOne(
            "SELECT COUNT(*) as total FROM usuarios_aplicaciones u
             JOIN mundoletras_progreso p ON u.usuario_aplicacion_key = p.usuario_aplicacion_key
             WHERE u.app_codigo = ? AND u.activo = 1",
            [APP_CODIGO]
        );
        
        Utils::jsonResponse(true, [
            'ranking' => array_map(function($user) {
                return [
                    'posicion' => (int)$user['posicion'],
                    'nombre' => $user['nombre'],
                    'nivel_max' => (int)$user['nivel_max'],
                    'total_score' => (int)$user['total_score'],
                    'niveles_completados' => (int)$user['niveles_completados'],
                    'monedas' => (int)$user['monedas'],
                    'ultima_actividad' => $user['ultima_actividad']
                ];
            }, $ranking),
            'pagination' => [
                'limit' => $limit,
                'offset' => $offset,
                'total' => (int)$totalUsers['total'],
                'has_more' => ($offset + $limit) < (int)$totalUsers['total']
            ]
        ]);
        
    } catch (Exception $e) {
        Utils::logError("Error obteniendo ranking global", ['error' => $e->getMessage()]);
        Utils::jsonResponse(false, null, 'Error obteniendo ranking', 500);
    }
}

/**
 * Obtener ranking semanal
 */
function handleWeeklyRanking($input) {
    global $db;
    
    $limit = min(100, max(10, (int)($input['limit'] ?? 50)));
    $week = Utils::sanitizeInput($input['week'] ?? date('Y-W'));
    
    try {
        // Calcular fechas de la semana
        $year = (int)substr($week, 0, 4);
        $weekNum = (int)substr($week, 5, 2);
        
        $startDate = new DateTime();
        $startDate->setISODate($year, $weekNum, 1); // Lunes
        $endDate = clone $startDate;
        $endDate->modify('+6 days'); // Domingo
        
        $startDateStr = $startDate->format('Y-m-d 00:00:00');
        $endDateStr = $endDate->format('Y-m-d 23:59:59');
        
        // Obtener ranking de la semana
        $ranking = $db->fetchAll(
            "SELECT 
                u.nombre,
                SUM(s.score) as weekly_score,
                COUNT(s.scores_id) as games_played,
                AVG(s.score) as avg_score,
                ROW_NUMBER() OVER (ORDER BY SUM(s.score) DESC) as posicion
             FROM usuarios_aplicaciones u
             JOIN mundoletras_scores s ON u.usuario_aplicacion_key = s.usuario_aplicacion_key
             WHERE u.app_codigo = ? AND u.activo = 1 
             AND s.fecha BETWEEN ? AND ?
             GROUP BY u.usuario_aplicacion_id, u.nombre
             HAVING SUM(s.score) > 0
             ORDER BY weekly_score DESC
             LIMIT ?",
            [APP_CODIGO, $startDateStr, $endDateStr, $limit]
        );
        
        Utils::jsonResponse(true, [
            'ranking' => array_map(function($user) {
                return [
                    'posicion' => (int)$user['posicion'],
                    'nombre' => $user['nombre'],
                    'weekly_score' => (int)$user['weekly_score'],
                    'games_played' => (int)$user['games_played'],
                    'avg_score' => round((float)$user['avg_score'], 1)
                ];
            }, $ranking),
            'week_info' => [
                'week' => $week,
                'start_date' => $startDate->format('Y-m-d'),
                'end_date' => $endDate->format('Y-m-d'),
                'is_current_week' => $week === date('Y-W')
            ]
        ]);
        
    } catch (Exception $e) {
        Utils::logError("Error obteniendo ranking semanal", ['week' => $week, 'error' => $e->getMessage()]);
        Utils::jsonResponse(false, null, 'Error obteniendo ranking semanal', 500);
    }
}

/**
 * Obtener ranking de un nivel específico
 */
function handleLevelRanking($input) {
    global $db;
    
    $nivelId = (int)($input['nivel_id'] ?? 0);
    $limit = min(50, max(10, (int)($input['limit'] ?? 20)));
    
    if ($nivelId < 1) {
        Utils::jsonResponse(false, null, 'ID de nivel requerido', 400);
    }
    
    try {
        // Obtener mejores puntuaciones del nivel
        $ranking = $db->fetchAll(
            "SELECT 
                u.nombre,
                s.score,
                s.tiempo_ms,
                s.fecha,
                ROW_NUMBER() OVER (ORDER BY s.score DESC, s.tiempo_ms ASC) as posicion
             FROM mundoletras_scores s
             JOIN usuarios_aplicaciones u ON s.usuario_aplicacion_key = u.usuario_aplicacion_key
             WHERE s.nivel_id = ? AND u.app_codigo = ? AND u.activo = 1
             AND s.scores_id IN (
                 SELECT MAX(s2.scores_id) 
                 FROM mundoletras_scores s2 
                 WHERE s2.usuario_aplicacion_key = s.usuario_aplicacion_key 
                 AND s2.nivel_id = s.nivel_id
                 GROUP BY s2.usuario_aplicacion_key
             )
             ORDER BY s.score DESC, s.tiempo_ms ASC
             LIMIT ?",
            [$nivelId, APP_CODIGO, $limit]
        );
        
        // Estadísticas del nivel
        $levelStats = $db->fetchOne(
            "SELECT 
                COUNT(DISTINCT s.usuario_aplicacion_key) as total_players,
                MAX(s.score) as best_score,
                AVG(s.score) as avg_score,
                MIN(s.tiempo_ms) as best_time,
                AVG(s.tiempo_ms) as avg_time
             FROM mundoletras_scores s
             JOIN usuarios_aplicaciones u ON s.usuario_aplicacion_key = u.usuario_aplicacion_key
             WHERE s.nivel_id = ? AND u.app_codigo = ? AND u.activo = 1",
            [$nivelId, APP_CODIGO]
        );
        
        Utils::jsonResponse(true, [
            'nivel_id' => $nivelId,
            'ranking' => array_map(function($score) {
                return [
                    'posicion' => (int)$score['posicion'],
                    'nombre' => $score['nombre'],
                    'score' => (int)$score['score'],
                    'tiempo_ms' => (int)$score['tiempo_ms'],
                    'fecha' => $score['fecha']
                ];
            }, $ranking),
            'stats' => [
                'total_players' => (int)($levelStats['total_players'] ?? 0),
                'best_score' => (int)($levelStats['best_score'] ?? 0),
                'avg_score' => round((float)($levelStats['avg_score'] ?? 0), 1),
                'best_time_ms' => (int)($levelStats['best_time'] ?? 0),
                'avg_time_ms' => (int)($levelStats['avg_time'] ?? 0)
            ]
        ]);
        
    } catch (Exception $e) {
        Utils::logError("Error obteniendo ranking del nivel", ['nivel_id' => $nivelId, 'error' => $e->getMessage()]);
        Utils::jsonResponse(false, null, 'Error obteniendo ranking del nivel', 500);
    }
}

/**
 * Obtener estadísticas de un usuario
 */
function handleUserStats($input) {
    global $db;
    
    $userKey = Utils::sanitizeInput($input['user_key'] ?? '');
    
    if (empty($userKey)) {
        Utils::jsonResponse(false, null, 'Clave de usuario requerida', 400);
    }
    
    try {
        // Estadísticas generales del usuario
        $userStats = $db->fetchOne(
            "SELECT 
                u.nombre,
                p.nivel_max,
                p.monedas,
                COUNT(s.scores_id) as total_games,
                COALESCE(SUM(s.score), 0) as total_score,
                COALESCE(AVG(s.score), 0) as avg_score,
                COALESCE(MAX(s.score), 0) as best_score,
                COUNT(DISTINCT s.nivel_id) as unique_levels_played,
                MIN(s.fecha) as first_game,
                MAX(s.fecha) as last_game
             FROM usuarios_aplicaciones u
             JOIN mundoletras_progreso p ON u.usuario_aplicacion_key = p.usuario_aplicacion_key
             LEFT JOIN mundoletras_scores s ON u.usuario_aplicacion_key = s.usuario_aplicacion_key
             WHERE u.usuario_aplicacion_key = ? AND u.app_codigo = ? AND u.activo = 1
             GROUP BY u.usuario_aplicacion_id, u.nombre, p.nivel_max, p.monedas",
            [$userKey, APP_CODIGO]
        );
        
        if (!$userStats) {
            Utils::jsonResponse(false, null, 'Usuario no encontrado', 404);
        }
        
        // Posición en ranking global
        $globalPosition = $db->fetchOne(
            "SELECT posicion FROM (
                SELECT 
                    u.usuario_aplicacion_key,
                    ROW_NUMBER() OVER (ORDER BY p.nivel_max DESC, COALESCE(SUM(s.score), 0) DESC) as posicion
                FROM usuarios_aplicaciones u
                JOIN mundoletras_progreso p ON u.usuario_aplicacion_key = p.usuario_aplicacion_key
                LEFT JOIN mundoletras_scores s ON u.usuario_aplicacion_key = s.usuario_aplicacion_key
                WHERE u.app_codigo = ? AND u.activo = 1
                GROUP BY u.usuario_aplicacion_key, p.nivel_max
            ) rankings
            WHERE usuario_aplicacion_key = ?",
            [APP_CODIGO, $userKey]
        );
        
        // Últimas puntuaciones
        $recentScores = $db->fetchAll(
            "SELECT nivel_id, score, tiempo_ms, fecha 
             FROM mundoletras_scores 
             WHERE usuario_aplicacion_key = ? 
             ORDER BY fecha DESC 
             LIMIT 10",
            [$userKey]
        );
        
        Utils::jsonResponse(true, [
            'user' => [
                'nombre' => $userStats['nombre'],
                'nivel_max' => (int)$userStats['nivel_max'],
                'monedas' => (int)$userStats['monedas'],
                'global_position' => (int)($globalPosition['posicion'] ?? 0)
            ],
            'stats' => [
                'total_games' => (int)$userStats['total_games'],
                'total_score' => (int)$userStats['total_score'],
                'avg_score' => round((float)$userStats['avg_score'], 1),
                'best_score' => (int)$userStats['best_score'],
                'unique_levels_played' => (int)$userStats['unique_levels_played'],
                'first_game' => $userStats['first_game'],
                'last_game' => $userStats['last_game']
            ],
            'recent_scores' => array_map(function($score) {
                return [
                    'nivel_id' => (int)$score['nivel_id'],
                    'score' => (int)$score['score'],
                    'tiempo_ms' => (int)$score['tiempo_ms'],
                    'fecha' => $score['fecha']
                ];
            }, $recentScores)
        ]);
        
    } catch (Exception $e) {
        Utils::logError("Error obteniendo estadísticas de usuario", ['user_key' => $userKey, 'error' => $e->getMessage()]);
        Utils::jsonResponse(false, null, 'Error obteniendo estadísticas', 500);
    }
}
?>
