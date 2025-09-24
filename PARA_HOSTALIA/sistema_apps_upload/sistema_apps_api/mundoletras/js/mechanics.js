// Generar mecánicas aleatorias para todos los niveles
function generateRandomMechanics(level) {
    // Las mecánicas siguen siendo aleatorias en todos los niveles
    
    const availableMechanics = [
        'fog',        // Niebla - revelar letras al completar palabras
        'ghost',      // Fantasma - letras translúcidas
        'hiddenWords', // Palabras ocultas
        'wordTimer',   // Timer por palabra
        'dynamicTimer' // Timer dinámico general
    ];
    
    // UNA MECÁNICA POR NIVEL - No mezclar mecánicas
    const numMechanics = 1; // Siempre 1 mecánica por nivel
    
    // Seleccionar mecánicas aleatorias sin repetir
    const selectedMechanics = [];
    const shuffledMechanics = [...availableMechanics].sort(() => Math.random() - 0.5);
    
    for (let i = 0; i < numMechanics && i < shuffledMechanics.length; i++) {
        selectedMechanics.push(shuffledMechanics[i]);
    }
    
    return selectedMechanics;
}

// Aplicar mecánicas al juego
function applyMechanics(mechanics) {
    gameState.activeMechanics = mechanics;
    
    // Limpiar estado previo de mecánicas
    gameState.originalGrid = [];
    gameState.revealedCells = [];
    gameState.hiddenWords = [];
    gameState.wordTimers = {};
    gameState.levelExpired = false;
    gameState.failedAttempts = 0;
    
    // Limpiar timers
    if (gameState.dynamicTimerInterval) {
        clearInterval(gameState.dynamicTimerInterval);
        gameState.dynamicTimerInterval = null;
    }
    if (gameState.wordTimerInterval) {
        clearInterval(gameState.wordTimerInterval);
        gameState.wordTimerInterval = null;
    }
    
    // Aplicar cada mecánica
    mechanics.forEach(mechanic => {
        switch (mechanic) {
            case 'fog':
                applyFogMechanic();
                break;
            case 'ghost':
                applyGhostMechanic();
                break;
            case 'hiddenWords':
                applyHiddenWordsMechanic();
                break;
            case 'wordTimer':
                applyWordTimerMechanic();
                break;
            case 'dynamicTimer':
                applyDynamicTimerMechanic();
                break;
        }
    });
    
    // Actualizar interfaz para mostrar mecánicas activas
    updateMechanicsDisplay();
    
    // Actualizar lista de palabras después de aplicar mecánicas
    updateWordsList();
    
    // Aplicar mecánicas visuales después de que se hayan aplicado las lógicas
    setTimeout(() => {
        applyVisualMechanics();
    }, 200);
}

// Actualizar display de mecánicas activas
function updateMechanicsDisplay() {
    const mechanicsDisplay = document.getElementById('mechanics-display');
    
    if (gameState.activeMechanics.length > 0) {
        
        // Mostrar el contenedor
        mechanicsDisplay.style.display = 'flex';
        
        // Limpiar contenido previo
        mechanicsDisplay.innerHTML = '';
        
        // Crear badges para cada mecánica
        gameState.activeMechanics.forEach(mechanic => {
            const badge = document.createElement('div');
            badge.className = `mechanic-badge ${mechanic}`;
            
            // Configurar texto y emoji según la mecánica
            switch (mechanic) {
                case 'fog':
                    badge.textContent = '🌫️ Niebla';
                    break;
                case 'ghost':
                    badge.textContent = '👻 Fantasma';
                    break;
                case 'hiddenWords':
                    badge.textContent = '👁️ Palabras Ocultas';
                    break;
                case 'wordTimer':
                    badge.textContent = '⏰ Timer por Palabra';
                    break;
                case 'dynamicTimer':
                    badge.textContent = '⏱️Timer Dinámico';
                    break;
                default:
                    badge.textContent = `🔄 ${mechanic}`;
            }
            
            mechanicsDisplay.appendChild(badge);
        });
    } else {
        // Ocultar el contenedor si no hay mecánicas
        mechanicsDisplay.style.display = 'none';
    }
}

// Aplicar mecánicas visuales al grid
function applyVisualMechanics() {
    
    // Aplicar niebla
    if (gameState.activeMechanics.includes('fog')) {
        applyFogVisual();
    }
    
    // Aplicar fantasma
    if (gameState.activeMechanics.includes('ghost')) {
        applyGhostVisual();
    }
}

// Aplicar niebla visualmente
function applyFogVisual() {
    document.querySelectorAll('.grid-cell').forEach((cell) => {
        const cellIndex = parseInt(cell.dataset.index);
        if (gameState.currentGrid[cellIndex] === '?') {
            cell.classList.add('fog');
            cell.textContent = '?';
        } else {
            // Asegurar que las celdas sin niebla no tengan la clase fog
            cell.classList.remove('fog');
            cell.textContent = gameState.currentGrid[cellIndex];
        }
    });
}

// Aplicar fantasma visualmente
function applyGhostVisual() {
    document.querySelectorAll('.grid-cell').forEach((cell) => {
        if (Math.random() < 0.25) {
            cell.classList.add('ghost');
        }
    });
}

// Mecánica de Niebla (Fog)
function applyFogMechanic() {
    
    // Guardar grid original antes de aplicar niebla
    gameState.originalGrid = [...gameState.currentGrid];
    
    // Aplicar niebla a algunas celdas (30% de probabilidad)
    // Las letras ocultas solo se revelan al completar palabras
    let foggedCells = 0;
    for (let i = 0; i < gameState.currentGrid.length; i++) {
        if (Math.random() < 0.3) {
            gameState.currentGrid[i] = '?';
            foggedCells++;
        }
    }
}

// Mecánica de Fantasma (Ghost)
function applyGhostMechanic() {
    
    // Aplicar clase ghost a algunas celdas (25% de probabilidad)
    setTimeout(() => {
        document.querySelectorAll('.grid-cell').forEach((cell, index) => {
            if (Math.random() < 0.25) {
                cell.classList.add('ghost');
            }
        });
    }, 100);
}

// Mecánica de Palabras Ocultas
function applyHiddenWordsMechanic() {
    
    // Limpiar palabras ocultas previas
    gameState.hiddenWords = [];
    
    // Ocultar algunas palabras aleatoriamente (30% de probabilidad por palabra)
    gameState.currentWords.forEach(word => {
        if (Math.random() < 0.3) {
            gameState.hiddenWords.push(word);
        }
    });
    
    // Asegurar que al menos haya una palabra oculta
    if (gameState.hiddenWords.length === 0 && gameState.currentWords.length > 0) {
        const randomWord = gameState.currentWords[Math.floor(Math.random() * gameState.currentWords.length)];
        gameState.hiddenWords.push(randomWord);
    }
    
}

// Mecánica de Timer por Palabra
function applyWordTimerMechanic() {
    
    // Ordenar palabras por longitud (más difí­cil = más larga)
    const sortedWords = [...gameState.currentWords].sort((a, b) => b.length - a.length);
    
    // Asignar tiempos diferenciados: palabra más difí­cil 40s, las demás -5s cada una
    sortedWords.forEach((word, index) => {
        const timeForWord = 40 - (index * 5); // 40s, 35s, 30s, 25s...
        gameState.wordTimers[word] = Math.max(timeForWord, 15); // Mínimo 15 segundos
    });
    
    // Iniciar timer
    gameState.wordTimerInterval = setInterval(() => {
        let allExpired = true;
        gameState.currentWords.forEach(word => {
            if (gameState.wordTimers[word] > 0) {
                gameState.wordTimers[word]--;
                allExpired = false;
            }
        });
        
        updateWordsList(); // Actualizar display de timers
        
        if (allExpired) {
            clearInterval(gameState.wordTimerInterval);
            gameState.wordTimerInterval = null;
            gameState.levelExpired = true;
            showMessage('Tiempo agotado! Nivel no completado. Usa "Limpiar Selección" para repetir.', 'error');
        }
    }, 1000);
}

// Mecánica de Timer Dinámico
function applyDynamicTimerMechanic() {
    
    // Inicializar timer dinámico (2 minutos)
    gameState.dynamicTimer = 120;
    
    gameState.dynamicTimerInterval = setInterval(() => {
        if (gameState.dynamicTimer > 0) {
            gameState.dynamicTimer--;
            updateHUD(); // Actualizar display del timer
        } else {
            clearInterval(gameState.dynamicTimerInterval);
            gameState.dynamicTimerInterval = null;
            gameState.levelExpired = true;
            showMessage('¡Tiempo agotado! Nivel no completado. Usa "Limpiar Selección" para repetir.', 'error');
        }
    }, 1000);
}

