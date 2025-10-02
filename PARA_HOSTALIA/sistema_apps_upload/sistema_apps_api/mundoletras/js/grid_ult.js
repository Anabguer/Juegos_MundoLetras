// Inicializar juego
async function initGame() {
    // Inicializar eventos de arrastre
    initDragEvents();
    
    // Cargar progreso según tipo de usuario
    if (gameState.currentUser && gameState.currentUser.isGuest) {
        // Invitado: cargar de localStorage
        loadGuestProgress();
    } else if (gameState.currentUser && !gameState.currentUser.isGuest) {
        // Usuario registrado: cargar de BBDD
        await loadUserProgress();
    }
    
    // Cargar configuración del nivel desde JSON
    const levelConfig = await getLevelConfig(gameState.currentLevel);
    
    if (levelConfig) {
        // Usar configuración del JSON
        setLevelWords(levelConfig.wordsDisplay, levelConfig.words);
        setAllowedDirections(levelConfig.directions);
        setHintsConfig(levelConfig.hints);
        setCoinsConfig(levelConfig.coins);
        gameState.currentLevelConfig = levelConfig;
        // console.log(`✅ Nivel ${gameState.currentLevel} cargado desde JSON:`, levelConfig);
    } else {
        // Fallback: usar sistema anterior
        const fallbackWords = getLevelWords(gameState.currentLevel);
        setLevelWords(fallbackWords, null); // Generar wordsLogic automáticamente
        setAllowedDirections(['H', 'V']); // Direcciones básicas por defecto
        setHintsConfig({ base: 0, adMaxExtra: 2 }); // Pistas por defecto
        setCoinsConfig({ base: 10, timeBonus: 5, starMultiplier: 1.5, firstTimeBonus: 20 }); // Monedas por defecto
        gameState.currentLevelConfig = null;
        // console.log(`⚠️ Usando sistema anterior para nivel ${gameState.currentLevel}`);
    }
    
    // Ocultar botón de reiniciar progreso (no disponible para invitados)
    const clearProgressBtn = document.getElementById('clear-progress-btn');
    if (clearProgressBtn) {
        clearProgressBtn.style.display = 'none';
    }
    
    // Actualizar información del usuario
    updateUserInfo();
    
    generateGrid();
    updateHUD();
    
    // Aplicar tema del nivel
    applyTheme(gameState.currentLevel);
    
    // Iniciar cronómetro del nivel
    if (levelConfig && levelConfig.timerSec !== undefined) {
        startLevelTimer(levelConfig.timerSec);
    } else {
        // Fallback: sin límite de tiempo
        startLevelTimer(0);
    }
    
    // Aplicar mecánicas según configuración del nivel
    if (levelConfig && levelConfig.mechanics && levelConfig.mechanics.special) {
        // Usar mecánicas del JSON
        const mechanics = levelConfig.mechanics.special === 'none' ? [] : [levelConfig.mechanics.special];
        applyMechanics(mechanics);
        // console.log(`🎮 Aplicando mecánicas del JSON: ${mechanics.join(', ') || 'ninguna'}`);
    } else {
        // Fallback: generar mecánicas aleatorias
        const randomMechanics = generateRandomMechanics(gameState.currentLevel);
        applyMechanics(randomMechanics);
        // console.log(`🎲 Aplicando mecánicas aleatorias: ${randomMechanics.join(', ') || 'ninguna'}`);
    }
    
    // Actualizar lista de palabras DESPUÉS de aplicar mecánicas
    updateWordsList();
    
    // Aplicar mecánicas visuales después de inicializar el juego
    setTimeout(() => {
        applyVisualMechanics();
    }, 200);
    
    // Iniciar música de fondo si el sonido está habilitado
    if (gameState.soundEnabled) {
        startBackgroundMusic();
    }
}

// Generar siguiente nivel
async function generateNextLevel() {
    
    // LIMPIAR mecánicas del nivel anterior
    gameState.activeMechanics = [];
    gameState.originalGrid = [];
    gameState.revealedCells = [];
    gameState.hiddenWords = [];
    gameState.wordTimers = {};
    gameState.dynamicTimer = null; // Limpiar timer dinámico
    gameState.levelExpired = false;
    gameState.failedAttempts = 0;
    gameState.selectedCells = [];
    gameState.foundWords = []; // Limpiar palabras encontradas
    
    // Limpiar timers del nivel anterior
    if (gameState.dynamicTimerInterval) {
        clearInterval(gameState.dynamicTimerInterval);
        gameState.dynamicTimerInterval = null;
    }
    if (gameState.wordTimerInterval) {
        clearInterval(gameState.wordTimerInterval);
        gameState.wordTimerInterval = null;
    }
    if (gameState.levelTimerInterval) {
        clearInterval(gameState.levelTimerInterval);
        gameState.levelTimerInterval = null;
    }
    
    // Cargar configuración del nivel desde JSON
    const levelConfig = await getLevelConfig(gameState.currentLevel);
    
    if (levelConfig) {
        // Usar configuración del JSON
        setLevelWords(levelConfig.wordsDisplay, levelConfig.words);
        setAllowedDirections(levelConfig.directions);
        setHintsConfig(levelConfig.hints);
        setCoinsConfig(levelConfig.coins);
        gameState.currentLevelConfig = levelConfig;
        // console.log(`✅ Nivel ${gameState.currentLevel} cargado desde JSON:`, levelConfig);
    } else {
        // Fallback: usar sistema anterior
        const fallbackWords = getLevelWords(gameState.currentLevel);
        setLevelWords(fallbackWords, null); // Generar wordsLogic automáticamente
        setAllowedDirections(['H', 'V']); // Direcciones básicas por defecto
        setHintsConfig({ base: 0, adMaxExtra: 2 }); // Pistas por defecto
        setCoinsConfig({ base: 10, timeBonus: 5, starMultiplier: 1.5, firstTimeBonus: 20 }); // Monedas por defecto
        gameState.currentLevelConfig = null;
        // console.log(`⚠️ Usando sistema anterior para nivel ${gameState.currentLevel}`);
    }
    
    generateGrid();
    updateHUD();
    
    // Aplicar tema del nivel
    applyTheme(gameState.currentLevel);
    
    // Iniciar cronómetro del nivel
    if (levelConfig && levelConfig.timerSec !== undefined) {
        startLevelTimer(levelConfig.timerSec);
    } else {
        // Fallback: sin límite de tiempo
        startLevelTimer(0);
    }
    
    // Aplicar mecánicas según configuración del nivel
    if (levelConfig && levelConfig.mechanics && levelConfig.mechanics.special) {
        // Usar mecánicas del JSON
        const mechanics = levelConfig.mechanics.special === 'none' ? [] : [levelConfig.mechanics.special];
        applyMechanics(mechanics);
        // console.log(`🎮 Aplicando mecánicas del JSON: ${mechanics.join(', ') || 'ninguna'}`);
    } else {
        // Fallback: generar mecánicas aleatorias
        const randomMechanics = generateRandomMechanics(gameState.currentLevel);
        applyMechanics(randomMechanics);
        // console.log(`🎲 Aplicando mecánicas aleatorias: ${randomMechanics.join(', ') || 'ninguna'}`);
    }
    
    // Actualizar lista de palabras DESPUÉS de aplicar mecánicas
    updateWordsList();
    
    // Aplicar mecánicas visuales después de generar el nuevo nivel
    setTimeout(() => {
        applyVisualMechanics();
    }, 200);
}

// Obtener palabras según el nivel
function getLevelWords(level) {
    // Inicializar cache de palabras usadas si no existe
    if (!gameState.usedWords) {
        gameState.usedWords = {
            short: new Set(),
            ocean: new Set(), 
            forest: new Set(),
            advanced: new Set()
        };
    }
    // Bancos de palabras por categorí­a - Ampliados para más variedad
    const wordBanks = {
        // Niveles 1-3: Palabras cortas (3-4 letras)
        short: [
            'MAR', 'SOL', 'LUNA', 'CASA', 'AGUA', 'FUEGO', 'AIRE', 'TIERRA', 
            'GATO', 'PERRO', 'PATO', 'OSO', 'FLOR', 'MESA', 'SILLA', 'VENTANA',
            'PESO', 'MANO', 'CARA', 'BOCA', 'PIES', 'OJOS', 'CABO', 'MAPA',
            'SAL', 'PAN', 'CAFE', 'TE', 'LA', 'EL', 'UN', 'DOS', 'TRES', 'CUATRO'
        ],
        
        // Niveles 4-6: Océano (4-6 letras)
        ocean: [
            'MAR', 'ALGA', 'CORAL', 'PECES', 'DELFIN', 'BALLENA', 'ANCLA', 'FARO', 
            'OCEANO', 'BRISA', 'PERLA', 'BAHIA', 'PULPO', 'ANEMONA', 'SARDINA',
            'ATUN', 'SALMON', 'LANGOSTA', 'CANGREJO', 'MEDUSA', 'TIBURON', 'ORCA',
            'FOCA', 'PINGUINO', 'GAVIOTA', 'PELICANO', 'CORRIENTE', 'MAREA', 'PLAYA'
        ],
        
        // Niveles 7-9: Bosque (4-6 letras)
        forest: [
            'ARBOL', 'HOJA', 'RAMA', 'PIÑA', 'BOSQUE', 'MUSGO', 'SETAS', 'ROBLE', 
            'CIERVO', 'ZORRO', 'NIDO', 'TREBOL', 'LIANA', 'SELVA', 'CORTEZA',
            'PINO', 'ABETO', 'CEDRO', 'OLMO', 'SAUCE', 'ALAMO', 'CHOPO', 'CASTAÑO',
            'BELLOTA', 'FRUTA', 'BOSQUE', 'MADERA', 'HOJARASCA', 'SOMBRA', 'TRONCO'
        ],
        
        // Niveles 10+: Mixto más difí­cil (7-10 letras)
        advanced: [
            'MONTAÑA', 'CASCADA', 'SENDERO', 'CUMBRE', 'ESTRELLA', 'GALAXIA', 
            'PLANETA', 'COMETA', 'AVENTURA', 'MISTERIO', 'TESORO', 'LEYENDA', 
            'TELESCOPIO', 'NEBULOSA', 'ARROYO', 'PULSAR', 'ASTEROIDE', 'METEORITO',
            'CONSTELACION', 'EXPLORACION', 'EXPEDICION', 'DESCUBRIMIENTO', 'INVESTIGACION',
            'LABORATORIO', 'OBSERVATORIO', 'EXPERIMENTO', 'CIENTIFICO', 'AVENTURERO'
        ]
    };
    
    // Seleccionar categoría según el nivel
    let category;
    if (level <= 3) {
        category = 'short';
    } else if (level <= 6) {
        category = 'ocean';
    } else if (level <= 9) {
        category = 'forest';
    } else {
        category = 'advanced';
    }
    
    // Seleccionar número aleatorio de palabras (4-6) de la categorí­a
    const bank = wordBanks[category];
    
    // Mezclar el banco de palabras para mayor aleatoriedad
    const shuffledBank = [...bank].sort(() => Math.random() - 0.5);
    
    // Filtrar palabras que no excedan 10 letras y no hayan sido usadas recientemente
    const validWords = shuffledBank.filter(word => 
        word.length <= 10 && !gameState.usedWords[category].has(word)
    );
    
    // Si no hay suficientes palabras nuevas, limpiar cache parcialmente
    if (validWords.length < 4) {
        gameState.usedWords[category].clear();
        const allValidWords = shuffledBank.filter(word => word.length <= 10);
        if (allValidWords.length > 0) {
            allValidWords.slice(0, 6).forEach(word => gameState.usedWords[category].add(word));
            return allValidWords.slice(0, Math.min(6, allValidWords.length));
        }
    }
    
    if (validWords.length === 0) {
        return ['MAR', 'SOL', 'LUNA', 'CASA']; // Fallback
    }
    
    const numWords = Math.floor(Math.random() * 3) + 4; // 4, 5 o 6 palabras
    const selectedWords = [];
    
    // Seleccionar palabras únicas del banco mezclado
    for (let i = 0; i < Math.min(numWords, validWords.length); i++) {
        selectedWords.push(validWords[i]);
        gameState.usedWords[category].add(validWords[i]); // Marcar como usada
    }
    
    return selectedWords;
}

// Generar grid de juego
function generateGrid() {
    const gridContainer = document.getElementById('game-grid');
    gridContainer.innerHTML = '';
    gameState.currentGrid = [];
    
    // Limpiar overlay SVG anterior
    if (overlaySVG) {
        overlaySVG.remove();
        overlaySVG = null;
    }
    currentPill = null;
    colorIndex = 0;
    
    // Limpiar cualquier píldora residual
    clearAllTemporaryPills();
    
    const words = gameState.currentWords;
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    
    // Calcular el tamaño del grid basado en la palabra más larga y número de palabras
    const maxWordLength = Math.max(...words.map(word => word.length));
    const numWords = words.length;
    
    // Grid dinámico: mí­nimo 8x8, máximo 10x10
    // Considerar palabra más larga + margen mí­nimo
    let dynamicGridSize = Math.max(maxWordLength + 1, 8); // Palabra + 1 de margen, mí­nimo 8
    dynamicGridSize = Math.min(dynamicGridSize, 10); // Máximo 10x10 para evitar problemas de espacio
    
    // Ajustar según número de palabras para evitar solapamientos
    if (numWords >= 5) dynamicGridSize = Math.max(dynamicGridSize, 9);
    if (numWords >= 6) dynamicGridSize = Math.max(dynamicGridSize, 10);
    
    const gridSize = dynamicGridSize;
    gameState.currentGridSize = gridSize;
    
    
    
    // Actualizar CSS del grid
    gridContainer.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
    
    // Crear grid vacÃí (sin letras inicialmente)
    for (let i = 0; i < gridSize * gridSize; i++) {
        gameState.currentGrid.push('');
    }
    
    // Colocar palabras dinámicamente
    placeWordsInGrid(words, gridSize);
    
    // Rellenar celdas vacías con letras aleatorias
    fillEmptyCells();
    
    // Crear celdas en el DOM
    gameState.currentGrid.forEach((letter, index) => {
        const cell = document.createElement('div');
        cell.className = 'grid-cell';
        cell.textContent = letter;
        cell.dataset.index = index;
        // Eliminado: selección letra a letra
        
        // Añadir eventos de arrastre para móvil y desktop
        addDragEvents(cell, index);
        
        gridContainer.appendChild(cell);
    });
    
}

// Colocar palabras en el grid
function placeWordsInGrid(words, gridSize) {
    // console.log('🎯 Intentando colocar palabras en el grid:', words);
    // console.log('📐 Tamaño del grid:', gridSize);
    // console.log('🧭 Direcciones permitidas:', gameState.allowedDirections);
    
    words.forEach((word, wordIndex) => {
        // console.log(`🔤 Colocando palabra ${wordIndex + 1}/${words.length}: "${word}"`);
        let placed = false;
        let attempts = 0;
        const maxAttempts = 200; // Aumentar intentos
        
        // Usar solo las direcciones permitidas según el JSON
        const allowedDirections = gameState.allowedDirections || ['H', 'V'];
        const directions = [];
        
        // Convertir direcciones del JSON a números de dirección
        allowedDirections.forEach(dir => {
            if (dir === 'H') {
                directions.push(0); // Horizontal normal
                directions.push(4); // Horizontal reversa
            } else if (dir === 'V') {
                directions.push(1); // Vertical normal
                directions.push(5); // Vertical reversa
            } else if (dir === 'R') {
                directions.push(0, 1, 4, 5); // Horizontal y vertical (normal y reversa)
            } else if (dir === 'D') {
                directions.push(2, 3, 6, 7); // Diagonal (normal y reversa)
            }
        });
        
        // Mejorar: intentar direcciones de forma más sistemática
        const shuffledDirections = [...directions].sort(() => Math.random() - 0.5);
        
        while (!placed && attempts < maxAttempts) {
            // Usar dirección del array mezclado para mejor distribución
            const direction = shuffledDirections[attempts % shuffledDirections.length];
            
            let startRow, startCol;
            
            // Determinar si usar palabra normal o reversa
            const useReverse = direction >= 4;
            const actualDirection = direction % 4;
            const actualWord = useReverse ? word.split('').reverse().join('') : word;
            
            if (actualDirection === 0) { // Horizontal
                startRow = Math.floor(Math.random() * gridSize);
                startCol = Math.floor(Math.random() * (gridSize - actualWord.length + 1));
            } else if (actualDirection === 1) { // Vertical
                startRow = Math.floor(Math.random() * (gridSize - actualWord.length + 1));
                startCol = Math.floor(Math.random() * gridSize);
            } else if (actualDirection === 2) { // Diagonal izquierda (arriba-izq a abajo-der)
                startRow = Math.floor(Math.random() * (gridSize - actualWord.length + 1));
                startCol = Math.floor(Math.random() * (gridSize - actualWord.length + 1));
            } else { // Diagonal derecha (arriba-der a abajo-izq)
                startRow = Math.floor(Math.random() * (gridSize - actualWord.length + 1));
                startCol = Math.floor(Math.random() * (gridSize - actualWord.length + 1)) + actualWord.length - 1;
            }
            
            // Verificar que la palabra quepa en la dirección seleccionada
            let fitsInDirection = true;
            if (actualDirection === 0) { // Horizontal
                fitsInDirection = (startCol + actualWord.length - 1) < gridSize;
            } else if (actualDirection === 1) { // Vertical
                fitsInDirection = (startRow + actualWord.length - 1) < gridSize;
            } else if (actualDirection === 2) { // Diagonal izquierda
                fitsInDirection = (startRow + actualWord.length - 1) < gridSize && (startCol + actualWord.length - 1) < gridSize;
            } else { // Diagonal derecha
                fitsInDirection = (startRow + actualWord.length - 1) < gridSize && (startCol - actualWord.length + 1) >= 0;
            }
            
            if (!fitsInDirection) {
                attempts++;
                continue;
            }
            
            // Verificar si se puede colocar la palabra
            let canPlace = true;
            const positions = [];
            
            for (let i = 0; i < actualWord.length; i++) {
                let row, col;
                
                if (actualDirection === 0) { // Horizontal
                    row = startRow;
                    col = startCol + i;
                } else if (actualDirection === 1) { // Vertical
                    row = startRow + i;
                    col = startCol;
                } else if (actualDirection === 2) { // Diagonal izquierda
                    row = startRow + i;
                    col = startCol + i;
                } else { // Diagonal derecha
                    row = startRow + i;
                    col = startCol - i;
                }
                
                const index = row * gridSize + col;
                positions.push(index);
                
                // Verificar conflictos (solo si ya hay una letra diferente)
                const currentLetter = gameState.currentGrid[index];
                // Si la celda ya tiene una letra de una palabra anterior, verificar compatibilidad
                if (currentLetter && currentLetter !== actualWord[i]) {
                        canPlace = false;
                        break;
                    }
                }
                
                if (canPlace) {
                    // Colocar la palabra
                positions.forEach((index, i) => {
                    gameState.currentGrid[index] = actualWord[i];
                });
                    placed = true;
                const directionNames = ['horizontal', 'vertical', 'diagonal-izq', 'diagonal-der'];
                }
            
            attempts++;
        }
        
        // Si no se pudo colocar después de 200 intentos, FORZAR colocación
        if (!placed) {
            console.warn(`⚠️ No se pudo colocar "${word}" después de ${maxAttempts} intentos. Forzando colocación...`);
            
            // FORZAR: Buscar cualquier espacio libre en el grid
            let forcedPlaced = false;
            
            // Intentar todas las posiciones posibles sistemáticamente
            for (let row = 0; row < gridSize && !forcedPlaced; row++) {
                for (let col = 0; col < gridSize && !forcedPlaced; col++) {
                    // Intentar cada dirección permitida
                    for (let dirIndex = 0; dirIndex < directions.length && !forcedPlaced; dirIndex++) {
                        const direction = directions[dirIndex];
                        const useReverse = direction >= 4;
                        const actualDirection = direction % 4;
                        const actualWord = useReverse ? word.split('').reverse().join('') : word;
                        
                        // Verificar si cabe desde esta posición
                        let fitsHere = true;
                        const positions = [];
                        
                        for (let i = 0; i < actualWord.length; i++) {
                            let currentRow, currentCol;
                            
                            if (actualDirection === 0) { // Horizontal
                                currentRow = row;
                                currentCol = col + i;
                            } else if (actualDirection === 1) { // Vertical
                                currentRow = row + i;
                                currentCol = col;
                            } else if (actualDirection === 2) { // Diagonal izquierda
                                currentRow = row + i;
                                currentCol = col + i;
                            } else { // Diagonal derecha
                                currentRow = row + i;
                                currentCol = col - i;
                            }
                            
                            // Verificar límites
                            if (currentRow < 0 || currentRow >= gridSize || currentCol < 0 || currentCol >= gridSize) {
                                fitsHere = false;
                                break;
                            }
                            
                            const index = currentRow * gridSize + currentCol;
                            positions.push(index);
                            
                            // Verificar si hay conflicto
                            const currentLetter = gameState.currentGrid[index];
                            if (currentLetter && currentLetter !== actualWord[i]) {
                                fitsHere = false;
                                break;
                            }
                        }
                        
                        if (fitsHere && positions.length === actualWord.length) {
                            // COLOCAR LA PALABRA FORZADAMENTE
                            positions.forEach((index, i) => {
                                gameState.currentGrid[index] = actualWord[i];
                            });
                            forcedPlaced = true;
                            placed = true;
                            console.log(`✅ Palabra "${word}" colocada FORZADAMENTE en posición (${row}, ${col})`);
                        }
                    }
                }
            }
            
            // Si AÚN no se pudo colocar, ERROR CRÍTICO
            if (!forcedPlaced) {
                console.error(`🚨 ERROR CRÍTICO: No se pudo colocar la palabra "${word}".`);
                alert(`Error: La palabra "${word}" no cabe en el grid. El nivel puede tener un error de diseño.`);
            }
            
            // Estrategia 1: Intentar con posiciones más especí­ficas (CÓDIGO ANTIGUO - ya no necesario)
            const specificPositions = [
                {row: 0, col: 0, dir: 0}, // Esquina superior izquierda, horizontal
                {row: 0, col: 0, dir: 1}, // Esquina superior izquierda, vertical
                {row: 1, col: 1, dir: 0}, // Posición interna, horizontal
                {row: 1, col: 1, dir: 1}, // Posición interna, vertical
            ];
            
            let specificPlaced = false;
            for (const pos of specificPositions) {
                if (tryPlaceAtSpecificPosition(word, pos.row, pos.col, pos.dir, gridSize)) {
                    specificPlaced = true;
                    break;
                }
            }
            
            // Estrategia 2: Usar posición fija como Último recurso
            if (!specificPlaced) {
                placeWordFixed(word, wordIndex, gridSize);
            }
        }
    });
    
    // Validación final: verificar que todas las palabras se colocaron
    let placedCount = 0;
    // console.log('🔍 Verificando palabras colocadas en el grid:');
    words.forEach(word => {
        if (isWordInGrid(word, gridSize)) {
            placedCount++;
            // console.log(`✅ Palabra colocada: ${word}`);
        } else {
            // console.log(`❌ Palabra NO colocada: ${word}`);
        }
    });
    // console.log(`📊 Palabras colocadas: ${placedCount}/${words.length}`);
    
    if (placedCount === words.length) {
        // console.log('✅ Todas las palabras se colocaron correctamente');
    } else {
        // console.log(`⚠️ Solo se colocaron ${placedCount} de ${words.length} palabras`);
    }
}

// Función para verificar si una palabra está en el grid
function isWordInGrid(word, gridSize) {
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
                
                for (let i = 0; i < word.length; i++) {
                    const checkRow = row + (dir.dr * i);
                    const checkCol = col + (dir.dc * i);
                    
                    if (checkRow >= 0 && checkRow < gridSize && checkCol >= 0 && checkCol < gridSize) {
                        const index = checkRow * gridSize + checkCol;
                        currentWord += gameState.currentGrid[index];
                    } else {
                        valid = false;
                        break;
                    }
                }
                
                if (valid && (currentWord === word || currentWord === word.split('').reverse().join(''))) {
                    return true;
                }
            }
        }
    }
    return false;
}

// Función auxiliar para intentar colocar en posición especí­fica
function tryPlaceAtSpecificPosition(word, startRow, startCol, direction, gridSize) {
    const actualWord = word;
    const positions = [];
    let canPlace = true;
    
    // Verificar si cabe en la dirección especificada
    for (let i = 0; i < actualWord.length; i++) {
        let row, col;
        
        switch (direction) {
            case 0: // Horizontal
                row = startRow;
                col = startCol + i;
                break;
            case 1: // Vertical
                row = startRow + i;
                col = startCol;
                break;
            case 2: // Diagonal izquierda
                row = startRow + i;
                col = startCol - i;
                break;
            case 3: // Diagonal derecha
                row = startRow + i;
                col = startCol + i;
                break;
        }
        
        // Verificar lí­mites
        if (row < 0 || row >= gridSize || col < 0 || col >= gridSize) {
            canPlace = false;
            break;
        }
        
        const index = row * gridSize + col;
        positions.push(index);
        
        // Verificar si la celda está ocupada por otra palabra
        if (gameState.currentGrid[index] !== '' && gameState.currentGrid[index] !== actualWord[i]) {
            canPlace = false;
            break;
        }
    }
    
    if (canPlace) {
    // Colocar la palabra
        positions.forEach((index, i) => {
            gameState.currentGrid[index] = actualWord[i];
        });
        return true;
    }
    
    return false;
}

// Colocar palabra en posición fija como fallback
function placeWordFixed(word, wordIndex, gridSize) {
    // Solo usar posiciones fijas si la palabra no se pudo colocar
    
    // Intentar colocar en diferentes posiciones fijas
    // Ahora el grid es del tamaño correcto, todas las posiciones son válidas
    const fixedPositions = [
        { row: 0, col: 0, dir: 0 }, // Horizontal primera fila
        { row: 1, col: 0, dir: 1 }, // Vertical primera columna
        { row: 2, col: 0, dir: 0 }, // Horizontal tercera fila
        { row: 0, col: 2, dir: 1 }, // Vertical tercera columna
        { row: 3, col: 0, dir: 0 }, // Horizontal cuarta fila
        { row: 0, col: 4, dir: 1 }, // Vertical quinta columna
        { row: 4, col: 0, dir: 0 }, // Horizontal quinta fila
        { row: 0, col: 6, dir: 1 }, // Vertical séptima columna
        { row: 0, col: 0, dir: 2 }, // Diagonal izquierda
        { row: 0, col: gridSize-1, dir: 3 } // Diagonal derecha
    ];
    
    let placed = false;
    for (let posIndex = 0; posIndex < fixedPositions.length && !placed; posIndex++) {
        const pos = fixedPositions[posIndex];
        let canPlace = true;
        
        // Verificar si se puede colocar en esta posición
        for (let i = 0; i < word.length; i++) {
            const row = pos.dir === 0 ? pos.row : pos.row + i;
            const col = pos.dir === 0 ? pos.col + i : pos.col;
            
            if (row >= gridSize || col >= gridSize) {
                canPlace = false;
                break;
            }
            
            const index = row * gridSize + col;
            const currentLetter = gameState.currentGrid[index];
            if (currentLetter && currentLetter !== word[i]) {
                canPlace = false;
                break;
            }
        }
        
        if (canPlace) {
            // Colocar la palabra
            for (let i = 0; i < word.length; i++) {
                const row = pos.dir === 0 ? pos.row : pos.row + i;
                const col = pos.dir === 0 ? pos.col + i : pos.col;
                const index = row * gridSize + col;
                gameState.currentGrid[index] = word[i];
            }
            placed = true;
        }
    }
}

// Rellenar celdas vací­as con letras aleatorias
function fillEmptyCells() {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    
    for (let i = 0; i < gameState.currentGrid.length; i++) {
        if (!gameState.currentGrid[i] || gameState.currentGrid[i] === '') {
            gameState.currentGrid[i] = letters[Math.floor(Math.random() * letters.length)];
        }
    }
}

// Seleccionar celda
// Variables globales para el arrastre
let isDragging = false;
let dragStartIndex = null;
let lastHoveredIndex = null;
let dragDirection = null;

// Variables para el sistema de píldoras
let overlaySVG = null;
let currentPill = null;
let colorIndex = 0;
let isProcessingEndDrag = false; // Evitar ejecuciones duplicadas de endDrag
const PILL_COLORS = ["c0", "c1", "c2", "c3", "c4", "c5"];

// Función para forzar transparencia absoluta en una celda
function forceTransparency(cell) {
    if (!cell) return;
    
    // Método 1: setProperty
    cell.style.setProperty('background', 'transparent', 'important');
    cell.style.setProperty('background-color', 'transparent', 'important');
    cell.style.setProperty('background-image', 'none', 'important');
    cell.style.setProperty('box-shadow', 'none', 'important');
    
    // Método 2: cssText (más agresivo)
    cell.style.cssText += 'background: transparent !important; background-color: transparent !important; background-image: none !important; box-shadow: none !important;';
    
    // Método 3: setAttribute (nuclear)
    cell.setAttribute('style', cell.getAttribute('style') + '; background: transparent !important; background-color: transparent !important; background-image: none !important; box-shadow: none !important;');
}

// Función para forzar transparencia SOLO en celdas encontradas
function forceAllFoundCellsTransparency() {
    const foundCells = document.querySelectorAll('#game-grid .grid-cell.is-found');
    foundCells.forEach(cell => {
        forceTransparency(cell);
    });
}

// Función para limpiar estilos inline de celdas seleccionadas
function clearSelectedCellStyles() {
    const selectedCells = document.querySelectorAll('#game-grid .grid-cell.is-selected');
    selectedCells.forEach(cell => {
        // Limpiar estilos inline que puedan interferir, PERO NO el background
        // cell.style.removeProperty('background');           // ← COMENTADO
        // cell.style.removeProperty('background-color');     // ← COMENTADO
        cell.style.removeProperty('background-image');
        cell.style.removeProperty('box-shadow');
    });
}

// Función para limpiar TODAS las píldoras temporales - MÉTODO ESPECÍFICO
function clearAllTemporaryPills() {
    if (!overlaySVG) return;

    // Debug: verificar estado antes de limpiar
    const allLinesBefore = overlaySVG.querySelectorAll('line');
    const tempElementsBefore = overlaySVG.querySelectorAll('[data-temp]');
    const permElementsBefore = overlaySVG.querySelectorAll('[data-permanent]');
    console.log(`🔍 ANTES: ${allLinesBefore.length} líneas total, ${tempElementsBefore.length} temporales, ${permElementsBefore.length} permanentes`);

    // 1) Eliminar solo elementos marcados como temporales (incluyendo currentPill)
    const tempElements = overlaySVG.querySelectorAll('[data-temp]');
    console.log(`🗑️ Eliminando ${tempElements.length} elementos temporales:`, tempElements);
    tempElements.forEach(el => el.remove());

    // 2) Resetear currentPill
    currentPill = null;

    // 3) Limpiar grupos vacíos
    overlaySVG.querySelectorAll('g').forEach(g => {
        if (!g.hasChildNodes()) {
            g.remove();
        }
    });
    
    // Debug: verificar estado después de limpiar
    const allLinesAfter = overlaySVG.querySelectorAll('line');
    const tempElementsAfter = overlaySVG.querySelectorAll('[data-temp]');
    const permElementsAfter = overlaySVG.querySelectorAll('[data-permanent]');
    console.log(`✅ DESPUÉS: ${allLinesAfter.length} líneas total, ${tempElementsAfter.length} temporales, ${permElementsAfter.length} permanentes`);
}

// Ejecutar periódicamente para mantener transparencia
setInterval(forceAllFoundCellsTransparency, 100);

// Inicializar overlay SVG para las píldoras
function initOverlaySVG() {
    const gameGrid = document.getElementById('game-grid');
    if (!gameGrid || overlaySVG) return;
    
    overlaySVG = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    overlaySVG.setAttribute("class", "overlay");
    overlaySVG.setAttribute("width", "100%");
    overlaySVG.setAttribute("height", "100%");
    // OJO: sin viewBox y sin preserveAspectRatio => coordenadas en px del elemento
    gameGrid.prepend(overlaySVG); // mejor delante para que quede debajo del texto pero sobre el fondo
}

// Crear píldora SVG (coordenadas en píxeles)
// Añadimos parámetro isTemp para marcarla como temporal o permanente
function createPill(x1, y1, x2, y2, colorClass, isTemp = false) {
    const gameGrid = document.getElementById('game-grid');
    const rect = gameGrid.getBoundingClientRect();
    const base = Math.min(rect.width/10, rect.height/10);
    const strokeWidth = Math.max(6, base * 0.72);

    if (isTemp) {
        // Para píldoras temporales: crear un rectángulo de fondo sólido
        const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
        group.setAttribute("data-temp", "1");
        
        // Calcular dimensiones del rectángulo
        const minX = Math.min(x1, x2) - strokeWidth/2;
        const minY = Math.min(y1, y2) - strokeWidth/2;
        const maxX = Math.max(x1, x2) + strokeWidth/2;
        const maxY = Math.max(y1, y2) + strokeWidth/2;
        const width = maxX - minX;
        const height = maxY - minY;
        
        // Crear rectángulo de fondo
        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect.setAttribute("x", minX);
        rect.setAttribute("y", minY);
        rect.setAttribute("width", width);
        rect.setAttribute("height", height);
        rect.setAttribute("rx", strokeWidth/2);
        rect.setAttribute("ry", strokeWidth/2);
        rect.setAttribute("class", `fill-${colorClass}`);
        rect.setAttribute("opacity", "1.0");
        
        // Crear línea
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", x1);
        line.setAttribute("y1", y1);
        line.setAttribute("x2", x2);
        line.setAttribute("y2", y2);
        line.setAttribute("stroke-linecap", "round");
        line.setAttribute("stroke-linejoin", "round");
        line.setAttribute("class", `stroke-${colorClass}`);
        line.setAttribute("stroke-width", strokeWidth);
        line.setAttribute("opacity", "0.95");
        
        group.appendChild(rect);
        group.appendChild(line);
        return group;
    } else {
        // Para píldoras permanentes: solo línea (transparente para mostrar píldoras)
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", x1);
        line.setAttribute("y1", y1);
        line.setAttribute("x2", x2);
        line.setAttribute("y2", y2);
        line.setAttribute("stroke-linecap", "round");
        line.setAttribute("stroke-linejoin", "round");
        line.setAttribute("class", `stroke-${colorClass}`);
        line.setAttribute("stroke-width", strokeWidth);
        line.setAttribute("opacity", "0.95");
        line.setAttribute("data-permanent", "1");
        return line;
    }
}

// Obtener posición central de una celda (coordenadas en píxeles reales)
function getCellCenter(index) {
    const gameGrid = document.getElementById('game-grid');
    const cell = gameGrid.querySelector(`.grid-cell[data-index="${index}"]`);
    if (!cell) return { x: 0, y: 0 };

    const g = gameGrid.getBoundingClientRect();
    const c = cell.getBoundingClientRect();

    const center = {
        x: (c.left + c.right) / 2 - g.left,
        y: (c.top  + c.bottom) / 2 - g.top
    };
    
    return center;
}

// Añadir eventos de arrastre a una celda
function addDragEvents(cell, index) {
    // Eventos de mouse (desktop)
    cell.addEventListener('mousedown', (e) => startDrag(e, index));
    cell.addEventListener('mouseenter', (e) => handleDrag(e, index));
    cell.addEventListener('mouseup', (e) => endDrag(e, index));
    
    // Eventos de touch (móvil)
    cell.addEventListener('touchstart', (e) => startDrag(e, index), { passive: false });
    cell.addEventListener('touchmove', (e) => handleTouchMove(e), { passive: false });
    cell.addEventListener('touchend', (e) => endDrag(e, index), { passive: false });
    
    // Prevenir el menú contextual en móvil
    cell.addEventListener('contextmenu', (e) => e.preventDefault());
}

// Iniciar arrastre
function startDrag(e, index) {
    e.preventDefault();
    isDragging = true;
    isProcessingEndDrag = false; // Resetear flag de procesamiento
    dragStartIndex = index;
    lastHoveredIndex = index;
    dragDirection = null; // Resetear dirección
    
    // Inicializar overlay SVG si no existe
    if (!overlaySVG) {
        initOverlaySVG();
    }
    
    // Limpiar píldora anterior
    clearAllTemporaryPills();
    
    // Eliminado: selección letra a letra
    
    // Añadir clase de arrastre al body para CSS
    document.body.classList.add('dragging');
}

// Helper: "Imán" a 8 direcciones (inspirado en ChatGPT)
function snapToDirection(startIndex, currentIndex) {
    const gridSize = Math.sqrt(gameState.currentGrid.length);
    const sr = Math.floor(startIndex / gridSize);
    const sc = startIndex % gridSize;
    const r = Math.floor(currentIndex / gridSize);
    const c = currentIndex % gridSize;
    
    const dy = r - sr;
    const dx = c - sc;
    
    if (dx === 0 && dy === 0) return null;
    
    const adx = Math.abs(dx);
    const ady = Math.abs(dy);
    const THRESHOLD = 1.6; // Mayor = más fácil entrar en diagonal
    
    // Horizontal
    if (adx > THRESHOLD * ady) {
        return { dr: 0, dc: dx > 0 ? 1 : -1 };
    }
    // Vertical
    else if (ady > THRESHOLD * adx) {
        return { dr: dy > 0 ? 1 : -1, dc: 0 };
    }
    // Diagonal
    else {
        return { dr: dy > 0 ? 1 : -1, dc: dx > 0 ? 1 : -1 };
    }
}

// Helper: Construir path desde inicio hasta destino en una dirección
function buildPathInDirection(startIndex, currentIndex, direction) {
    const gridSize = Math.sqrt(gameState.currentGrid.length);
    const sr = Math.floor(startIndex / gridSize);
    const sc = startIndex % gridSize;
    const r = Math.floor(currentIndex / gridSize);
    const c = currentIndex % gridSize;
    
    let steps;
    if (direction.dr === 0 && direction.dc !== 0) {
        steps = Math.abs(c - sc);
    } else if (direction.dc === 0 && direction.dr !== 0) {
        steps = Math.abs(r - sr);
    } else {
        steps = Math.min(Math.abs(r - sr), Math.abs(c - sc));
    }
    
    const path = [];
    for (let i = 0; i <= steps; i++) {
        const rr = sr + direction.dr * i;
        const cc = sc + direction.dc * i;
        if (rr < 0 || rr >= gridSize || cc < 0 || cc >= gridSize) break;
        const idx = rr * gridSize + cc;
        path.push(idx);
    }
    
    return path;
}

// Manejar arrastre con snap a direcciones
function handleDrag(e, index) {
    if (!isDragging || dragStartIndex === null) return;
    
    console.log(`🖱️ handleDrag: index=${index}, selectedCells=${gameState.selectedCells.length}`);
    
    e.preventDefault();
    
    // Solo procesar si es una celda diferente
    if (index !== lastHoveredIndex) {
        lastHoveredIndex = index;
        
        // Detectar dirección con "imán" a 8 direcciones
        const direction = snapToDirection(dragStartIndex, index);
        if (!direction) return;
        
        // Actualizar dirección de arrastre
        dragDirection = direction;
        
        // Construir path completo en esa dirección
        const newPath = buildPathInDirection(dragStartIndex, index, direction);
        
        // Actualizar selección con el path completo
        gameState.selectedCells = newPath;
        updateCellSelection();
        
        // Crear píldora temporal durante el arrastre para mostrar evolución
        if (newPath.length >= 2) {
            const startCenter = getCellCenter(newPath[0]);
            const endCenter = getCellCenter(newPath[newPath.length - 1]);
            
            // DEBUG: Verificar z-index de elementos
            const overlay = document.querySelector('#game-grid .overlay');
            const firstCell = document.querySelector(`#game-grid .grid-cell[data-index="${newPath[0]}"]`);
            console.log(`🔍 Z-INDEX DEBUG:`);
            console.log(`  - Overlay SVG: ${overlay ? getComputedStyle(overlay).zIndex : 'N/A'}`);
            console.log(`  - Primera celda: ${firstCell ? getComputedStyle(firstCell).zIndex : 'N/A'}`);
            console.log(`  - Primera celda classes: ${firstCell ? firstCell.className : 'N/A'}`);
            
            // Solo crear/actualizar píldora si no existe o si el path cambió significativamente
            let needsUpdate = false;
            
            if (!currentPill) {
                needsUpdate = true;
            } else {
                // Comparar con tolerancia para evitar recrear por diferencias mínimas
                const tolerance = 0.1;
                const line = currentPill.querySelector('line');
                if (!line) {
                    needsUpdate = true;
                } else {
                    const x1 = parseFloat(line.getAttribute('x1'));
                    const y1 = parseFloat(line.getAttribute('y1'));
                    const x2 = parseFloat(line.getAttribute('x2'));
                    const y2 = parseFloat(line.getAttribute('y2'));
                    
                    if (Math.abs(x1 - startCenter.x) > tolerance || 
                        Math.abs(y1 - startCenter.y) > tolerance ||
                        Math.abs(x2 - endCenter.x) > tolerance || 
                        Math.abs(y2 - endCenter.y) > tolerance) {
                        needsUpdate = true;
                    }
                }
            }
            
            if (needsUpdate) {
                // Limpiar píldora anterior
                if (currentPill) {
                    currentPill.remove();
                }
                
                // Crear nueva píldora temporal
                console.log(`🎨 Creando píldora temporal durante arrastre: (${startCenter.x.toFixed(1)}, ${startCenter.y.toFixed(1)}) -> (${endCenter.x.toFixed(1)}, ${endCenter.y.toFixed(1)})`);
                currentPill = createPill(startCenter.x, startCenter.y, endCenter.x, endCenter.y, PILL_COLORS[0], true);
                overlaySVG.appendChild(currentPill);
                console.log(`🎨 Píldora temporal añadida al DOM:`, currentPill);
                console.log(`🎨 Overlay SVG children:`, overlaySVG.children.length);
                const rect = currentPill.querySelector('rect');
                const line = currentPill.querySelector('line');
                console.log(`🎨 Rect opacity:`, rect ? rect.getAttribute('opacity') : 'null');
                console.log(`🎨 Line opacity:`, line ? line.getAttribute('opacity') : 'null');
                console.log(`🎨 Rect position:`, rect ? `x=${rect.getAttribute('x')}, y=${rect.getAttribute('y')}, w=${rect.getAttribute('width')}, h=${rect.getAttribute('height')}` : 'null');
                console.log(`🎨 Line coords:`, line ? `(${line.getAttribute('x1')}, ${line.getAttribute('y1')}) -> (${line.getAttribute('x2')}, ${line.getAttribute('y2')})` : 'null');
                
                // Debug: verificar si la píldora es visible
                const pillBounds = currentPill.getBoundingClientRect();
                const gridRect = document.querySelector('#game-grid').getBoundingClientRect();
                console.log(`🎨 Píldora visible: ${pillBounds.width > 0 && pillBounds.height > 0 ? 'SÍ' : 'NO'}`);
                console.log(`🎨 Píldora posición: x=${pillBounds.left - gridRect.left}, y=${pillBounds.top - gridRect.top}`);
                
                // Debug: verificar el color de la píldora
                const pillRect = currentPill.querySelector('rect');
                const pillLine = currentPill.querySelector('line');
                console.log(`🎨 Píldora color: rect=${pillRect ? pillRect.getAttribute('class') : 'null'}, line=${pillLine ? pillLine.getAttribute('class') : 'null'}`);
                console.log(`🎨 Píldora opacidad: rect=${pillRect ? pillRect.getAttribute('opacity') : 'null'}, line=${pillLine ? pillLine.getAttribute('opacity') : 'null'}`);
            }
        }
    }
}

// Manejar movimiento de touch
function handleTouchMove(e) {
    if (!isDragging) return;
    
    e.preventDefault();
    
    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    
    if (element && element.classList.contains('grid-cell')) {
        const index = parseInt(element.dataset.index);
        handleDrag(e, index);
    }
}

// Finalizar arrastre
function endDrag(e, index) {
    if (!isDragging || isProcessingEndDrag) return;
    
    isProcessingEndDrag = true; // Marcar como procesando
    
    e.preventDefault();
    isDragging = false;
    dragStartIndex = null;
    lastHoveredIndex = null;
    
    // Remover clase de arrastre
    document.body.classList.remove('dragging');
    
    // Verificar si la selección es válida
    if (gameState.selectedCells.length >= 2) {
        // La píldora temporal ya existe (creada durante el arrastre)
        // Solo verificar si es una palabra válida
        checkForWord();
    } else {
        // Si la selección no es válida, limpiar inmediatamente
        clearSelection();
    }
    
    // Resetear flag después de un breve delay
    setTimeout(() => {
        isProcessingEndDrag = false;
    }, 100);
}


// Añadir eventos globales para el arrastre
function initDragEvents() {
    // Click en el contenedor del grid (fuera de las celdas) limpia la selección
    const gridContainer = document.getElementById('game-grid');
    if (gridContainer) {
        gridContainer.addEventListener('click', (e) => {
            // Solo limpiar si se hizo click en el contenedor, no en una celda
            if (e.target === gridContainer) {
                clearSelection();
            }
        });
    }
    
    // Eventos globales de mouse
    document.addEventListener('mouseup', (e) => {
        if (isDragging) {
            endDrag(e, null);
        }
    });
    
    // Eventos globales de touch
    document.addEventListener('touchend', (e) => {
        if (isDragging) {
            endDrag(e, null);
        }
    });
    
    // Prevenir scroll durante el arrastre en móvil
    document.addEventListener('touchmove', (e) => {
        if (isDragging) {
            e.preventDefault();
        }
    }, { passive: false });
}

// Función selectCell eliminada - solo drag and drop

// Verificar si la selección temporal forma una línea recta
function isValidSelection(cells) {
    if (cells.length < 2) return true;
    
    const gridSize = Math.sqrt(gameState.currentGrid.length);
    
    // Obtener primera y última celda SIN ordenar (respetando el orden de selección)
    const first = {
        index: cells[0],
        row: Math.floor(cells[0] / gridSize),
        col: cells[0] % gridSize
    };
    
    const last = {
        index: cells[cells.length - 1],
        row: Math.floor(cells[cells.length - 1] / gridSize),
        col: cells[cells.length - 1] % gridSize
    };
    
    // Calcular diferencias
    const deltaRow = last.row - first.row;
    const deltaCol = last.col - first.col;
    
    // Calcular pasos
    const stepRow = deltaRow === 0 ? 0 : (deltaRow > 0 ? 1 : -1);
    const stepCol = deltaCol === 0 ? 0 : (deltaCol > 0 ? 1 : -1);
    
    let direction = null;
    
    // Determinar dirección
    if (deltaRow === 0 && deltaCol !== 0) {
        direction = 'H'; // Horizontal
    } else if (deltaCol === 0 && deltaRow !== 0) {
        direction = 'V'; // Vertical
    } else if (Math.abs(deltaRow) === Math.abs(deltaCol)) {
        direction = 'D'; // Diagonal
    } else {
        // No es una línea recta válida
        return false;
    }
    
    // Verificar que todas las celdas estén en la línea recta esperada
    for (let i = 0; i < cells.length; i++) {
        const expectedRow = first.row + (i * stepRow);
        const expectedCol = first.col + (i * stepCol);
        const expectedIndex = expectedRow * gridSize + expectedCol;
        
        if (cells[i] !== expectedIndex) {
            return false;
        }
    }
    
    // Verificar si la dirección está permitida
    return isDirectionAllowed(direction);
}

// Validar que las celdas seleccionadas están en lí­nea recta
function isValidWordSelection() {
    if (gameState.selectedCells.length < 2) return true;
    
    const gridSize = Math.sqrt(gameState.currentGrid.length);
    const cells = gameState.selectedCells.map(index => ({
        index,
        row: Math.floor(index / gridSize),
        col: index % gridSize
    }));
    
    // Ordenar celdas por posición
    cells.sort((a, b) => {
        if (a.row !== b.row) return a.row - b.row;
        return a.col - b.col;
    });
    
    // Verificar si están en lí­nea recta
    const first = cells[0];
    const last = cells[cells.length - 1];
    
    // Calcular diferencias
    const deltaRow = last.row - first.row;
    const deltaCol = last.col - first.col;
    
    // Verificar si es horizontal (deltaRow = 0)
    if (deltaRow === 0) {
        return cells.every((cell, i) => 
            cell.row === first.row && 
            cell.col === first.col + i
        );
    }
    
    // Verificar si es vertical (deltaCol = 0)
    if (deltaCol === 0) {
        return cells.every((cell, i) => 
            cell.col === first.col && 
            cell.row === first.row + i
        );
    }
    
    // Verificar si es diagonal
    if (Math.abs(deltaRow) === Math.abs(deltaCol)) {
        const stepRow = deltaRow > 0 ? 1 : -1;
        const stepCol = deltaCol > 0 ? 1 : -1;
        
        return cells.every((cell, i) => 
            cell.row === first.row + (i * stepRow) && 
            cell.col === first.col + (i * stepCol)
        );
    }
    
    return false;
}

// Ordenar celdas según la dirección de la lí­nea recta
function sortCellsByDirection(cells) {
    if (cells.length < 2) return cells;
    
    // Ordenar primero por posición general
    cells.sort((a, b) => {
        if (a.row !== b.row) return a.row - b.row;
        return a.col - b.col;
    });
    
    const first = cells[0];
    const last = cells[cells.length - 1];
    
    // Calcular diferencias
    const deltaRow = last.row - first.row;
    const deltaCol = last.col - first.col;
    
    // Determinar dirección y ordenar apropiadamente
    if (deltaRow === 0) {
        // Horizontal: ordenar por columna (izquierda a derecha)
        return cells.sort((a, b) => a.col - b.col);
    } else if (deltaCol === 0) {
        // Vertical: ordenar por fila (arriba a abajo)
        return cells.sort((a, b) => a.row - b.row);
    } else if (Math.abs(deltaRow) === Math.abs(deltaCol)) {
        // Diagonal: ordenar según la dirección diagonal
        if (deltaRow > 0 && deltaCol > 0) {
            // Diagonal descendente derecha: ordenar por fila (arriba a abajo)
            return cells.sort((a, b) => a.row - b.row);
        } else if (deltaRow > 0 && deltaCol < 0) {
            // Diagonal descendente izquierda: ordenar por fila (arriba a abajo)
            return cells.sort((a, b) => a.row - b.row);
        } else if (deltaRow < 0 && deltaCol > 0) {
            // Diagonal ascendente derecha: ordenar por fila (abajo a arriba)
            return cells.sort((a, b) => b.row - a.row);
        } else if (deltaRow < 0 && deltaCol < 0) {
            // Diagonal ascendente izquierda: ordenar por fila (abajo a arriba)
            return cells.sort((a, b) => b.row - a.row);
        }
    }
    
    // Fallback: ordenar por fila y columna
    return cells.sort((a, b) => {
        if (a.row !== b.row) return a.row - b.row;
        return a.col - b.col;
    });
}

// Verificar automáticamente si se formó una palabra
function checkForWord() {
    if (gameState.selectedCells.length < 2) return;
    
    // NO permitir encontrar palabras si el nivel ha expirado
    if (gameState.levelExpired) {
        showMessage('⏰ Nivel expirado. No se pueden encontrar más palabras.', 'error');
        return;
    }
    
    // Ya verificamos que es lí­nea recta antes de llamar esta función
    
    // Ordenar celdas seleccionadas en el orden correcto de la lí­nea recta
    const gridSize = Math.sqrt(gameState.currentGrid.length);
    const cells = gameState.selectedCells.map(index => ({
        index,
        row: Math.floor(index / gridSize),
        col: index % gridSize
    }));
    
    // Determinar la dirección de la lí­nea y ordenar apropiadamente
    const sortedCells = sortCellsByDirection(cells);
    
    // Crear palabra temporal para verificación (usando letras reales del grid original)
    const selectedWord = sortedCells
        .map(cell => {
            // Si la celda tiene niebla, usar la letra original para verificación
            if (gameState.currentGrid[cell.index] === '?') {
                return gameState.originalGrid[cell.index];
            }
            return gameState.currentGrid[cell.index];
        })
        .join('');
    
    const reverseWord = selectedWord.split('').reverse().join('');
    
    
    // Verificar si la palabra está en la lista (usando comparación normalizada)
    const foundWordLogic = gameState.currentWordsLogic.find(word => 
        compareWords(word, selectedWord) || compareWords(word, reverseWord)
    );
    
    // Obtener la palabra de display correspondiente
    const foundWord = foundWordLogic ? 
        gameState.currentWordsDisplay[gameState.currentWordsLogic.indexOf(foundWordLogic)] : null;
    
    if (foundWord && !gameState.foundWords.includes(foundWord)) {
        // Verificar si la palabra expiró - BLOQUEAR si expiró
        if (gameState.activeMechanics.includes('wordTimer') && gameState.wordTimers[foundWord] === 0) {
            showMessage(`⏰ La palabra "${foundWord}" ha expirado. No se puede completar.`, 'error');
            // Limpiar selección inmediatamente si la palabra expiró
            clearSelection();
            return;
        }
        
        // Palabra encontrada - revelar todas las celdas con niebla de la palabra
        gameState.foundWords.push(foundWord);
        
        // Convertir píldora temporal en permanente
        if (currentPill) {
            console.log(`🎨 Convirtiendo píldora temporal en permanente`);
            currentPill.removeAttribute('data-temp');
            currentPill.setAttribute('data-permanent', '1');
            currentPill.setAttribute('class', `stroke-${PILL_COLORS[colorIndex % PILL_COLORS.length]}`);
            colorIndex++;
            currentPill = null; // Ya no es temporal
        }
        
        // Actualizar las celdas encontradas para que muestren las letras correctamente
        gameState.selectedCells.forEach(cellIndex => {
            const cell = document.querySelector(`#game-grid .grid-cell[data-index="${cellIndex}"]`);
            if (cell) {
                // Remover clase de selección temporal
                cell.classList.remove('is-selected');
                // Añadir clase de celda encontrada
                cell.classList.add('is-found');
                // Asegurar que las letras sean visibles
                cell.style.color = '#000';
                cell.style.background = 'transparent';
                cell.style.backgroundColor = 'transparent';
            }
        });
        
        // Limpiar pistas de la palabra encontrada
        clearHintsForWord(foundWord);
        
        // Calcular puntuación
        const scoreMultiplier = gameState.streak + 1;
        
        gameState.score += foundWord.length * 100 * scoreMultiplier;
        gameState.streak++;
        
        // Animaciones
        const coinsElement = document.getElementById('coins');
        if (coinsElement) {
            // No animar monedas por palabra individual
        }
        animateWordFound(foundWord);
        playSound('word'); // Sonido al encontrar palabra
        
        // Revelar celdas con niebla si hay mecánica activa
        if (gameState.activeMechanics.includes('fog')) {
            gameState.selectedCells.forEach(index => {
                if (gameState.currentGrid[index] === '?') {
                    gameState.currentGrid[index] = gameState.originalGrid[index];
                    gameState.revealedCells.push(index);
                    
                    // Actualizar visualización
                    const cell = document.querySelector(`#game-grid .grid-cell[data-index="${index}"]`);
            if (!cell) return;
                    if (cell) {
                        cell.textContent = gameState.originalGrid[index];
                        cell.classList.remove('fog');
                    }
                }
            });
        }
        
        // Obtener color único para esta palabra
        const wordIndex = gameState.currentWordsDisplay.indexOf(foundWord);
        const WORD_COLORS = [
            '#ef4444',  // Rojo
            '#f59e0b',  // Naranja
            '#eab308',  // Amarillo
            '#22c55e',  // Verde
            '#06b6d4',  // Cyan
            '#3b82f6',  // Azul
            '#8b5cf6',  // Violeta
            '#ec4899',  // Rosa
        ];
        const wordColor = WORD_COLORS[wordIndex % WORD_COLORS.length];
        
        // Marcar celdas como encontradas con animación
        const foundCells = gameState.selectedCells.slice(); // Copia para usar en animación
        foundCells.forEach((index, i) => {
            const cell = document.querySelector(`#game-grid .grid-cell[data-index="${index}"]`);
            if (!cell) return;
            cell.classList.remove('is-selected');
            cell.classList.add('is-found');

            // Forzar transparencia absoluta - solución drástica
            forceTransparency(cell);
            // Animación escalonada para cada celda
            setTimeout(() => {
                cell.style.transform = 'scale(1.2)';
                // NO aplicar backgroundColor - ya se aplicó forceTransparency()
                setTimeout(() => {
                    cell.style.transform = '';
                }, 200);
            }, i * 100);
        });
        
        // Mostrar mensaje
        showMessage(`¡Encontraste "${foundWord}"! +${foundWord.length * 100 * scoreMultiplier} puntos`, 'success');
        
        // Limpiar selección
        gameState.selectedCells = [];
        updateCellSelection();
        updateHUD();
        updateWordsList();
        
        // Verificar si se completó el nivel
        if (gameState.foundWords.length === gameState.currentWordsDisplay.length) {
            // Verificar si ya se está mostrando la modal de nivel completado
            const existingOverlay = document.querySelector('.level-complete-overlay');
            const isLevelCompleteModal = existingOverlay?.querySelector('.level-complete-title')?.textContent.includes('Completado');
            if (!existingOverlay || !isLevelCompleteModal) {
                setTimeout(async () => {
                    // Mostrar mensaje animado de nivel completado
                    showLevelComplete();
                
                // Reproducir sonido de nivel completado
                playSound('level');
                
                    // Animar monedas inmediatamente (antes del overlay)
                    const coinsElement = document.getElementById('coins');
                    if (coinsElement) {
                        animateCoins(coinsElement, 10);
                    }
                    
                    // NO avanzar automáticamente - esperar a que el usuario presione "Siguiente Nivel" (4s + 0.5s)
            }, 1000);
            }
        }
    } else if (gameState.selectedCells.length >= 2) {
        // Palabra no válida - limpiar selección automáticamente después de un breve delay
        // Mostrar mensaje de error
        showMessage(`"${selectedWord}" no es una palabra válida`, 'error');
        
        // Limpiar píldora temporal
        if (currentPill) {
            console.log(`🗑️ Eliminando píldora temporal (palabra no válida)`);
            currentPill.remove();
            currentPill = null;
        }
        
        // Limpiar selección inmediatamente
        gameState.selectedCells = [];
        updateCellSelection();
    }
}

// Actualizar selección visual
function updateCellSelection() {
    document.querySelectorAll('#game-grid .grid-cell').forEach((cell, index) => {
        cell.classList.remove('is-selected');
        // Comparar usando el dataset.index que es el índice real
        const cellIndex = parseInt(cell.dataset.index);
        if (gameState.selectedCells.includes(cellIndex)) {
            cell.classList.add('is-selected');
        }
    });
    
    // Limpiar estilos inline de celdas seleccionadas para que use el CSS
    clearSelectedCellStyles();
    
    // Actualizar el display de palabra en progreso
    updateCurrentWordDisplay();
}

// Actualizar el display de la palabra actual que se está formando
function updateCurrentWordDisplay() {
    const currentWordDisplay = document.getElementById('current-word-display');
    const currentWordText = document.getElementById('current-word-text');
    
    if (!currentWordDisplay || !currentWordText) return;
    
    if (gameState.selectedCells.length > 0) {
        // Construir la palabra con las celdas seleccionadas
        const word = gameState.selectedCells
            .map(index => gameState.currentGrid[index])
            .join('');
        
        currentWordText.textContent = word;
        currentWordDisplay.style.display = 'block';
    } else {
        currentWordDisplay.style.display = 'none';
    }
}

// Limpiar selección
function clearSelection() {
    gameState.selectedCells.forEach(i => {
        const el = document.querySelector(`#game-grid .grid-cell[data-index="${i}"]`);
        if (el) {
            el.classList.remove('is-selected');
            el.style.removeProperty('background');
            el.style.removeProperty('background-color');
            el.style.removeProperty('background-image');
        }
    });
    gameState.selectedCells = [];
    updateCellSelection();
    
    // Limpiar todas las píldoras temporales
    clearAllTemporaryPills();
    
    // Si el nivel habí­a expirado, reiniciarlo con penalización
    if (gameState.levelExpired) {
        gameState.failedAttempts++;
        
        // Reducir puntuación por cada intento fallido
        const penalty = gameState.failedAttempts * 100;
        gameState.score = Math.max(0, gameState.score - penalty);
        
        showMessage(`Reiniciando nivel... Penalización: -${penalty} puntos (Intento ${gameState.failedAttempts})`, 'error');
        
        // Reiniciar el nivel
        setTimeout(() => {
            generateNextLevel(); // Esto aplicará las mecánicas de nuevo
        }, 1500);
    } else {
    }
}

// Confirmar selección
function submitSelection() {
    if (gameState.selectedCells.length < 2) {
        showMessage('Selecciona al menos 2 letras', 'error');
        return;
    }
    
    const selectedWord = gameState.selectedCells
        .map(index => gameState.currentGrid[index])
        .join('');
    
    const reverseWord = selectedWord.split('').reverse().join('');
    
    // Verificar si la palabra está en la lista (usando comparación normalizada)
    const foundWordLogic = gameState.currentWordsLogic.find(word => 
        compareWords(word, selectedWord) || compareWords(word, reverseWord)
    );
    
    // Obtener la palabra de display correspondiente
    const foundWord = foundWordLogic ? 
        gameState.currentWordsDisplay[gameState.currentWordsLogic.indexOf(foundWordLogic)] : null;
    
    if (foundWord && !gameState.foundWords.includes(foundWord)) {
        // Palabra encontrada
        gameState.foundWords.push(foundWord);
        
        // Limpiar pistas de la palabra encontrada
        clearHintsForWord(foundWord);
        
        gameState.score += foundWord.length * 100 * (gameState.streak + 1);
        gameState.streak++;
        
        // Obtener color único para esta palabra
        const wordIndex = gameState.currentWordsDisplay.indexOf(foundWord);
        const WORD_COLORS = [
            '#ef4444',  // Rojo
            '#f59e0b',  // Naranja
            '#eab308',  // Amarillo
            '#22c55e',  // Verde
            '#06b6d4',  // Cyan
            '#3b82f6',  // Azul
            '#8b5cf6',  // Violeta
            '#ec4899',  // Rosa
        ];
        const wordColor = WORD_COLORS[wordIndex % WORD_COLORS.length];
        
        // Marcar celdas como encontradas con animación
        const foundCells = gameState.selectedCells.slice(); // Copia para usar en animación
        foundCells.forEach((index, i) => {
            const cell = document.querySelector(`#game-grid .grid-cell[data-index="${index}"]`);
            if (!cell) return;
            cell.classList.remove('is-selected');
            cell.classList.add('is-found');

            // Forzar transparencia absoluta - solución drástica
            forceTransparency(cell);
            // Animación escalonada para cada celda
            setTimeout(() => {
                cell.style.transform = 'scale(1.2)';
                // NO aplicar backgroundColor - ya se aplicó forceTransparency()
                setTimeout(() => {
                    cell.style.transform = '';
                }, 200);
            }, i * 100);
        });
        
        showMessage(`Encontraste "${foundWord}"! +${foundWord.length * 100} puntos`, 'success');
        playSound('word'); // Sonido al encontrar palabra
        
        // Verificar si se completó el nivel
        if (gameState.foundWords.length === gameState.currentWordsDisplay.length) {
            // Verificar si ya se está mostrando la modal de nivel completado
            const existingOverlay = document.querySelector('.level-complete-overlay');
            const isLevelCompleteModal = existingOverlay?.querySelector('.level-complete-title')?.textContent.includes('Completado');
            if (!existingOverlay || !isLevelCompleteModal) {
                setTimeout(() => {
                    // Mostrar mensaje animado de nivel completado
                    showLevelComplete();
                    
                    // Reproducir sonido de nivel completado
                    playSound('level');
                    
                    // Animar monedas inmediatamente (antes del overlay)
                    const coinsElement = document.getElementById('coins');
                    if (coinsElement) {
                        animateCoins(coinsElement, 10);
                    }
                    
                    // NO avanzar automáticamente - esperar a que el usuario presione "Siguiente Nivel"
                }, 1000);
            }
        }
    } else {
        // Palabra incorrecta
        gameState.streak = 0;
        showMessage(`"${selectedWord}" no es válida.`, 'error');
    }
    
    clearSelection();
    updateHUD();
    updateWordsList();
}


