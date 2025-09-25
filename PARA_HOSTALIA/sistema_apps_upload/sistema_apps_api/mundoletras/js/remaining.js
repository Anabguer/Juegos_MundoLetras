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
    console.log('💰 Animando monedas:', amount);
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
            <div style="font-size: 4rem; margin-bottom: 1rem;">🎉</div>
            <h2 style="color: #10b981; margin-bottom: 0.5rem;">¡Nivel Completado!</h2>
            <p style="margin-bottom: 1.5rem; color: #6b7280;">Nivel ${gameState.currentLevel} superado</p>
            <div style="display: flex; gap: 1rem; justify-content: center; margin-bottom: 1rem;">
                <div style="text-align: center;">
                    <div style="font-size: 1.5rem; font-weight: bold; color: #fbbf24;">+${coinsEarned}</div>
                    <div style="font-size: 0.875rem; color: #6b7280;">Monedas</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 1.5rem; font-weight: bold; color: #10b981;">${gameState.foundWords.length}</div>
                    <div style="font-size: 0.875rem; color: #6b7280;">Palabras</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 1.5rem; font-weight: bold; color: #fbbf24;">${'⭐'.repeat(stars)}</div>
                    <div style="font-size: 0.875rem; color: #6b7280;">Estrellas</div>
                </div>
            </div>
            <button onclick="showCoinsSummary(${coinsEarned}, ${stars}, ${timeRemaining}, ${isFirstTime})" 
                    style="background: #3b82f6; color: white; border: none; padding: 0.5rem 1rem; border-radius: 0.5rem; cursor: pointer;">
                Ver Detalle
            </button>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    // Guardar progreso
    console.log('🎯 Completando nivel, guardando progreso...');
    console.log('👤 Usuario actual:', gameState.currentUser);
    
    if (gameState.currentUser && gameState.currentUser.isGuest) {
        console.log('👤 Usuario invitado, guardando en localStorage');
        saveGuestProgress();
    } else if (gameState.currentUser && !gameState.currentUser.isGuest) {
        console.log('👤 Usuario registrado, guardando en BBDD');
        saveUserProgress();
    } else {
        console.log('❌ No hay usuario definido, no se puede guardar progreso');
    }
    
    // Remover overlay después de 4 segundos
    setTimeout(() => {
        if (overlay.parentNode) {
            overlay.parentNode.removeChild(overlay);
        }
    }, 4000);
}

// Animación de palabra encontrada
function animateWordFound(word) {
    // Crear elemento temporal para animación
    const wordElement = document.createElement('div');
    wordElement.textContent = word;
    wordElement.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 2rem;
        font-weight: bold;
        color: #10b981;
        z-index: 1000;
        pointer-events: none;
        animation: wordFound 2s ease-out forwards;
    `;
    
    document.body.appendChild(wordElement);
    
    // Remover después de la animación
    setTimeout(() => {
        if (wordElement.parentNode) {
            wordElement.parentNode.removeChild(wordElement);
        }
    }, 2000);
}


// Guardar progreso de invitado
function saveGuestProgress() {
    console.log('💾 Intentando guardar progreso de invitado...');
    
    if (!gameState.currentUser || !gameState.currentUser.isGuest) {
        console.log('❌ No se puede guardar: usuario no es invitado');
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
    
    console.log('📤 Guardando datos de progreso en localStorage:', progressData);
    localStorage.setItem('mundo_letras_guest_progress', JSON.stringify(progressData));
    console.log('✅ Progreso de invitado guardado exitosamente');
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
    console.log('💾 Intentando guardar progreso de usuario...');
    
    if (!gameState.currentUser || gameState.currentUser.isGuest) {
        console.log('❌ No se puede guardar: usuario invitado o no definido');
        return;
    }
    
    // Validar que el user_key esté definido
    if (!gameState.currentUser.usuario_aplicacion_key) {
        console.log('❌ No se puede guardar: user_key no definido');
        return;
    }
    
    const progressData = {
        action: 'save',
        user_key: gameState.currentUser.usuario_aplicacion_key,
        nivel_max: gameState.currentLevel,
        puntuacion_total: gameState.score,
        monedas: gameState.totalCoins
    };
    
    console.log('📤 Enviando datos de progreso:', progressData);
    
    try {
        const response = await fetch(CONFIG.API_BASE_URL + 'progress.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(progressData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            console.log('✅ Progreso guardado exitosamente:', data);
        } else {
            console.log('❌ Error al guardar progreso:', data.message);
        }
    } catch (error) {
        console.log('❌ Error de conexión al guardar progreso:', error);
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

// Actualizar lista de palabras
function updateWordsList() {
    const wordsList = document.getElementById('words-list');
    if (!wordsList) return;
    
    wordsList.innerHTML = '';
    
    gameState.currentWordsDisplay.forEach(word => {
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


