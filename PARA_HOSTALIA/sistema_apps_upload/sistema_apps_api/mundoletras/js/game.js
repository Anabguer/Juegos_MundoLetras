// Configuración del juego
const CONFIG = {
    API_BASE_URL: 'https://colisan.com/sistema_apps_upload/sistema_apps_api/mundoletras/',
    GRID_SIZE: 6,
    MAX_ERRORS: 10
};

// Cache de niveles cargados desde JSON
let levelsCache = null;

// Cargar niveles desde JSON
async function loadLevelsFromJSON() {
    if (levelsCache) {
        return levelsCache;
    }
    
    try {
        const response = await fetch('sistema_apps_api/mundoletras/levels.json');
        if (!response.ok) {
            throw new Error(`Error al cargar niveles: ${response.status}`);
        }
        levelsCache = await response.json();
        return levelsCache;
    } catch (error) {
        console.error('❌ Error cargando niveles:', error);
        // Fallback: usar sistema anterior si falla la carga
        return null;
    }
}

// Obtener configuración de nivel desde JSON
async function getLevelConfig(levelId) {
    const levels = await loadLevelsFromJSON();
    if (!levels) {
        console.warn('⚠️ No se pudieron cargar niveles desde JSON, usando sistema anterior');
        return null;
    }
    
    const level = levels.find(l => l.id === levelId);
    if (!level) {
        console.error(`❌ Nivel ${levelId} no encontrado en JSON`);
        return null;
    }
    
    return level;
}

// Iniciar cronómetro del nivel
function startLevelTimer(timerSec) {
    // Limpiar timer anterior si existe
    if (gameState.levelTimerInterval) {
        clearInterval(gameState.levelTimerInterval);
        gameState.levelTimerInterval = null;
    }
    
    // Configurar timer del nivel
    gameState.levelTimerLimit = timerSec;
    gameState.levelTimer = 0;
    gameState.levelStartTime = Date.now();
    
    if (timerSec > 0) {
        // Cronómetro con límite (cuenta atrás)
        gameState.levelTimer = timerSec;
        gameState.levelTimerInterval = setInterval(() => {
            gameState.levelTimer--;
            updateHUD();
            
            if (gameState.levelTimer <= 0) {
                clearInterval(gameState.levelTimerInterval);
                gameState.levelTimerInterval = null;
                gameState.levelExpired = true;
                showMessage('¡Tiempo agotado! Debes repetir el nivel', 'error');
                // TODO: Implementar lógica para repetir nivel
            }
        }, 1000);
    } else {
        // Cronómetro informativo (cuenta hacia arriba)
        gameState.levelTimerInterval = setInterval(() => {
            gameState.levelTimer++;
            updateHUD();
        }, 1000);
    }
}

// Detener cronómetro del nivel
function stopLevelTimer() {
    if (gameState.levelTimerInterval) {
        clearInterval(gameState.levelTimerInterval);
        gameState.levelTimerInterval = null;
    }
}

// Obtener tiempo restante para bonus de monedas
function getTimeBonus() {
    if (gameState.levelTimerLimit > 0) {
        // Cronómetro con límite: tiempo restante
        return Math.max(0, gameState.levelTimer);
    } else {
        // Cronómetro informativo: no hay bonus por tiempo
        return 0;
    }
}

// Normalizar palabra para lógica (quitar tildes, preservar Ñ)
function normalizeWordForLogic(word) {
    return word
        .toUpperCase()
        .replace(/Á/g, 'A')
        .replace(/É/g, 'E')
        .replace(/Í/g, 'I')
        .replace(/Ó/g, 'O')
        .replace(/Ú/g, 'U')
        .replace(/Ü/g, 'U');
    // La Ñ se preserva tal como está
}

// Comparar palabras (case-insensitive, con normalización)
function compareWords(word1, word2) {
    const normalized1 = normalizeWordForLogic(word1);
    const normalized2 = normalizeWordForLogic(word2);
    return normalized1 === normalized2;
}

// Configurar palabras del nivel (dual: display y logic)
function setLevelWords(wordsDisplay, wordsLogic) {
    gameState.currentWordsDisplay = wordsDisplay || [];
    gameState.currentWordsLogic = wordsLogic || [];
    
    // Si solo hay wordsDisplay, generar wordsLogic automáticamente
    if (wordsDisplay && !wordsLogic) {
        gameState.currentWordsLogic = wordsDisplay.map(word => normalizeWordForLogic(word));
    }
    
    // Mantener compatibilidad con sistema anterior
    gameState.currentWords = gameState.currentWordsDisplay;
    
}

// Configurar direcciones permitidas
function setAllowedDirections(directions) {
    gameState.allowedDirections = directions || ['H', 'V'];
}

// Detectar dirección de una selección de celdas
function detectDirection(selectedCells) {
    if (selectedCells.length < 2) return null;
    
    const first = selectedCells[0];
    const last = selectedCells[selectedCells.length - 1];
    
    const deltaRow = last.row - first.row;
    const deltaCol = last.col - first.col;
    
    // Normalizar dirección
    const stepRow = deltaRow === 0 ? 0 : deltaRow / Math.abs(deltaRow);
    const stepCol = deltaCol === 0 ? 0 : deltaCol / Math.abs(deltaCol);
    
    // Detectar tipo de dirección
    if (stepRow === 0 && stepCol !== 0) {
        return stepCol > 0 ? 'H' : 'H'; // Horizontal (ambas direcciones son H)
    } else if (stepRow !== 0 && stepCol === 0) {
        return stepRow > 0 ? 'V' : 'V'; // Vertical (ambas direcciones son V)
    } else if (stepRow !== 0 && stepCol !== 0) {
        // Diagonal
        if (stepRow > 0 && stepCol > 0) return 'D';
        if (stepRow > 0 && stepCol < 0) return 'D';
        if (stepRow < 0 && stepCol > 0) return 'D';
        if (stepRow < 0 && stepCol < 0) return 'D';
    }
    
    return null;
}

// Validar si una dirección está permitida
function isDirectionAllowed(direction) {
    if (!direction) return false;
    
    // Si la dirección está explícitamente permitida
    if (gameState.allowedDirections.includes(direction)) {
        return true;
    }
    
    // Verificar si las reversas están permitidas
    if (gameState.allowedDirections.includes('R')) {
        // Las reversas permiten H y V en ambas direcciones
        return direction === 'H' || direction === 'V';
    }
    
    return false;
}

// Validar selección de celdas según direcciones permitidas
function validateCellSelection(selectedCells) {
    if (selectedCells.length < 2) return true; // Selección vacía o de una celda es válida
    
    const direction = detectDirection(selectedCells);
    const isAllowed = isDirectionAllowed(direction);
    
    
    return isAllowed;
}

// Configurar sistema de pistas
function setHintsConfig(hintsConfig) {
    gameState.hintsConfig = hintsConfig || { base: 0, adMaxExtra: 2 };
    gameState.hintsMax = gameState.hintsConfig.base + gameState.hintsConfig.adMaxExtra;
    gameState.hintsUsed = 0;
}

// Verificar si se puede usar una pista
function canUseHint() {
    return gameState.hintsUsed < gameState.hintsMax;
}

// Usar una pista (requiere anuncio)
function useHint() {
    if (!canUseHint()) {
        showMessage('No puedes usar más pistas en este nivel', 'error');
        return false;
    }
    
    // Mostrar modal de anuncio (placeholder)
    showAdModal(() => {
        // Callback cuando se completa el anuncio
        revealHintLetter();
        gameState.hintsUsed++;
        updateHintsDisplay();
        showMessage(`Pista usada (${gameState.hintsUsed}/${gameState.hintsMax})`, 'success');
    });
    
    return true;
}

// Revelar una letra útil de una palabra no resuelta
function revealHintLetter() {
    // console.log('🔍 Iniciando pista...');
    // console.log('📝 Palabras disponibles:', gameState.currentWordsDisplay);
    // console.log('✅ Palabras encontradas:', gameState.foundWords);
    
    // Encontrar palabras no resueltas
    const unresolvedWords = gameState.currentWordsDisplay.filter(word => 
        !gameState.foundWords.includes(word)
    );
    
    // console.log('❓ Palabras no resueltas:', unresolvedWords);
    
    if (unresolvedWords.length === 0) {
        showMessage('¡Todas las palabras están resueltas!', 'info');
        return;
    }
    
    // Seleccionar palabra aleatoria no resuelta
    const randomWord = unresolvedWords[Math.floor(Math.random() * unresolvedWords.length)];
    // console.log('🎯 Palabra seleccionada para pista:', randomWord);
    
    // Encontrar la palabra en el grid y revelar una letra útil
    const wordPositions = findWordInGrid(randomWord);
    // console.log('📍 Posiciones encontradas:', wordPositions);
    
    if (wordPositions && wordPositions.length > 0) {
        // Revelar primera o última letra (más útil)
        const revealIndex = Math.random() < 0.5 ? 0 : wordPositions.length - 1;
        const cellIndex = wordPositions[revealIndex];
        
        // console.log('🎯 Índice de celda a revelar:', cellIndex);
        
        // Revelar la celda
        const cell = document.querySelector(`[data-index="${cellIndex}"]`);
        // console.log('🔍 Celda encontrada:', cell);
        
        if (cell) {
            cell.classList.add('hint-revealed');
            cell.style.backgroundColor = '#fbbf24';
            cell.style.color = '#000';
            
            // Animación
            cell.style.transform = 'scale(1.2)';
            setTimeout(() => {
                cell.style.transform = 'scale(1)';
            }, 300);
            
            // console.log(`💡 Pista revelada: letra "${gameState.currentGrid[cellIndex]}" de "${randomWord}"`);
        } else {
            console.error('❌ No se encontró la celda con data-index:', cellIndex);
        }
    } else {
        console.error('❌ No se encontraron posiciones para la palabra:', randomWord);
    }
}

// Limpiar pistas de una palabra específica
function clearHintsForWord(word) {
    const wordPositions = findWordInGrid(word);
    if (wordPositions && wordPositions.length > 0) {
        wordPositions.forEach(cellIndex => {
            const cell = document.querySelector(`[data-index="${cellIndex}"]`);
            if (cell && cell.classList.contains('hint-revealed')) {
                cell.classList.remove('hint-revealed');
                cell.style.backgroundColor = '';
                cell.style.color = '';
            }
        });
    }
}

// Limpiar todas las pistas
function clearAllHints() {
    const hintCells = document.querySelectorAll('.hint-revealed');
    hintCells.forEach(cell => {
        cell.classList.remove('hint-revealed');
        cell.style.backgroundColor = '';
        cell.style.color = '';
    });
}

// Encontrar posiciones de una palabra en el grid
function findWordInGrid(word) {
    // console.log('🔍 Buscando palabra en grid:', word);
    const gridSize = Math.sqrt(gameState.currentGrid.length);
    const normalizedWord = normalizeWordForLogic(word);
    // console.log('📐 Tamaño del grid:', gridSize);
    // console.log('🔤 Palabra normalizada:', normalizedWord);
    
    // Usar la misma lógica que isWordInGrid() para consistencia
    const directions = [
        {dr: 0, dc: 1},   // Horizontal
        {dr: 1, dc: 0},   // Vertical
        {dr: 1, dc: 1},   // Diagonal derecha
        {dr: 1, dc: -1}   // Diagonal izquierda
    ];
    
    for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
            for (const dir of directions) {
                let currentWord = '';
                let valid = true;
                const positions = [];
                
                for (let i = 0; i < normalizedWord.length; i++) {
                    const checkRow = row + (dir.dr * i);
                    const checkCol = col + (dir.dc * i);
                    
                    if (checkRow >= 0 && checkRow < gridSize && checkCol >= 0 && checkCol < gridSize) {
                        const index = checkRow * gridSize + checkCol;
                        const cellLetter = normalizeWordForLogic(gameState.currentGrid[index]);
                        currentWord += cellLetter;
                        positions.push(index);
                    } else {
                        valid = false;
                        break;
                    }
                }
                
                if (valid && (currentWord === normalizedWord || currentWord === normalizedWord.split('').reverse().join(''))) {
                    // console.log(`✅ Palabra encontrada: "${word}" en posición (${row}, ${col}) dirección (${dir.dr}, ${dir.dc})`);
                    // console.log('📍 Posiciones:', positions);
                    return positions;
                }
            }
        }
    }
    
    // console.log('❌ Palabra no encontrada en el grid');
    return null;
}

// Verificar si una palabra está en una posición específica
function checkWordAtPosition(word, startRow, startCol, deltaRow, deltaCol, gridSize) {
    const normalizedWord = normalizeWordForLogic(word);
    const positions = [];
    
    // console.log(`🔍 Verificando "${word}" (normalizada: "${normalizedWord}") en posición (${startRow}, ${startCol}) con delta (${deltaRow}, ${deltaCol})`);
    
    for (let i = 0; i < normalizedWord.length; i++) {
        const row = startRow + (i * deltaRow);
        const col = startCol + (i * deltaCol);
        
        if (row < 0 || row >= gridSize || col < 0 || col >= gridSize) {
            // console.log(`❌ Posición fuera de límites: (${row}, ${col})`);
            return null;
        }
        
        const cellIndex = row * gridSize + col;
        const cellLetter = normalizeWordForLogic(gameState.currentGrid[cellIndex]);
        
        // console.log(`🔤 Letra ${i}: esperada "${normalizedWord[i]}", encontrada "${cellLetter}" en posición (${row}, ${col})`);
        
        if (cellLetter !== normalizedWord[i]) {
            // console.log(`❌ Letra no coincide: "${cellLetter}" !== "${normalizedWord[i]}"`);
            return null;
        }
        
        positions.push(cellIndex);
    }
    
    // console.log(`✅ Palabra completa encontrada en posiciones:`, positions);
    return positions;
}

// Mostrar modal de anuncio (placeholder)
function showAdModal(onReward) {
    // Crear modal de anuncio
    const modal = document.createElement('div');
    modal.className = 'ad-modal';
    modal.innerHTML = `
        <div class="ad-modal-content">
            <h3>📺 Anuncio</h3>
            <p>Mira este anuncio para obtener una pista</p>
            <div class="ad-timer">
                <div class="ad-progress"></div>
                <span class="ad-time">5</span>s
            </div>
            <button class="ad-skip" onclick="skipAd()">Saltar (5s)</button>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Simular anuncio de 5 segundos
    let timeLeft = 5;
    const timer = setInterval(() => {
        timeLeft--;
        const timeElement = modal.querySelector('.ad-time');
        const progressElement = modal.querySelector('.ad-progress');
        
        if (timeElement) timeElement.textContent = timeLeft;
        if (progressElement) progressElement.style.width = `${((5 - timeLeft) / 5) * 100}%`;
        
        if (timeLeft <= 0) {
            clearInterval(timer);
            document.body.removeChild(modal);
            onReward();
        }
    }, 1000);
    
    // Función para saltar (después de 5 segundos)
    window.skipAd = () => {
        if (timeLeft <= 0) {
            clearInterval(timer);
            document.body.removeChild(modal);
            onReward();
        }
    };
}

// Actualizar display de pistas
function updateHintsDisplay() {
    const hintsElement = document.getElementById('hints-display');
    if (hintsElement) {
        hintsElement.textContent = `${gameState.hintsUsed}/${gameState.hintsMax}`;
    }
    
    const hintButton = document.getElementById('hint-button');
    if (hintButton) {
        hintButton.disabled = !canUseHint();
        hintButton.textContent = canUseHint() ? '💡 Pista' : '💡 Sin pistas';
    }
}

// Estado del juego
let gameState = {
    currentUser: null,
    currentLevel: 1,
    score: 0,
    streak: 0,
    coins: 50,
    totalCoins: 50,  // Sincronizar con coins
    selectedCells: [],
    foundWords: [],
    currentGrid: [],
    currentWords: ['MAR', 'ALGA', 'CORAL', 'PECES'],
    activeMechanics: [],
    originalGrid: [],
    revealedCells: [],
    hiddenWords: [],
    soundEnabled: true,
    wordTimers: {},
    dynamicTimer: null,
    dynamicTimerInterval: null,
    wordTimerInterval: null,
    levelExpired: false,
    failedAttempts: 0,
    // Nuevo sistema de cronómetro
    levelTimer: 0,           // Tiempo transcurrido en el nivel (siempre cuenta hacia arriba)
    levelTimerLimit: 0,      // Límite de tiempo del nivel (0 = sin límite)
    levelTimerInterval: null, // Intervalo del cronómetro del nivel
    levelStartTime: null,    // Momento de inicio del nivel
    // Sistema de palabras dual
    currentWordsDisplay: [], // Palabras para mostrar en UI (con tildes y Ñ)
    currentWordsLogic: [],   // Palabras para lógica (normalizadas, sin tildes, preservan Ñ)
    // Direcciones permitidas
    allowedDirections: ['H', 'V'], // Direcciones permitidas según JSON (H, V, R, D)
    // Sistema de pistas
    hintsUsed: 0,           // Pistas usadas en el nivel actual
    hintsMax: 2,            // Máximo de pistas por nivel
    hintsConfig: {          // Configuración de pistas del JSON
        base: 0,            // Pistas gratis (siempre 0)
        adMaxExtra: 2       // Máximo pistas con anuncio
    },
    // Sistema de monedas
    coinsConfig: {          // Configuración de monedas del JSON
        base: 10,           // Monedas base por completar nivel
        timeBonus: 5,       // Bonus por tiempo restante
        starMultiplier: 1.5, // Multiplicador por estrella
        firstTimeBonus: 20  // Bonus por primera vez
    },
    totalCoins: 0,          // Total de monedas del usuario
    levelCoinsEarned: 0,    // Monedas ganadas en el nivel actual
    // Sistema de temas
    currentTheme: 'bosque'  // Tema actual del nivel
};

// Funciones de navegación básicas
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => {
        s.classList.remove('active');
    });
    
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.add('active');
    } else {
    }
}

function startAsGuest() {
    gameState.currentUser = {
        isGuest: true,
        name: 'Invitado',
        key: 'guest_' + Date.now()
    };
    
    showMessage('Bienvenido! Iniciando juego...', 'success');
    setTimeout(async () => {
        try {
            await initGame();
            showScreen('game-screen');
        } catch (error) {
            showMessage('Error iniciando el juego. Intenta de nuevo.', 'error');
        }
    }, 1500);
}

function backToMainMenu() {
    const loginContent = document.getElementById('login-content');
    loginContent.innerHTML = `
        <button class="btn btn-primary" onclick="startAsGuest()">
            👤 Jugar como Invitado
        </button>
        <button class="btn btn-secondary" onclick="showLogin()">
            🔐 Identificarse
        </button>
        <button class="btn btn-danger" onclick="exitApp()">
            🚪 Salir
        </button>
        <button class="btn btn-secondary" onclick="showScreen('test-screen'); testLevel();" style="background: #fbbf24; color: #000; font-weight: bold; display: none;">
            🧪 PANTALLA DE TEST
        </button>
    `;
}

function backToMenu() {
    if (gameState.currentUser && !gameState.currentUser.isGuest) {
        // Si está logueado, hacer logout
        logout();
    } else {
        // Si es invitado, volver al menú
        restoreLoginContent();
        showScreen('login-screen');
    }
}

function logout() {
    gameState.currentUser = null;
    gameState.currentLevel = 1;
    gameState.score = 0;
    gameState.streak = 0;
    gameState.coins = 50;
    gameState.totalCoins = 50;  // Sincronizar con coins
    gameState.selectedCells = [];
    gameState.foundWords = [];
    
    showMessage('Sesión cerrada. Volviendo al menú...', 'success');
    setTimeout(() => {
        // Restaurar el contenido original del login
        restoreLoginContent();
        showScreen('login-screen');
    }, 1500);
}

// Función para restaurar el contenido original del login
function restoreLoginContent() {
    const loginContent = document.getElementById('login-content');
    if (loginContent) {
        loginContent.innerHTML = `
            <button class="btn btn-primary" onclick="startAsGuest()">
                 👤 Jugar como Invitado
            </button>
            
            <button class="btn btn-secondary" onclick="showLogin()">
                🔐 Identificarse
            </button>
            
            <button class="btn btn-danger" onclick="exitApp()">
                🚪 Salir
            </button>
            
            <button class="btn btn-secondary" onclick="showScreen('test-screen'); testLevel();" style="background: #fbbf24; color: #000; font-weight: bold; display: none;">
                🧪 PANTALLA DE TEST
            </button>
        `;
    }
}

// Funciones de mensajes
function showMessage(text, type = 'success') {
    const container = document.getElementById('message-container');
    if (container) {
        container.innerHTML = `<div class="message ${type}">${text}</div>`;
        setTimeout(() => {
            container.innerHTML = '';
        }, 3000);
    }
}

// Funciones de sonido básicas
function toggleSound() {
    gameState.soundEnabled = !gameState.soundEnabled;
    const soundControl = document.getElementById('sound-control');
    if (soundControl) {
        if (gameState.soundEnabled) {
            soundControl.textContent = '🔊';
            soundControl.classList.remove('muted');
            playSound('toggle');
        } else {
            soundControl.textContent = '🔇';
            soundControl.classList.add('muted');
        }
    }
}

function playSound(type) {
    if (!gameState.soundEnabled) return;
    
    try {
        if (!window.audioContext) {
            window.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        const ctx = window.audioContext;
        
        if (ctx.state === 'suspended') {
            ctx.resume().catch(() => {});
        }
        
        switch(type) {
            case 'word':
                const wordOscillator = ctx.createOscillator();
                const wordGain = ctx.createGain();
                wordOscillator.connect(wordGain);
                wordGain.connect(ctx.destination);
                wordOscillator.frequency.setValueAtTime(800, ctx.currentTime);
                wordOscillator.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
                wordGain.gain.setValueAtTime(0.1, ctx.currentTime);
                wordGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
                wordOscillator.start(ctx.currentTime);
                wordOscillator.stop(ctx.currentTime + 0.3);
                break;
                
            case 'level':
                const levelOscillator = ctx.createOscillator();
                const levelGain = ctx.createGain();
                levelOscillator.connect(levelGain);
                levelGain.connect(ctx.destination);
                levelOscillator.frequency.setValueAtTime(523, ctx.currentTime);
                levelOscillator.frequency.setValueAtTime(659, ctx.currentTime + 0.2);
                levelOscillator.frequency.setValueAtTime(784, ctx.currentTime + 0.4);
                levelGain.gain.setValueAtTime(0.15, ctx.currentTime);
                levelGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
                levelOscillator.start(ctx.currentTime);
                levelOscillator.stop(ctx.currentTime + 0.6);
                break;
                
            case 'coin':
                const coinOscillator = ctx.createOscillator();
                const coinGain = ctx.createGain();
                coinOscillator.connect(coinGain);
                coinGain.connect(ctx.destination);
                coinOscillator.frequency.setValueAtTime(1000, ctx.currentTime);
                coinOscillator.frequency.exponentialRampToValueAtTime(2000, ctx.currentTime + 0.1);
                coinGain.gain.setValueAtTime(0.1, ctx.currentTime);
                coinGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
                coinOscillator.start(ctx.currentTime);
                coinOscillator.stop(ctx.currentTime + 0.2);
                break;
                
            case 'toggle':
                const toggleOscillator = ctx.createOscillator();
                const toggleGain = ctx.createGain();
                toggleOscillator.connect(toggleGain);
                toggleGain.connect(ctx.destination);
                toggleOscillator.frequency.setValueAtTime(400, ctx.currentTime);
                toggleGain.gain.setValueAtTime(0.05, ctx.currentTime);
                toggleGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
                toggleOscillator.start(ctx.currentTime);
                toggleOscillator.stop(ctx.currentTime + 0.1);
                break;
        }
    } catch (error) {
    }
}

// Configurar sistema de monedas
function setCoinsConfig(coinsConfig) {
    gameState.coinsConfig = coinsConfig || {
        base: 10,
        timeBonus: 5,
        starMultiplier: 1.5,
        firstTimeBonus: 20
    };
    // console.log('💰 Configuración de monedas:', gameState.coinsConfig);
}

// Calcular monedas ganadas en el nivel
function calculateLevelCoins(stars, timeRemaining, isFirstTime) {
    // Asegurar que coinsConfig esté inicializado
    if (!gameState.coinsConfig) {
        gameState.coinsConfig = {
            base: 10,
            timeBonus: 5,
            starMultiplier: 1.5,
            firstTimeBonus: 20
        };
    }
    
    let coins = gameState.coinsConfig.base || 10;
    
    // Bonus por tiempo restante (solo si hay límite de tiempo)
    if (gameState.levelTimerLimit > 0 && timeRemaining > 0) {
        const timeBonus = Math.floor(timeRemaining / 10) * (gameState.coinsConfig.timeBonus || 5);
        coins += timeBonus;
        // console.log(`⏰ Bonus por tiempo restante: ${timeBonus} monedas`);
    }
    
    // Multiplicador por estrellas
    if (stars > 0) {
        coins = Math.floor(coins * ((gameState.coinsConfig.starMultiplier || 1.5) * stars));
        // console.log(`⭐ Multiplicador por ${stars} estrellas: ${coins} monedas`);
    }
    
    // Bonus por primera vez
    if (isFirstTime) {
        coins += (gameState.coinsConfig.firstTimeBonus || 20);
        // console.log(`🎉 Bonus primera vez: ${gameState.coinsConfig.firstTimeBonus || 20} monedas`);
    }
    
    // Asegurar que coins sea un número válido
    if (isNaN(coins) || coins < 0) {
        coins = 10; // Valor por defecto
        console.warn('⚠️ Monedas calculadas inválidas, usando valor por defecto:', coins);
    }
    
    gameState.levelCoinsEarned = coins;
    gameState.totalCoins = (gameState.totalCoins || 50) + coins;
    
    // console.log(`💰 Monedas ganadas: ${coins} (Total: ${gameState.totalCoins})`);
    return coins;
}

// Añadir monedas al total
function addCoins(amount) {
    gameState.totalCoins = (gameState.totalCoins || 50) + amount;
    updateCoinsDisplay();
    // console.log(`💰 Monedas añadidas: ${amount} (Total: ${gameState.totalCoins})`);
}

// Gastar monedas
function spendCoins(amount) {
    gameState.totalCoins = gameState.totalCoins || 50;
    if (gameState.totalCoins >= amount) {
        gameState.totalCoins -= amount;
        updateCoinsDisplay();
        // console.log(`💰 Monedas gastadas: ${amount} (Total: ${gameState.totalCoins})`);
        return true;
    } else {
        // console.log(`💰 Monedas insuficientes: ${gameState.totalCoins}/${amount}`);
        return false;
    }
}

// Verificar si tiene suficientes monedas
function hasEnoughCoins(amount) {
    gameState.totalCoins = gameState.totalCoins || 50;
    return gameState.totalCoins >= amount;
}

// Actualizar display de monedas
function updateCoinsDisplay() {
    const coinsElement = document.getElementById('coins-display');
    if (coinsElement) {
        coinsElement.textContent = gameState.totalCoins || 50;
    }
    
    // Actualizar en el HUD del juego
    const gameCoinsElement = document.getElementById('coins');
    if (gameCoinsElement) {
        gameCoinsElement.textContent = gameState.totalCoins || 50;
    }
}

// Mostrar resumen de monedas ganadas
function showCoinsSummary(coins, stars, timeRemaining, isFirstTime) {
    const summary = document.createElement('div');
    summary.className = 'coins-summary';
    summary.innerHTML = `
        <div class="coins-summary-content">
            <h3>💰 Monedas Ganadas</h3>
            <div class="coins-breakdown">
                <div class="coins-item">
                    <span>Base:</span>
                    <span>${gameState.coinsConfig.base}</span>
                </div>
                ${gameState.levelTimerLimit > 0 && timeRemaining > 0 ? `
                <div class="coins-item">
                    <span>Tiempo restante:</span>
                    <span>+${Math.floor(timeRemaining / 10) * gameState.coinsConfig.timeBonus}</span>
                </div>
                ` : ''}
                ${stars > 0 ? `
                <div class="coins-item">
                    <span>${stars} estrella${stars > 1 ? 's' : ''}:</span>
                    <span>x${gameState.coinsConfig.starMultiplier * stars}</span>
                </div>
                ` : ''}
                ${isFirstTime ? `
                <div class="coins-item">
                    <span>Primera vez:</span>
                    <span>+${gameState.coinsConfig.firstTimeBonus}</span>
                </div>
                ` : ''}
                <div class="coins-total">
                    <span>Total:</span>
                    <span>${coins}</span>
                </div>
            </div>
            <button onclick="closeCoinsSummary()" class="coins-close">Cerrar</button>
        </div>
    `;
    
    document.body.appendChild(summary);
    
    // Auto-cerrar después de 3 segundos
    setTimeout(() => {
        if (document.body.contains(summary)) {
            document.body.removeChild(summary);
        }
    }, 3000);
}

// Cerrar resumen de monedas
function closeCoinsSummary() {
    const summary = document.querySelector('.coins-summary');
    if (summary) {
        document.body.removeChild(summary);
    }
}

// Configuración de temas
const THEME_CONFIG = {
    cycleLength: 20,  // Niveles por tema
    themes: [
        { 
            name: 'bosque', 
            background: 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)',
            description: 'Bosque Azul'
        },
        { 
            name: 'oceano', 
            background: 'linear-gradient(135deg, #0c4a6e 0%, #0369a1 100%)',
            description: 'Océano Profundo'
        },
        { 
            name: 'montaña', 
            background: 'linear-gradient(135deg, #7c2d12 0%, #ea580c 100%)',
            description: 'Montaña Naranja'
        },
        { 
            name: 'desierto', 
            background: 'linear-gradient(135deg, #a16207 0%, #eab308 100%)',
            description: 'Desierto Dorado'
        },
        { 
            name: 'ciudad', 
            background: 'linear-gradient(135deg, #374151 0%, #6b7280 100%)',
            description: 'Ciudad Gris'
        },
        { 
            name: 'jardin', 
            background: 'linear-gradient(135deg, #065f46 0%, #047857 100%)',
            description: 'Jardín Verde'
        },
        { 
            name: 'atardecer', 
            background: 'linear-gradient(135deg, #7c2d12 0%, #dc2626 100%)',
            description: 'Atardecer Rojo'
        },
        { 
            name: 'noche', 
            background: 'linear-gradient(135deg, #1f2937 0%, #374151 100%)',
            description: 'Noche Oscura'
        }
    ]
};

// Obtener tema para un nivel específico
function getThemeForLevel(levelId) {
    const themeIndex = Math.floor((levelId - 1) / THEME_CONFIG.cycleLength);
    const theme = THEME_CONFIG.themes[themeIndex % THEME_CONFIG.themes.length];
    return theme;
}

// Aplicar tema al nivel actual
function applyTheme(levelId) {
    const theme = getThemeForLevel(levelId);
    gameState.currentTheme = theme.name;
    
    // Aplicar fondo al body
    document.body.style.background = theme.background;
    
    // Actualizar display del tema si existe
    updateThemeDisplay(theme);
    
    // console.log(`🎨 Tema aplicado: ${theme.description} para nivel ${levelId}`);
}

// Actualizar display del tema
function updateThemeDisplay(theme) {
    const themeElement = document.getElementById('theme-display');
    if (themeElement) {
        themeElement.textContent = theme.description;
    }
    
    // Actualizar en el HUD del juego si existe
    // Nota: No hay elemento game-theme en el HTML actual
}

// Obtener información del tema actual
function getCurrentThemeInfo() {
    return {
        name: gameState.currentTheme,
        theme: getThemeForLevel(gameState.currentLevel),
        cycle: Math.floor((gameState.currentLevel - 1) / THEME_CONFIG.cycleLength) + 1,
        position: ((gameState.currentLevel - 1) % THEME_CONFIG.cycleLength) + 1
    };
}

// Variable para mantener el nivel actual en test
let currentTestLevel = 1;

// Funciones para la pantalla de test
async function testLevel() {
    const levelInput = document.getElementById('test-level-input');
    const levelId = parseInt(levelInput.value);
    
    if (levelId < 1 || levelId > 1000) {
        showMessage('El nivel debe estar entre 1 y 1000', 'error');
        return;
    }
    
    // Actualizar nivel actual
    currentTestLevel = levelId;
    
    try {
        // Cargar configuración del nivel
        const levelConfig = await getLevelConfig(levelId);
        
        // Obtener información del tema
        const themeInfo = getThemeForLevel(levelId);
        const currentThemeInfo = {
            level: levelId,
            theme: themeInfo,
            cycle: Math.floor((levelId - 1) / THEME_CONFIG.cycleLength) + 1,
            position: ((levelId - 1) % THEME_CONFIG.cycleLength) + 1
        };
        
        // Aplicar tema al fondo
        applyTheme(levelId);
        
        // Actualizar información del nivel
        updateTestLevelInfo(currentThemeInfo);
        
        // Actualizar palabras
        updateTestWords(levelConfig);
        
        // Actualizar configuración
        updateTestConfig(levelConfig);
        
        // console.log(`🧪 Test del nivel ${levelId} completado`);
        
    } catch (error) {
        console.error('Error al cargar nivel de test:', error);
        showMessage('Error al cargar el nivel', 'error');
    }
}

function updateTestLevelInfo(themeInfo) {
    const levelElement = document.getElementById('test-level-display');
    if (levelElement) levelElement.textContent = themeInfo.level;
    
    const themeElement = document.getElementById('test-theme-display');
    if (themeElement) themeElement.textContent = themeInfo.theme.description;
    
    const cycleElement = document.getElementById('test-cycle-display');
    if (cycleElement) cycleElement.textContent = themeInfo.cycle;
    
    const positionElement = document.getElementById('test-position-display');
    if (positionElement) positionElement.textContent = `${themeInfo.position}/20`;
}

function updateTestWords(levelConfig) {
    const wordsDisplay = document.getElementById('test-words-display');
    
    if (!wordsDisplay) return;
    
    if (!levelConfig || !levelConfig.wordsDisplay) {
        wordsDisplay.innerHTML = '<p style="color: #ef4444;">No se encontraron palabras para este nivel</p>';
        return;
    }
    
    const words = levelConfig.wordsDisplay;
    const wordsHtml = words.map((word, index) => `
        <div class="word-item">
            <span>${index + 1}.</span>
            <span>${word}</span>
        </div>
    `).join('');
    
    wordsDisplay.innerHTML = wordsHtml || '<p>No hay palabras configuradas</p>';
}

function updateTestConfig(levelConfig) {
    const configDisplay = document.getElementById('test-config-display');
    
    if (!configDisplay) return;
    
    if (!levelConfig) {
        configDisplay.innerHTML = '<p style="color: #ef4444;">No se encontró configuración para este nivel</p>';
        return;
    }
    
    const configItems = [
        { label: 'Tema', value: levelConfig.theme || 'No especificado' },
        { label: 'Direcciones', value: levelConfig.directions ? levelConfig.directions.join(', ') : 'H, V' },
        { label: 'Timer (seg)', value: levelConfig.timerSec || 'Sin límite' },
        { label: 'Errores máx', value: levelConfig.erroresMax || 'Sin límite' },
        { label: 'Vidas', value: levelConfig.vidas || 'Sin límite' },
        { label: 'Pistas base', value: levelConfig.hints?.base || 0 },
        { label: 'Pistas extra', value: levelConfig.hints?.adMaxExtra || 2 },
        { label: 'Monedas base', value: levelConfig.coins?.base || 10 },
        { label: 'Bonus tiempo', value: levelConfig.coins?.timeBonus || 5 },
        { label: 'Multiplicador estrella', value: levelConfig.coins?.starMultiplier || 1.5 },
        { label: 'Bonus primera vez', value: levelConfig.coins?.firstTimeBonus || 20 }
    ];
    
    const configHtml = configItems.map(item => `
        <div class="config-item">
            <span>${item.label}:</span>
            <span>${item.value}</span>
        </div>
    `).join('');
    
    configDisplay.innerHTML = configHtml;
}

function testRandomLevel() {
    const randomLevel = Math.floor(Math.random() * 1000) + 1;
    const levelInput = document.getElementById('test-level-input');
    if (levelInput) {
        levelInput.value = randomLevel;
        testLevel();
    }
}

function testNextLevel() {
    const levelInput = document.getElementById('test-level-input');
    if (!levelInput) return;
    
    const currentLevel = parseInt(levelInput.value);
    const nextLevel = Math.min(currentLevel + 1, 1000);
    levelInput.value = nextLevel;
    testLevel();
}

function testPreviousLevel() {
    const levelInput = document.getElementById('test-level-input');
    if (!levelInput) return;
    
    const currentLevel = parseInt(levelInput.value);
    const prevLevel = Math.max(currentLevel - 1, 1);
    levelInput.value = prevLevel;
    testLevel();
}

// Función para mostrar mensajes en la pantalla de test
function showTestMessage(message, type = 'info') {
    const messageContainer = document.getElementById('message-container');
    if (messageContainer) {
        messageContainer.innerHTML = `<div class="message message-${type}">${message}</div>`;
        setTimeout(() => {
            messageContainer.innerHTML = '';
        }, 3000);
    }
}


