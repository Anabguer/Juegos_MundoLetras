<?php
/**
 * API de Progreso - Mundo Letras
 * Maneja progreso de usuario, niveles completados y monedas
 */

require_once 'config.php';

// Obtener datos de entrada
$input = Utils::getJsonInput();
$action = $input['action'] ?? '';

switch ($action) {
    case 'get':
        handleGetProgress($input);
        break;
    case 'update':
        handleUpdateProgress($input);
        break;
    case 'sync':
        handleSyncProgress($input);
        break;
    case 'submit_score':
        handleSubmitScore($input);
        break;
    default:
        Utils::jsonResponse(false, null, 'Acción no válida', 400);
}

/**
 * Obtener progreso del usuario
 */
function handleGetProgress($input) {
    global $db;
    
    $userKey = Utils::sanitizeInput($input['user_key'] ?? '');
    
    if (empty($userKey)) {
        Utils::jsonResponse(false, null, 'Clave de usuario requerida', 400);
    }
    
    try {
        // Obtener progreso
        $progress = $db->fetchOne(
            "SELECT nivel_max, monedas, actualizado_at FROM mundoletras_progreso WHERE usuario_aplicacion_key = ?",
            [$userKey]
        );
        
        if (!$progress) {
            // Crear progreso inicial
            $db->query(
                "INSERT INTO mundoletras_progreso (usuario_aplicacion_key, nivel_max, monedas) VALUES (?, 1, ?)",
                [$userKey, DEFAULT_COINS]
            );
            
            $progress = [
                'nivel_max' => 1,
                'monedas' => DEFAULT_COINS,
                'actualizado_at' => date('Y-m-d H:i:s')
            ];
        }
        
        // Obtener últimos scores
        $recentScores = $db->fetchAll(
            "SELECT nivel_id, score, tiempo_ms, fecha 
             FROM mundoletras_scores 
             WHERE usuario_aplicacion_key = ? 
             ORDER BY fecha DESC 
             LIMIT 10",
            [$userKey]
        );
        
        Utils::jsonResponse(true, [
            'progress' => [
                'usuario_aplicacion_key' => $userKey,
                'nivel_max' => (int)$progress['nivel_max'],
                'monedas' => (int)$progress['monedas'],
                'actualizado_at' => $progress['actualizado_at']
            ],
            'recent_scores' => $recentScores
        ]);
        
    } catch (Exception $e) {
        Utils::logError("Error obteniendo progreso", ['user_key' => $userKey, 'error' => $e->getMessage()]);
        Utils::jsonResponse(false, null, 'Error obteniendo progreso', 500);
    }
}

/**
 * Actualizar progreso del usuario
 */
function handleUpdateProgress($input) {
    global $db;
    
    $userKey = Utils::sanitizeInput($input['user_key'] ?? '');
    $nivelMax = (int)($input['nivel_max'] ?? 0);
    $monedas = (int)($input['monedas'] ?? 0);
    
    if (empty($userKey)) {
        Utils::jsonResponse(false, null, 'Clave de usuario requerida', 400);
    }
    
    if ($nivelMax < 1 || $nivelMax > MAX_LEVELS) {
        Utils::jsonResponse(false, null, 'Nivel no válido', 400);
    }
    
    if ($monedas < 0) {
        Utils::jsonResponse(false, null, 'Las monedas no pueden ser negativas', 400);
    }
    
    try {
        // Verificar progreso actual
        $currentProgress = $db->fetchOne(
            "SELECT nivel_max, monedas FROM mundoletras_progreso WHERE usuario_aplicacion_key = ?",
            [$userKey]
        );
        
        if (!$currentProgress) {
            Utils::jsonResponse(false, null, 'Usuario no encontrado', 404);
        }
        
        // Solo permitir avanzar niveles, no retroceder (anti-trampas básico)
        $newNivelMax = max((int)$currentProgress['nivel_max'], $nivelMax);
        
        // Actualizar progreso
        $db->query(
            "UPDATE mundoletras_progreso 
             SET nivel_max = ?, monedas = ?, actualizado_at = NOW() 
             WHERE usuario_aplicacion_key = ?",
            [$newNivelMax, $monedas, $userKey]
        );
        
        Utils::jsonResponse(true, [
            'nivel_max' => $newNivelMax,
            'monedas' => $monedas,
            'actualizado_at' => date('Y-m-d H:i:s')
        ], 'Progreso actualizado');
        
    } catch (Exception $e) {
        Utils::logError("Error actualizando progreso", ['user_key' => $userKey, 'error' => $e->getMessage()]);
        Utils::jsonResponse(false, null, 'Error actualizando progreso', 500);
    }
}

/**
 * Sincronizar progreso (merge local con servidor)
 */
function handleSyncProgress($input) {
    global $db;
    
    $userKey = Utils::sanitizeInput($input['user_key'] ?? '');
    $localProgress = $input['local_progress'] ?? [];
    
    if (empty($userKey)) {
        Utils::jsonResponse(false, null, 'Clave de usuario requerida', 400);
    }
    
    try {
        // Obtener progreso del servidor
        $serverProgress = $db->fetchOne(
            "SELECT nivel_max, monedas, actualizado_at FROM mundoletras_progreso WHERE usuario_aplicacion_key = ?",
            [$userKey]
        );
        
        if (!$serverProgress) {
            // Crear progreso inicial con datos locales
            $nivelMax = max(1, (int)($localProgress['nivel_max'] ?? 1));
            $monedas = max(DEFAULT_COINS, (int)($localProgress['monedas'] ?? DEFAULT_COINS));
            
            $db->query(
                "INSERT INTO mundoletras_progreso (usuario_aplicacion_key, nivel_max, monedas) VALUES (?, ?, ?)",
                [$userKey, $nivelMax, $monedas]
            );
            
            $finalProgress = [
                'nivel_max' => $nivelMax,
                'monedas' => $monedas,
                'actualizado_at' => date('Y-m-d H:i:s')
            ];
        } else {
            // Merge: tomar el máximo nivel y la mayor cantidad de monedas
            $localNivelMax = (int)($localProgress['nivel_max'] ?? 1);
            $localMonedas = (int)($localProgress['monedas'] ?? DEFAULT_COINS);
            $localTimestamp = $localProgress['actualizado_at'] ?? '1970-01-01 00:00:00';
            
            $serverNivelMax = (int)$serverProgress['nivel_max'];
            $serverMonedas = (int)$serverProgress['monedas'];
            $serverTimestamp = $serverProgress['actualizado_at'];
            
            // Determinar valores finales
            $finalNivelMax = max($localNivelMax, $serverNivelMax);
            $finalMonedas = max($localMonedas, $serverMonedas);
            
            // Actualizar si hay cambios
            if ($finalNivelMax !== $serverNivelMax || $finalMonedas !== $serverMonedas) {
                $db->query(
                    "UPDATE mundoletras_progreso 
                     SET nivel_max = ?, monedas = ?, actualizado_at = NOW() 
                     WHERE usuario_aplicacion_key = ?",
                    [$finalNivelMax, $finalMonedas, $userKey]
                );
            }
            
            $finalProgress = [
                'nivel_max' => $finalNivelMax,
                'monedas' => $finalMonedas,
                'actualizado_at' => date('Y-m-d H:i:s')
            ];
        }
        
        Utils::jsonResponse(true, [
            'progress' => array_merge($finalProgress, ['usuario_aplicacion_key' => $userKey]),
            'sync_info' => [
                'server_was_newer' => isset($serverProgress) && strtotime($serverProgress['actualizado_at']) > strtotime($localTimestamp ?? '1970-01-01'),
                'local_was_newer' => strtotime($localTimestamp ?? '1970-01-01') > strtotime($serverProgress['actualizado_at'] ?? '1970-01-01'),
                'merged' => true
            ]
        ], 'Progreso sincronizado');
        
    } catch (Exception $e) {
        Utils::logError("Error sincronizando progreso", ['user_key' => $userKey, 'error' => $e->getMessage()]);
        Utils::jsonResponse(false, null, 'Error sincronizando progreso', 500);
    }
}

/**
 * Enviar puntuación de nivel completado
 */
function handleSubmitScore($input) {
    global $db;
    
    $userKey = Utils::sanitizeInput($input['user_key'] ?? '');
    $nivelId = (int)($input['nivel_id'] ?? 0);
    $score = (int)($input['score'] ?? 0);
    $tiempoMs = (int)($input['tiempo_ms'] ?? 0);
    $deviceHash = Utils::sanitizeInput($input['device_hash'] ?? '');
    $seed = Utils::sanitizeInput($input['seed'] ?? '');
    $clientHash = Utils::sanitizeInput($input['client_hash'] ?? '');
    
    if (empty($userKey) || $nivelId < 1 || $score < 0 || $tiempoMs < 0) {
        Utils::jsonResponse(false, null, 'Datos de puntuación inválidos', 400);
    }
    
    try {
        // Validación anti-trampas básica
        $isValidHash = true;
        if (!empty($clientHash) && !empty($seed)) {
            $isValidHash = Utils::validateDeviceHash($nivelId, $score, $tiempoMs, $seed, $clientHash);
        }
        
        if (!$isValidHash) {
            Utils::logError("Hash inválido detectado", [
                'user_key' => $userKey,
                'nivel_id' => $nivelId,
                'score' => $score,
                'client_hash' => $clientHash
            ]);
            Utils::jsonResponse(false, null, 'Datos de puntuación sospechosos', 400);
        }
        
        // Verificar límites razonables
        $maxScorePerLevel = 10000; // Ajustar según el diseño del juego
        $minTimePerLevel = 5000; // 5 segundos mínimo
        $maxTimePerLevel = 600000; // 10 minutos máximo
        
        if ($score > $maxScorePerLevel) {
            Utils::jsonResponse(false, null, 'Puntuación demasiado alta', 400);
        }
        
        if ($tiempoMs > 0 && ($tiempoMs < $minTimePerLevel || $tiempoMs > $maxTimePerLevel)) {
            Utils::jsonResponse(false, null, 'Tiempo de juego sospechoso', 400);
        }
        
        // Insertar puntuación
        $db->query(
            "INSERT INTO mundoletras_scores (usuario_aplicacion_key, nivel_id, score, tiempo_ms, device_hash, fecha) 
             VALUES (?, ?, ?, ?, ?, NOW())",
            [$userKey, $nivelId, $score, $tiempoMs, $deviceHash]
        );
        
        $scoreId = $db->lastInsertId();
        
        // Verificar si es un nuevo récord personal
        $bestScore = $db->fetchOne(
            "SELECT MAX(score) as best_score FROM mundoletras_scores 
             WHERE usuario_aplicacion_key = ? AND nivel_id = ? AND scores_id != ?",
            [$userKey, $nivelId, $scoreId]
        );
        
        $isNewRecord = !$bestScore || $score > (int)$bestScore['best_score'];
        
        // Actualizar progreso si completó un nuevo nivel
        if ($isNewRecord) {
            $currentProgress = $db->fetchOne(
                "SELECT nivel_max FROM mundoletras_progreso WHERE usuario_aplicacion_key = ?",
                [$userKey]
            );
            
            if ($currentProgress && $nivelId >= (int)$currentProgress['nivel_max']) {
                $newNivelMax = $nivelId + 1;
                $db->query(
                    "UPDATE mundoletras_progreso 
                     SET nivel_max = ?, actualizado_at = NOW() 
                     WHERE usuario_aplicacion_key = ?",
                    [$newNivelMax, $userKey]
                );
            }
        }
        
        Utils::jsonResponse(true, [
            'score_id' => $scoreId,
            'is_new_record' => $isNewRecord,
            'nivel_id' => $nivelId,
            'score' => $score,
            'tiempo_ms' => $tiempoMs
        ], 'Puntuación registrada');
        
    } catch (Exception $e) {
        Utils::logError("Error enviando puntuación", [
            'user_key' => $userKey,
            'nivel_id' => $nivelId,
            'error' => $e->getMessage()
        ]);
        Utils::jsonResponse(false, null, 'Error registrando puntuación', 500);
    }
}
?>
