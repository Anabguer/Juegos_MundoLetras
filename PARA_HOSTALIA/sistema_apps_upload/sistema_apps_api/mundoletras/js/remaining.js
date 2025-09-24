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
        console.log('💰 Monedas actualizadas:', currentCoins + amount);
        
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

// Mostrar nivel completado
function showLevelComplete() {
    // Crear overlay de nivel completado
    const overlay = document.createElement('div');
    overlay.className = 'level-complete-overlay';
    overlay.innerHTML = `
        <div class="level-complete-content">
            <div style="font-size: 4rem; margin-bottom: 1rem;">🎉</div>
            <h2 style="color: #10b981; margin-bottom: 0.5rem;">¡Nivel Completado!</h2>
            <p style="margin-bottom: 1.5rem; color: #6b7280;">Nivel ${gameState.currentLevel} superado</p>
            <div style="display: flex; gap: 1rem; justify-content: center;">
                <div style="text-align: center;">
                    <div style="font-size: 1.5rem; font-weight: bold; color: #fbbf24;">+10</div>
                    <div style="font-size: 0.875rem; color: #6b7280;">Monedas</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 1.5rem; font-weight: bold; color: #10b981;">${gameState.foundWords.length}</div>
                    <div style="font-size: 0.875rem; color: #6b7280;">Palabras</div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
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

// Debug de colocación de palabras
function debugWordPlacement() {
    console.log('🔍 === VERIFICACIÓN DE PALABRAS EN GRID ===');
    console.log('📝 Palabras que deberían estar:', gameState.currentWords);
    console.log('📏 Grid size:', Math.sqrt(gameState.currentGrid.length));
    
    gameState.currentWords.forEach(word => {
        console.log(`\n🔍 Buscando "${word}" (${word.length} letras):`);
        
        const gridSize = Math.sqrt(gameState.currentGrid.length);
        let found = false;
        
        // Buscar en todas las direcciones
        for (let row = 0; row < gridSize; row++) {
            for (let col = 0; col < gridSize; col++) {
                const startIndex = row * gridSize + col;
                
                // Direcciones: horizontal, vertical, diagonal-der, diagonal-izq
                const directions = [
                    { dr: 0, dc: 1, name: 'horizontal' },
                    { dr: 1, dc: 0, name: 'vertical' },
                    { dr: 1, dc: 1, name: 'diagonal-der' },
                    { dr: 1, dc: -1, name: 'diagonal-izq' }
                ];
                
                directions.forEach(dir => {
                    let currentWord = '';
                    let valid = true;
                    
                    for (let i = 0; i < word.length; i++) {
                        const checkRow = row + (dir.dr * i);
                        const checkCol = col + (dir.dc * i);
                        
                        if (checkRow >= 0 && checkRow < gridSize && checkCol >= 0 && checkCol < gridSize) {
                            const index = checkRow * gridSize + checkCol;
                            // Usar originalGrid si está disponible (para mecánica de niebla), sino currentGrid
                            const letter = gameState.originalGrid && gameState.originalGrid[index] ? gameState.originalGrid[index] : gameState.currentGrid[index];
                            currentWord += letter;
                        } else {
                            valid = false;
                            break;
                        }
                    }
                    
                    if (valid && (currentWord === word || currentWord === word.split('').reverse().join(''))) {
                        console.log(`✅ "${word}" encontrada en (${row + 1},${col + 1}) dirección ${dir.name}`);
                        console.log(`   Palabra en grid: "${currentWord}"`);
                        console.log(`   Posición visual: fila ${row + 1}, columna ${col + 1}`);
                        found = true;
                    }
                });
            }
        }
        
        if (!found) {
            console.log(`❌ "${word}" NO ENCONTRADA en el grid`);
        }
    });
    
    console.log('\n📊 Grid completo:');
    const gridSize = Math.sqrt(gameState.currentGrid.length);
    for (let row = 0; row < gridSize; row++) {
        let rowStr = '';
        for (let col = 0; col < gridSize; col++) {
            const index = row * gridSize + col;
            rowStr += gameState.currentGrid[index] + ' ';
        }
        console.log(`Fila ${row}: ${rowStr}`);
    }
    console.log('🔍 === FIN VERIFICACIÓN ===');
}

// Guardar progreso de invitado
function saveGuestProgress() {
    if (!gameState.currentUser || !gameState.currentUser.isGuest) return;
    
    const progressData = {
        level: gameState.currentLevel,
        score: gameState.score,
        streak: gameState.streak,
        coins: gameState.coins,
        foundWords: gameState.foundWords,
        timestamp: Date.now()
    };
    
    localStorage.setItem('mundo_letras_guest_progress', JSON.stringify(progressData));
    console.log('💾 Progreso de invitado guardado:', progressData);
}

// Cargar progreso de usuario registrado
async function loadUserProgress() {
    if (!gameState.currentUser || gameState.currentUser.isGuest) return;
    
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
            console.log('📥 Progreso de usuario cargado:', data.data);
        } else {
            console.log('📥 Usuario nuevo, comenzando desde el nivel 1');
        }
    } catch (error) {
        console.error('❌ Error cargando progreso:', error);
        console.log('📥 Usando valores por defecto');
    }
}

// Guardar progreso de usuario registrado
async function saveUserProgress() {
    if (!gameState.currentUser || gameState.currentUser.isGuest) return;
    
    try {
        const response = await fetch(CONFIG.API_BASE_URL + 'progress.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'save',
                user_key: gameState.currentUser.usuario_aplicacion_key,
                level: gameState.currentLevel,
                score: gameState.score,
                coins: gameState.coins
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            console.log('💾 Progreso de usuario guardado');
        } else {
            console.error('❌ Error guardando progreso:', data.message);
        }
    } catch (error) {
        console.error('❌ Error guardando progreso:', error);
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
                console.log('📅 Progreso muy antiguo, comenzando de nuevo');
                clearGuestProgress();
                return;
            }
            
            gameState.currentLevel = progressData.level || 1;
            gameState.score = progressData.score || 0;
            gameState.streak = progressData.streak || 0;
            gameState.coins = progressData.coins || 50;
            gameState.foundWords = progressData.foundWords || [];
            
            console.log('📥 Progreso de invitado cargado:', progressData);
        } else {
            console.log('📥 Invitado nuevo, comenzando desde el nivel 1');
        }
    } catch (error) {
        console.error('❌ Error cargando progreso de invitado:', error);
        console.log('📥 Usando valores por defecto');
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
    console.log('🧹 Progreso de invitado limpiado');
}

// Actualizar información del usuario
function updateUserInfo() {
    const userIcon = document.getElementById('user-icon');
    const userName = document.getElementById('user-name');
    const userStatus = document.getElementById('user-status');
    
    if (gameState.currentUser) {
        if (gameState.currentUser.isGuest) {
            userIcon.textContent = '👤';
            userName.textContent = 'Invitado';
            if (userStatus) {
                userStatus.textContent = 'Invitado';
                userStatus.className = 'user-status-guest';
            }
        } else {
            userIcon.textContent = '🎮';
            userName.textContent = gameState.currentUser.nombre || 'Usuario';
            if (userStatus) {
                userStatus.textContent = 'Registrado';
                userStatus.className = 'user-status-logged';
            }
        }
    } else {
        userIcon.textContent = '❓';
        userName.textContent = 'No identificado';
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
    document.getElementById('score').textContent = gameState.score;
    document.getElementById('streak').textContent = gameState.streak;
    document.getElementById('coins').textContent = gameState.coins;
    document.getElementById('level').textContent = gameState.currentLevel;
    
    // Actualizar timer dinámico si está activo
    if (gameState.activeMechanics.includes('dynamicTimer') && gameState.dynamicTimer !== null) {
        const minutes = Math.floor(gameState.dynamicTimer / 60);
        const seconds = gameState.dynamicTimer % 60;
        document.getElementById('dynamic-timer').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
}

// Actualizar lista de palabras
function updateWordsList() {
    const wordsList = document.getElementById('words-list');
    wordsList.innerHTML = '';
    
    gameState.currentWords.forEach(word => {
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
