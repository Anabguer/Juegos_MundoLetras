// Funciones restantes que no están duplicadas

// Animación de puntuación
function animateScore(scoreElement, points) {
    scoreElement.classList.add('score-animation');
    const originalScore = parseInt(scoreElement.textContent);
    const targetScore = originalScore + points;
    
    // Animación de incremento gradual
    let currentScore = originalScore;
    const increment = Math.ceil(points / 10);
    const interval = setInterval(() => {
        currentScore += increment;
        if (currentScore >= targetScore) {
            currentScore = targetScore;
            clearInterval(interval);
            scoreElement.classList.remove('score-animation');
        }
        scoreElement.textContent = currentScore;
    }, 50);
}

// Animación de monedas mejorada
function animateCoins(coinsElement, amount = 10) {
    // Solo animar si hay monedas para añadir
    if (amount <= 0) return;
    
    // Reproducir sonido primero
    playSound('coin');
    
    // Crear monedas volando desde las celdas encontradas
    createFlyingCoins(amount, coinsElement);
    
    // Actualizar el contador después de que las monedas lleguen
    setTimeout(() => {
        const currentCoins = parseInt(coinsElement.textContent);
        coinsElement.textContent = currentCoins + amount;
        
        // Efecto en el contador
        coinsElement.classList.add('coin-count-animation');
        setTimeout(() => {
            coinsElement.classList.remove('coin-count-animation');
        }, 600);
    }, 1200); // Más tiempo para ver la animación de subida
}

function createFlyingCoins(amount, targetElement) {
    // Obtener posición de las celdas encontradas (última palabra)
    const foundCells = document.querySelectorAll('.grid-cell.found');
    const targetRect = targetElement.getBoundingClientRect();
    
    // Si no hay celdas encontradas, usar posición central del grid
    let startX, startY;
    if (foundCells.length > 0) {
        const lastCell = foundCells[foundCells.length - 1];
        const cellRect = lastCell.getBoundingClientRect();
        startX = cellRect.left + cellRect.width / 2;
        startY = cellRect.top + cellRect.height / 2;
    } else {
        // Posición central del grid como fallback
        const grid = document.querySelector('.game-grid');
        if (grid) {
            const gridRect = grid.getBoundingClientRect();
            startX = gridRect.left + gridRect.width / 2;
            startY = gridRect.top + gridRect.height / 2;
        } else {
            startX = window.innerWidth / 2;
            startY = window.innerHeight / 2;
        }
    }
    
    const targetX = targetRect.left + targetRect.width / 2;
    const targetY = targetRect.top + targetRect.height / 2;
    
    // Calcular diferencia
    const deltaX = targetX - startX;
    const deltaY = targetY - startY;
    
    // Crear múltiples monedas volando
    const numCoins = Math.min(amount, 5); // Máximo 5 monedas visuales
    
    for (let i = 0; i < numCoins; i++) {
        setTimeout(() => {
            const coin = document.createElement('div');
            coin.className = 'flying-coin';
            coin.textContent = '💰';
            coin.style.left = startX + 'px';
            coin.style.top = startY + 'px';
            coin.style.setProperty('--target-x', deltaX + 'px');
            coin.style.setProperty('--target-y', deltaY + 'px');
            
            document.body.appendChild(coin);
            
            // Remover después de la animación
            setTimeout(() => {
                if (coin.parentNode) {
                    coin.parentNode.removeChild(coin);
                }
            }, 1200);
        }, i * 100); // Escalonar las monedas
    }
}

// Calcular estrellas basadas en rendimiento
function calculateStars() {
    let stars = 0;
    
    // Estrella por completar el nivel
    stars++;
    
    // Estrella por tiempo (si hay límite de tiempo)
    if (gameState.levelTimerLimit > 0) {
        const timeUsed = gameState.levelTimer;
        const timeLimit = gameState.levelTimerLimit;
        const timePercentage = timeUsed / timeLimit;
        
        if (timePercentage <= 0.5) { // Completado en menos del 50% del tiempo
            stars++;
        }
    }
    
    // Estrella por pocos errores
    if (gameState.errors <= 1) {
        stars++;
    }
    
    return Math.min(stars, 3); // Máximo 3 estrellas
}

// Mostrar nivel completado
function showLevelComplete() {
    // Verificar si ya hay una modal de nivel completado visible
    const existingOverlay = document.querySelector('.level-complete-overlay');
    if (existingOverlay) {
        // Ya existe una modal, no crear otra
        return;
    }
    
    // Marcar que se está mostrando el nivel completado para evitar llamadas duplicadas
    if (gameState.showingLevelComplete) {
        return;
    }
    gameState.showingLevelComplete = true;
    
    // Calcular estrellas basadas en tiempo y errores
    const stars = calculateStars();
    
    // Calcular tiempo restante
    const timeRemaining = gameState.levelTimerLimit > 0 ? 
        Math.max(0, gameState.levelTimerLimit - gameState.levelTimer) : 0;
    
    // Verificar si es primera vez (placeholder - debería verificar en base de datos)
    const isFirstTime = true; // TODO: Implementar verificación real
    
    // Calcular monedas ganadas
    const coinsEarned = calculateLevelCoins(stars, timeRemaining, isFirstTime);
    
    // Crear overlay de nivel completado
    const overlay = document.createElement('div');
    overlay.className = 'level-complete-overlay';
    overlay.innerHTML = `
        <div class="level-complete-content">
            <div id="lottie-victory" style="width: 100px; height: 100px; margin: 0 auto 0.25rem;"></div>
            <h2 class="level-complete-title" style="font-size: 1.5rem; margin-bottom: 0.25rem;">¡Nivel Completado!</h2>
            <p class="level-complete-subtitle" style="font-size: 0.9rem; margin-bottom: 0.75rem;">Nivel ${gameState.currentLevel} superado</p>
            <div class="level-complete-stats">
                <div class="level-complete-stat">
                    <div class="level-complete-stat-value">+${coinsEarned}</div>
                    <div class="level-complete-stat-label">Monedas</div>
                </div>
                <div class="level-complete-stat">
                    <div class="level-complete-stat-value">${gameState.foundWords.length}</div>
                    <div class="level-complete-stat-label">Palabras</div>
                </div>
                <div class="level-complete-stat">
                    <div class="level-complete-stat-value">${'⭐'.repeat(stars)}</div>
                    <div class="level-complete-stat-label">Estrellas</div>
                </div>
            </div>
            <button class="btn btn-primary" onclick="nextLevel()" 
                    style="background: linear-gradient(135deg, rgba(252, 211, 77, 0.3), rgba(245, 158, 11, 0.4)); border: 2px solid #F59E0B; color: #FCD34D; width: 100%; margin-top: 0.5rem; padding: 0.6rem 1.5rem; font-size: 1rem;">
                Siguiente Nivel
            </button>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    // Cargar y reproducir animación Lottie
    setTimeout(() => {
        const lottieContainer = document.getElementById('lottie-victory');
        if (lottieContainer && typeof lottie !== 'undefined') {
            lottie.loadAnimation({
                container: lottieContainer,
                renderer: 'svg',
                loop: true,
                autoplay: true,
                path: 'sistema_apps_api/mundoletras/animations/partida_ganada.json'
            });
        }
    }, 100);
    
    // Guardar progreso
    if (gameState.currentUser && gameState.currentUser.isGuest) {
        saveGuestProgress();
    } else if (gameState.currentUser && !gameState.currentUser.isGuest) {
        saveUserProgress();
    }
    
    // NO remover automáticamente - esperar a que el usuario presione "Siguiente Nivel"
    // El overlay se eliminará cuando presionen el botón
}

// Mostrar nivel perdido
function showLevelFailed() {
    // Verificar si ya hay una modal de nivel perdido visible
    const existingOverlay = document.querySelector('.level-complete-overlay');
    if (existingOverlay) {
        // Verificar si es la modal de nivel perdido (no la de nivel completado)
        const isLevelFailedModal = existingOverlay.querySelector('.level-complete-title')?.textContent.includes('Perdido');
        if (isLevelFailedModal) {
            console.log('⚠️ Modal de nivel perdido ya visible, ignorando llamada duplicada');
            return;
        }
    }
    
    // Reproducir sonido de perder
    playSound('lose');
    
    // Crear overlay de nivel perdido
    const overlay = document.createElement('div');
    overlay.className = 'level-complete-overlay';
    overlay.innerHTML = `
        <div class="level-complete-content" style="border-color: rgba(239, 68, 68, 0.4);">
            <div id="lottie-lose" style="width: 100px; height: 100px; margin: 0 auto 0.25rem;"></div>
            <h2 class="level-complete-title" style="color: #EF4444; font-size: 1.5rem; margin-bottom: 0.25rem;">¡Nivel Perdido!</h2>
            <p class="level-complete-subtitle" style="font-size: 0.9rem; margin-bottom: 0.75rem;">El tiempo se ha agotado</p>
            <div class="level-complete-stats">
                <div class="level-complete-stat">
                    <div class="level-complete-stat-value">${gameState.foundWords.length}</div>
                    <div class="level-complete-stat-label">Palabras encontradas</div>
                </div>
                <div class="level-complete-stat">
                    <div class="level-complete-stat-value">${gameState.currentWordsDisplay.length - gameState.foundWords.length}</div>
                    <div class="level-complete-stat-label">Palabras faltantes</div>
                </div>
            </div>
            <button class="btn btn-primary" onclick="retryLevel()" 
                    style="background: linear-gradient(135deg, rgba(239, 68, 68, 0.3), rgba(220, 38, 38, 0.4)); border: 2px solid #EF4444; color: #FCA5A5; width: 100%; margin-top: 0.5rem; padding: 0.6rem 1.5rem; font-size: 1rem;">
                Reintentar Nivel
            </button>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    // Cargar animación Lottie de corazón roto (usaremos la misma estructura)
    setTimeout(() => {
        const lottieContainer = document.getElementById('lottie-lose');
        if (lottieContainer) {
            // Por ahora usamos un emoji de corazón roto, luego puedes añadir un JSON
            lottieContainer.innerHTML = '<div style="font-size: 6rem;">💔</div>';
        }
    }, 100);
    
    // No remover automáticamente - esperar a que el usuario presione reintentar
}

// Función para pasar al siguiente nivel
async function nextLevel() {
    // Remover overlay
    const overlay = document.querySelector('.level-complete-overlay');
    if (overlay && overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
    }
    
    // Limpiar flag de modal mostrada
    gameState.showingLevelComplete = false;
    
    // Actualizar estado y avanzar al siguiente nivel
    gameState.currentLevel++;
    
    // Guardar progreso DESPUÉS de incrementar el nivel
    if (gameState.currentUser && gameState.currentUser.isGuest) {
        saveGuestProgress();
    } else if (gameState.currentUser && !gameState.currentUser.isGuest) {
        await saveUserProgress();
    }
    
    // Generar el siguiente nivel correctamente
    await generateNextLevel();
}

// Función para reintentar el nivel
async function retryLevel() {
    // Remover overlay
    const overlay = document.querySelector('.level-complete-overlay');
    if (overlay && overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
    }
    
    // Limpiar flag de modal mostrada
    gameState.showingLevelComplete = false;
    
    // Reiniciar el nivel actual (sin avanzar) usando generateNextLevel
    await generateNextLevel();
}

// Animación de palabra volando desde el grid hasta la lista
function animateWordFlying(word) {
    // Obtener la posición inicial (primera celda de la palabra encontrada)
    const selectedCells = gameState.selectedCells;
    if (selectedCells.length === 0) return;
    
    const firstCell = document.querySelector(`[data-index="${selectedCells[0]}"]`);
    if (!firstCell) return;
    
    const startRect = firstCell.getBoundingClientRect();
    
    // Encontrar el elemento de la palabra en la lista
    const wordsList = document.getElementById('words-list');
    if (!wordsList) return;
    
    // Buscar el elemento de la palabra en la lista y su índice
    let targetWordElement = null;
    let wordIndex = 0;
    const wordItems = wordsList.querySelectorAll('.word-item');
    wordItems.forEach((item, index) => {
        if (item.textContent.trim() === word || item.textContent.trim().startsWith(word)) {
            targetWordElement = item;
            wordIndex = gameState.currentWordsDisplay.indexOf(word);
        }
    });
    
    if (!targetWordElement) return;
    
    const endRect = targetWordElement.getBoundingClientRect();
    
    // Obtener el color según el índice de la palabra
    const colorIndex = wordIndex % WORD_COLORS.length;
    const color = WORD_COLORS[colorIndex];
    
    // Crear elemento temporal para la animación
    const flyingWord = document.createElement('div');
    flyingWord.className = 'flying-word';
    flyingWord.textContent = word;
    flyingWord.style.left = startRect.left + startRect.width / 2 + 'px';
    flyingWord.style.top = startRect.top + startRect.height / 2 + 'px';
    flyingWord.style.backgroundColor = color.bg;
    flyingWord.style.color = color.text;
    
    // Calcular la diferencia
    const deltaX = (endRect.left + endRect.width / 2) - (startRect.left + startRect.width / 2);
    const deltaY = (endRect.top + endRect.height / 2) - (startRect.top + startRect.height / 2);
    
    flyingWord.style.setProperty('--target-x', deltaX + 'px');
    flyingWord.style.setProperty('--target-y', deltaY + 'px');
    
    document.body.appendChild(flyingWord);
    
    // Remover después de la animación y actualizar la lista
    setTimeout(() => {
        if (flyingWord.parentNode) {
            flyingWord.parentNode.removeChild(flyingWord);
        }
        // Actualizar la lista de palabras para mostrar en gris
        updateWordsList();
    }, 1000);
}

// Animación de palabra encontrada (mantener compatibilidad)
function animateWordFound(word) {
    // Solo llamar a la animación de vuelo, sin palabra en el centro
    animateWordFlying(word);
}


// Guardar progreso de invitado
function saveGuestProgress() {
    if (!gameState.currentUser || !gameState.currentUser.isGuest) {
        return;
    }
    
    const progressData = {
        level: gameState.currentLevel,
        score: gameState.score,
        streak: gameState.streak,
        coins: gameState.coins,
        totalCoins: gameState.totalCoins,
        foundWords: gameState.foundWords,
        timestamp: Date.now()
    };
    
    localStorage.setItem('mundo_letras_guest_progress', JSON.stringify(progressData));
}

// Cargar progreso de usuario registrado
async function loadUserProgress() {
    if (!gameState.currentUser || gameState.currentUser.isGuest) return;
    
    // Validar que el user_key esté definido
    if (!gameState.currentUser.usuario_aplicacion_key) {
        return;
    }
    
    try {
        const response = await fetch(CONFIG.API_BASE_URL + 'progress.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'get',
                user_key: gameState.currentUser.usuario_aplicacion_key
            })
        });
        
        const data = await response.json();
        
        if (data.success && data.data) {
            gameState.currentLevel = data.data.nivel_max || 1;
            gameState.score = data.data.puntuacion_total || 0;
            gameState.coins = data.data.monedas || 50;
            gameState.totalCoins = data.data.monedas_total || data.data.monedas || 50;
        } else {
        }
    } catch (error) {
    }
}

// Guardar progreso de usuario registrado
async function saveUserProgress() {
    if (!gameState.currentUser || gameState.currentUser.isGuest) {
        return;
    }
    
    // Validar que el user_key esté definido
    if (!gameState.currentUser.usuario_aplicacion_key) {
        return;
    }
    
    const progressData = {
        action: 'save',
        user_key: gameState.currentUser.usuario_aplicacion_key,
        nivel_max: gameState.currentLevel,
        puntuacion_total: gameState.score,
        monedas: gameState.totalCoins
    };
    
    try {
        const response = await fetch(CONFIG.API_BASE_URL + 'progress.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(progressData)
        });
        
        const data = await response.json();
    } catch (error) {
        // Error silencioso
    }
}

// Cargar progreso de invitado
function loadGuestProgress() {
    if (!gameState.currentUser || !gameState.currentUser.isGuest) return;
    
    try {
        const savedData = localStorage.getItem('mundo_letras_guest_progress');
        if (savedData) {
            const progressData = JSON.parse(savedData);
            
            // Verificar que los datos no sean muy antiguos (máximo 30 días)
            const daysSinceSave = (Date.now() - progressData.timestamp) / (1000 * 60 * 60 * 24);
            if (daysSinceSave > 30) {
                clearGuestProgress();
                return;
            }
            
            gameState.currentLevel = progressData.level || 1;
            gameState.score = progressData.score || 0;
            gameState.streak = progressData.streak || 0;
            gameState.coins = progressData.coins || 50;
            gameState.totalCoins = progressData.totalCoins || 50;
            gameState.foundWords = progressData.foundWords || [];
            
        } else {
        }
    } catch (error) {
    }
}

// Reiniciar progreso de invitado
function resetGuestProgress() {
    if (confirm('¿Estás seguro de que quieres reiniciar tu progreso? Esto eliminará tu nivel actual, puntuación, monedas y palabras encontradas. El juego reiniciará desde el nivel 1.')) {
        clearGuestProgress();
        gameState.currentLevel = 1;
        gameState.score = 0;
        gameState.streak = 0;
        gameState.coins = 50;
        gameState.foundWords = [];
        updateHUD();
        generateGrid();
        updateWordsList();
        showMessage('¡Juego reiniciado! Comienza desde el nivel 1.', 'success');
    } else {
        showMessage('Reinicio cancelado. Tu progreso se mantiene.', 'success');
    }
}

// Limpiar progreso de invitado
function clearGuestProgress() {
    localStorage.removeItem('mundo_letras_guest_progress');
}

// Actualizar información del usuario
function updateUserInfo() {
    const userIcon = document.getElementById('user-icon');
    const userName = document.getElementById('user-name');
    const userStatus = document.getElementById('user-status');
    
    if (gameState.currentUser) {
        if (gameState.currentUser.isGuest) {
            if (userIcon) userIcon.textContent = '👤';
            if (userName) userName.textContent = 'Invitado';
            if (userStatus) {
                userStatus.textContent = 'Invitado';
                userStatus.className = 'user-status-guest';
            }
        } else {
            if (userIcon) userIcon.textContent = '🎮';
            if (userName) userName.textContent = gameState.currentUser.nombre || 'Usuario';
            if (userStatus) {
                userStatus.textContent = 'Registrado';
                userStatus.className = 'user-status-logged';
            }
        }
    } else {
        if (userIcon) userIcon.textContent = '❓';
        if (userName) userName.textContent = 'No identificado';
        if (userStatus) {
            userStatus.textContent = 'Sin sesión';
            userStatus.className = 'user-status-guest';
        }
    }
    
    // Actualizar botón de menú/logout
    updateMenuButton();
}

// Actualizar botón de menú/logout
function updateMenuButton() {
    const backMenuBtn = document.getElementById('back-menu-btn');
    if (backMenuBtn) {
        if (gameState.currentUser && !gameState.currentUser.isGuest) {
            // Usuario logueado - mostrar "Cerrar Sesión"
            backMenuBtn.innerHTML = '🚪 Cerrar Sesión';
            backMenuBtn.setAttribute('data-icon', '🚪');
            backMenuBtn.setAttribute('title', 'Cerrar Sesión');
        } else {
            // Usuario invitado - mostrar "Volver al Menú"
            backMenuBtn.innerHTML = '🏠 Volver al Menú';
            backMenuBtn.setAttribute('data-icon', '🏠');
            backMenuBtn.setAttribute('title', 'Volver al Menú');
        }
    }
}

// Actualizar HUD
function updateHUD() {
    // Actualizar streak
    const streakElement = document.getElementById('streak');
    if (streakElement) {
        streakElement.textContent = gameState.streak;
    }
    
    // Actualizar monedas
    const coinsElement = document.getElementById('coins');
    if (coinsElement) {
        coinsElement.textContent = gameState.totalCoins || 50;
    }
    
    // Actualizar nivel
    const levelElement = document.getElementById('level');
    if (levelElement) {
        levelElement.textContent = gameState.currentLevel;
    }
    
    // Actualizar indicador de nivel
    const levelDisplayElement = document.getElementById('level-display');
    if (levelDisplayElement) {
        levelDisplayElement.textContent = gameState.currentLevel;
    }
    
    // Actualizar cronómetro del nivel
    const levelTimerElement = document.getElementById('level-timer');
    if (levelTimerElement) {
        if (gameState.levelTimerLimit > 0) {
            // Cronómetro con límite (cuenta atrás)
            const minutes = Math.floor(gameState.levelTimer / 60);
            const seconds = gameState.levelTimer % 60;
            levelTimerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            levelTimerElement.className = 'timer-limit';
        } else {
            // Cronómetro informativo (cuenta hacia arriba)
            const minutes = Math.floor(gameState.levelTimer / 60);
            const seconds = gameState.levelTimer % 60;
            levelTimerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            levelTimerElement.className = 'timer-info';
        }
    }
    
    // Actualizar timer dinámico si está activo
    if (gameState.activeMechanics.includes('dynamicTimer') && gameState.dynamicTimer !== null) {
        const minutes = Math.floor(gameState.dynamicTimer / 60);
        const seconds = gameState.dynamicTimer % 60;
        const dynamicTimerElement = document.getElementById('dynamic-timer');
        if (dynamicTimerElement) {
            dynamicTimerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
    }
    
    // Actualizar display de pistas
    updateHintsDisplay();
    
    // Actualizar display de monedas
    updateCoinsDisplay();
}

// Colores variados para palabras encontradas
const WORD_COLORS = [
    { bg: '#ef4444', text: '#ffffff' },  // Rojo
    { bg: '#f59e0b', text: '#ffffff' },  // Naranja
    { bg: '#eab308', text: '#ffffff' },  // Amarillo
    { bg: '#22c55e', text: '#ffffff' },  // Verde
    { bg: '#06b6d4', text: '#ffffff' },  // Cyan
    { bg: '#3b82f6', text: '#ffffff' },  // Azul
    { bg: '#8b5cf6', text: '#ffffff' },  // Violeta
    { bg: '#ec4899', text: '#ffffff' },  // Rosa
];

// Actualizar lista de palabras
function updateWordsList() {
    const wordsList = document.getElementById('words-list');
    if (!wordsList) return;
    
    wordsList.innerHTML = '';
    
    gameState.currentWordsDisplay.forEach((word, index) => {
        const wordItem = document.createElement('div');
        wordItem.className = 'word-item';
        
        // Verificar si la palabra está oculta
        const isHidden = gameState.activeMechanics.includes('hiddenWords') && 
                        gameState.hiddenWords.includes(word);
        
        // Verificar si la palabra ya fue encontrada
        const isFound = gameState.foundWords.includes(word);
        
        if (isHidden && !isFound) {
            wordItem.textContent = '?'.repeat(word.length);
            wordItem.classList.add('hidden-word');
        } else if (isFound) {
            wordItem.textContent = word;
            wordItem.classList.add('found');
            // Las palabras encontradas se mantienen en gris (por CSS)
        } else {
            wordItem.textContent = word;
        }
        
        // Verificar si la palabra expiró
        const isExpired = gameState.activeMechanics.includes('wordTimer') && 
                         gameState.wordTimers[word] === 0;
        
        if (isExpired && !isFound) {
            wordItem.classList.add('expired');
        }
        
        // Añadir timer si está activo
        if (gameState.activeMechanics.includes('wordTimer') && gameState.wordTimers[word] !== undefined) {
            const timer = gameState.wordTimers[word];
            const timerElement = document.createElement('div');
            timerElement.className = 'word-timer';
            timerElement.textContent = `${timer}s`;
            
            // Cambiar color según tiempo restante
            if (timer <= 10) {
                timerElement.classList.add('timer-critical');
            } else if (timer <= 20) {
                timerElement.classList.add('timer-warning');
            }
            
            wordItem.appendChild(timerElement);
        }
        
        wordsList.appendChild(wordItem);
    });
}


