// Inicializar juego
async function initGame() {
    // Cargar progreso segÃºn tipo de usuario
    if (gameState.currentUser && gameState.currentUser.isGuest) {
        // Invitado: cargar de localStorage
        loadGuestProgress();
    } else if (gameState.currentUser && !gameState.currentUser.isGuest) {
        // Usuario registrado: cargar de BBDD
        await loadUserProgress();
    }
    
    // Configurar palabras del nivel actual
    gameState.currentWords = getLevelWords(gameState.currentLevel);
    
    // El grid ahora es dinÃ¡mico basado en las palabras, no fijo por nivel
    // CONFIG.GRID_SIZE ya no se usa - se calcula dinÃ¡micamente
    
    // Ocultar botÃ³n de reiniciar progreso (no disponible para invitados)
    const clearProgressBtn = document.getElementById('clear-progress-btn');
    if (clearProgressBtn) {
        clearProgressBtn.style.display = 'none';
    }
    
    // Actualizar informaciÃ³n del usuario
    updateUserInfo();
    
    generateGrid();
    updateHUD();
    
    // Generar y aplicar mecÃ¡nicas aleatorias DESPUÃ‰S de generar el grid
    const randomMechanics = generateRandomMechanics(gameState.currentLevel);
    applyMechanics(randomMechanics);
    
    // Actualizar lista de palabras DESPUÃ‰S de aplicar mecÃ¡nicas
    updateWordsList();
    
    // Aplicar mecÃ¡nicas visuales despuÃ©s de inicializar el juego
    setTimeout(() => {
        applyVisualMechanics();
    }, 200);
}

// Generar siguiente nivel
function generateNextLevel() {
    console.log('ðŸ”„ Generando siguiente nivel...');
    
    // LIMPIAR mecÃ¡nicas del nivel anterior
    gameState.activeMechanics = [];
    gameState.originalGrid = [];
    gameState.revealedCells = [];
    gameState.hiddenWords = [];
    gameState.wordTimers = {};
    gameState.dynamicTimer = null; // Limpiar timer dinÃ¡mico
    gameState.levelExpired = false;
    gameState.failedAttempts = 0;
    gameState.selectedCells = [];
    gameState.foundWords = []; // Limpiar palabras encontradas
    
    // Limpiar timers del nivel anterior
    if (gameState.dynamicTimerInterval) {
        clearInterval(gameState.dynamicTimerInterval);
        gameState.dynamicTimerInterval = null;
        console.log('ðŸ§¹ Timer dinÃ¡mico limpiado para nuevo nivel');
    }
    if (gameState.wordTimerInterval) {
        clearInterval(gameState.wordTimerInterval);
        gameState.wordTimerInterval = null;
        console.log('ðŸ§¹ Timer de palabras limpiado para nuevo nivel');
    }
    
    // Cambiar palabras segÃºn el nivel
    const levelWords = getLevelWords(gameState.currentLevel);
    gameState.currentWords = levelWords;
    
    // La dificultad ahora se maneja con el nÃºmero y tipo de palabras, no con grid fijo
    // El grid se calcula dinÃ¡micamente basado en las palabras seleccionadas
    
    generateGrid();
    updateHUD();
    
    // Generar y aplicar mecÃ¡nicas aleatorias DESPUÃ‰S de generar el grid
    const randomMechanics = generateRandomMechanics(gameState.currentLevel);
    applyMechanics(randomMechanics);
    
    // Actualizar lista de palabras DESPUÃ‰S de aplicar mecÃ¡nicas
    updateWordsList();
    
    // Aplicar mecÃ¡nicas visuales despuÃ©s de generar el nuevo nivel
    setTimeout(() => {
        applyVisualMechanics();
    }, 200);
}

// Obtener palabras segÃºn el nivel
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
    // Bancos de palabras por categorÃ­a - Ampliados para mÃ¡s variedad
    const wordBanks = {
        // Niveles 1-3: Palabras cortas (3-4 letras)
        short: [
            'MAR', 'SOL', 'LUNA', 'CASA', 'AGUA', 'FUEGO', 'AIRE', 'TIERRA', 
            'GATO', 'PERRO', 'PATO', 'OSO', 'FLOR', 'MESA', 'SILLA', 'VENTANA',
            'PESO', 'MANO', 'CARA', 'BOCA', 'PIES', 'OJOS', 'CABO', 'MAPA',
            'SAL', 'PAN', 'CAFE', 'TE', 'LA', 'EL', 'UN', 'DOS', 'TRES', 'CUATRO'
        ],
        
        // Niveles 4-6: OcÃ©ano (4-6 letras)
        ocean: [
            'MAR', 'ALGA', 'CORAL', 'PECES', 'DELFIN', 'BALLENA', 'ANCLA', 'FARO', 
            'OCEANO', 'BRISA', 'PERLA', 'BAHIA', 'PULPO', 'ANEMONA', 'SARDINA',
            'ATUN', 'SALMON', 'LANGOSTA', 'CANGREJO', 'MEDUSA', 'TIBURON', 'ORCA',
            'FOCA', 'PINGUINO', 'GAVIOTA', 'PELICANO', 'CORRIENTE', 'MAREA', 'PLAYA'
        ],
        
        // Niveles 7-9: Bosque (4-6 letras)
        forest: [
            'ARBOL', 'HOJA', 'RAMA', 'PIÃ‘A', 'BOSQUE', 'MUSGO', 'SETAS', 'ROBLE', 
            'CIERVO', 'ZORRO', 'NIDO', 'TREBOL', 'LIANA', 'SELVA', 'CORTEZA',
            'PINO', 'ABETO', 'CEDRO', 'OLMO', 'SAUCE', 'ALAMO', 'CHOPO', 'CASTAÃ‘O',
            'BELLOTA', 'FRUTA', 'BOSQUE', 'MADERA', 'HOJARASCA', 'SOMBRA', 'TRONCO'
        ],
        
        // Niveles 10+: Mixto mÃ¡s difÃ­cil (7-10 letras)
        advanced: [
            'MONTAÃ‘A', 'CASCADA', 'SENDERO', 'CUMBRE', 'ESTRELLA', 'GALAXIA', 
            'PLANETA', 'COMETA', 'AVENTURA', 'MISTERIO', 'TESORO', 'LEYENDA', 
            'TELESCOPIO', 'NEBULOSA', 'ARROYO', 'PULSAR', 'ASTEROIDE', 'METEORITO',
            'CONSTELACION', 'EXPLORACION', 'EXPEDICION', 'DESCUBRIMIENTO', 'INVESTIGACION',
            'LABORATORIO', 'OBSERVATORIO', 'EXPERIMENTO', 'CIENTIFICO', 'AVENTURERO'
        ]
    };
    
    // Seleccionar categorÃ­a segÃºn el nivel
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
    
    // Seleccionar nÃºmero aleatorio de palabras (4-6) de la categorÃ­a
    const bank = wordBanks[category];
    
    // Mezclar el banco de palabras para mayor aleatoriedad
    const shuffledBank = [...bank].sort(() => Math.random() - 0.5);
    
    // Filtrar palabras que no excedan 10 letras y no hayan sido usadas recientemente
    const validWords = shuffledBank.filter(word => 
        word.length <= 10 && !gameState.usedWords[category].has(word)
    );
    
    // Si no hay suficientes palabras nuevas, limpiar cache parcialmente
    if (validWords.length < 4) {
        console.log(`ðŸ”„ Limpiando cache de categorÃ­a ${category} - pocas palabras nuevas`);
        gameState.usedWords[category].clear();
        const allValidWords = shuffledBank.filter(word => word.length <= 10);
        if (allValidWords.length > 0) {
            allValidWords.slice(0, 6).forEach(word => gameState.usedWords[category].add(word));
            return allValidWords.slice(0, Math.min(6, allValidWords.length));
        }
    }
    
    if (validWords.length === 0) {
        console.warn(`âš ï¸ No hay palabras vÃ¡lidas en categorÃ­a ${category}`);
        return ['MAR', 'SOL', 'LUNA', 'CASA']; // Fallback
    }
    
    const numWords = Math.floor(Math.random() * 3) + 4; // 4, 5 o 6 palabras
    const selectedWords = [];
    
    // Seleccionar palabras Ãºnicas del banco mezclado
    for (let i = 0; i < Math.min(numWords, validWords.length); i++) {
        selectedWords.push(validWords[i]);
        gameState.usedWords[category].add(validWords[i]); // Marcar como usada
    }
    
    console.log(`ðŸ“ Nivel ${level}: Seleccionadas ${selectedWords.length} palabras aleatorias de categorÃ­a "${category}":`, selectedWords);
    console.log(`ðŸ“ Palabras disponibles en categorÃ­a "${category}":`, bank.length, 'opciones');
    return selectedWords;
}

// Generar grid de juego
function generateGrid() {
    const gridContainer = document.getElementById('game-grid');
    gridContainer.innerHTML = '';
    gameState.currentGrid = [];
    
    const words = gameState.currentWords;
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    
    // Calcular el tamaÃ±o del grid basado en la palabra mÃ¡s larga y nÃºmero de palabras
    const maxWordLength = Math.max(...words.map(word => word.length));
    const numWords = words.length;
    
    // Grid dinÃ¡mico: mÃ­nimo 8x8, mÃ¡ximo 10x10
    // Considerar palabra mÃ¡s larga + margen mÃ­nimo
    let dynamicGridSize = Math.max(maxWordLength + 1, 8); // Palabra + 1 de margen, mÃ­nimo 8
    dynamicGridSize = Math.min(dynamicGridSize, 10); // MÃ¡ximo 10x10 para evitar problemas de espacio
    
    // Ajustar segÃºn nÃºmero de palabras para evitar solapamientos
    if (numWords >= 5) dynamicGridSize = Math.max(dynamicGridSize, 9);
    if (numWords >= 6) dynamicGridSize = Math.max(dynamicGridSize, 10);
    
    const gridSize = dynamicGridSize;
    gameState.currentGridSize = gridSize;
    
    console.log(`ðŸŽ¯ Grid dinÃ¡mico: ${gridSize}x${gridSize} (palabra mÃ¡s larga: ${maxWordLength}, palabras: ${numWords})`);
    
    
    // Actualizar CSS del grid
    gridContainer.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
    
    // Crear grid vacÃ­o (sin letras inicialmente)
    for (let i = 0; i < gridSize * gridSize; i++) {
        gameState.currentGrid.push('');
    }
    
    // Colocar palabras dinÃ¡micamente
    placeWordsInGrid(words, gridSize);
    
    // Rellenar celdas vacÃ­as con letras aleatorias
    fillEmptyCells();
    
    // Crear celdas en el DOM
    gameState.currentGrid.forEach((letter, index) => {
        const cell = document.createElement('div');
        cell.className = 'grid-cell';
        cell.textContent = letter;
        cell.dataset.index = index;
        cell.onclick = () => selectCell(index);
        
        gridContainer.appendChild(cell);
    });
    
    // Debug: Verificar que todas las palabras estÃ©n en el grid
    setTimeout(() => {
    debugWordPlacement();
    }, 100);
}

// FunciÃ³n de debug para verificar palabras en el grid
function debugWordPlacement() {
    console.log('ðŸ” === VERIFICACIÃ“N DE PALABRAS EN GRID ===');
    console.log('ðŸ“ Palabras que deberÃ­an estar:', gameState.currentWords);
    console.log('ðŸ“ Grid size:', Math.sqrt(gameState.currentGrid.length));
    
    gameState.currentWords.forEach(word => {
        console.log(`\nðŸ” Buscando "${word}" (${word.length} letras):`);
        
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
                            // Usar originalGrid si estÃ¡ disponible (para mecÃ¡nica de niebla), sino currentGrid
                            const letter = gameState.originalGrid && gameState.originalGrid[index] ? gameState.originalGrid[index] : gameState.currentGrid[index];
                            currentWord += letter;
                        } else {
                            valid = false;
                            break;
                        }
                    }
                    
                    if (valid && (currentWord === word || currentWord === word.split('').reverse().join(''))) {
                        console.log(`âœ… "${word}" encontrada en (${row + 1},${col + 1}) direcciÃ³n ${dir.name}`);
                        console.log(`   Palabra en grid: "${currentWord}"`);
                        console.log(`   PosiciÃ³n visual: fila ${row + 1}, columna ${col + 1}`);
                        found = true;
                    }
                });
            }
        }
        
        if (!found) {
            console.log(`âŒ "${word}" NO ENCONTRADA en el grid`);
        }
    });
    
    console.log('\nðŸ“Š Grid completo:');
    const gridSize = Math.sqrt(gameState.currentGrid.length);
    for (let row = 0; row < gridSize; row++) {
        let rowStr = '';
        for (let col = 0; col < gridSize; col++) {
            const index = row * gridSize + col;
            rowStr += gameState.currentGrid[index] + ' ';
        }
        console.log(`Fila ${row}: ${rowStr}`);
    }
    console.log('ðŸ” === FIN VERIFICACIÃ“N ===');
}
// Colocar palabras en el grid
function placeWordsInGrid(words, gridSize) {
    console.log(`ðŸŽ¯ Iniciando colocaciÃ³n de ${words.length} palabras en grid ${gridSize}x${gridSize}`);
    
    words.forEach((word, wordIndex) => {
        let placed = false;
        let attempts = 0;
        const maxAttempts = 200; // Aumentar intentos
        
        // Intentar todas las direcciones posibles para cada palabra
        const directions = [0, 1, 2, 3, 4, 5, 6, 7]; // 8 direcciones incluyendo reversa
        
        // Mejorar: intentar direcciones de forma mÃ¡s sistemÃ¡tica
        const shuffledDirections = [...directions].sort(() => Math.random() - 0.5);
        
        while (!placed && attempts < maxAttempts) {
            // Usar direcciÃ³n del array mezclado para mejor distribuciÃ³n
            const direction = shuffledDirections[attempts % 8];
            
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
            
            // Verificar que la palabra quepa en la direcciÃ³n seleccionada
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
                console.log(`ðŸ“ Palabra "${word}" colocada ${useReverse ? '(REVERSA)' : ''} en direcciÃ³n ${directionNames[actualDirection]} en posiciÃ³n (${startRow + 1},${startCol + 1})`);
                console.log(`   Palabra real colocada: "${actualWord}"`);
                console.log(`   PosiciÃ³n visual: fila ${startRow + 1}, columna ${startCol + 1}`);
                }
            
            attempts++;
        }
        
        // Si no se pudo colocar, intentar estrategias alternativas
        if (!placed) {
            console.log(`âš ï¸ Palabra "${word}" no se pudo colocar despuÃ©s de ${attempts} intentos`);
            
            // Estrategia 1: Intentar con posiciones mÃ¡s especÃ­ficas
            const specificPositions = [
                {row: 0, col: 0, dir: 0}, // Esquina superior izquierda, horizontal
                {row: 0, col: 0, dir: 1}, // Esquina superior izquierda, vertical
                {row: 1, col: 1, dir: 0}, // PosiciÃ³n interna, horizontal
                {row: 1, col: 1, dir: 1}, // PosiciÃ³n interna, vertical
            ];
            
            let specificPlaced = false;
            for (const pos of specificPositions) {
                if (tryPlaceAtSpecificPosition(word, pos.row, pos.col, pos.dir, gridSize)) {
                    specificPlaced = true;
                    console.log(`âœ… Palabra "${word}" colocada en posiciÃ³n especÃ­fica (${pos.row},${pos.col})`);
                    break;
                }
            }
            
            // Estrategia 2: Usar posiciÃ³n fija como Ãºltimo recurso
            if (!specificPlaced) {
                console.log(`ðŸ†˜ Usando posiciÃ³n fija para "${word}"`);
                placeWordFixed(word, wordIndex, gridSize);
            }
        }
    });
    
    // ValidaciÃ³n final: verificar que todas las palabras se colocaron
    console.log(`ðŸŽ¯ ColocaciÃ³n completada. Verificando ${words.length} palabras...`);
    let placedCount = 0;
    words.forEach(word => {
        if (isWordInGrid(word, gridSize)) {
            placedCount++;
        } else {
            console.error(`âŒ ERROR: Palabra "${word}" NO estÃ¡ en el grid despuÃ©s de la colocaciÃ³n`);
        }
    });
    
    if (placedCount === words.length) {
        console.log(`âœ… Todas las ${placedCount} palabras colocadas correctamente`);
    } else {
        console.error(`âš ï¸ Solo ${placedCount}/${words.length} palabras colocadas. Hay un problema en el algoritmo.`);
    }
}

// FunciÃ³n para verificar si una palabra estÃ¡ en el grid
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

// FunciÃ³n auxiliar para intentar colocar en posiciÃ³n especÃ­fica
function tryPlaceAtSpecificPosition(word, startRow, startCol, direction, gridSize) {
    const actualWord = word;
    const positions = [];
    let canPlace = true;
    
    // Verificar si cabe en la direcciÃ³n especificada
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
        
        // Verificar lÃ­mites
        if (row < 0 || row >= gridSize || col < 0 || col >= gridSize) {
            canPlace = false;
            break;
        }
        
        const index = row * gridSize + col;
        positions.push(index);
        
        // Verificar si la celda estÃ¡ ocupada por otra palabra
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

// Colocar palabra en posiciÃ³n fija como fallback
function placeWordFixed(word, wordIndex, gridSize) {
    // Solo usar posiciones fijas si la palabra no se pudo colocar
    
    // Intentar colocar en diferentes posiciones fijas
    // Ahora el grid es del tamaÃ±o correcto, todas las posiciones son vÃ¡lidas
    const fixedPositions = [
        { row: 0, col: 0, dir: 0 }, // Horizontal primera fila
        { row: 1, col: 0, dir: 1 }, // Vertical primera columna
        { row: 2, col: 0, dir: 0 }, // Horizontal tercera fila
        { row: 0, col: 2, dir: 1 }, // Vertical tercera columna
        { row: 3, col: 0, dir: 0 }, // Horizontal cuarta fila
        { row: 0, col: 4, dir: 1 }, // Vertical quinta columna
        { row: 4, col: 0, dir: 0 }, // Horizontal quinta fila
        { row: 0, col: 6, dir: 1 }, // Vertical sÃ©ptima columna
        { row: 0, col: 0, dir: 2 }, // Diagonal izquierda
        { row: 0, col: gridSize-1, dir: 3 } // Diagonal derecha
    ];
    
    let placed = false;
    for (let posIndex = 0; posIndex < fixedPositions.length && !placed; posIndex++) {
        const pos = fixedPositions[posIndex];
        let canPlace = true;
        
        // Verificar si se puede colocar en esta posiciÃ³n
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

// Rellenar celdas vacÃ­as con letras aleatorias
function fillEmptyCells() {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    
    for (let i = 0; i < gameState.currentGrid.length; i++) {
        if (!gameState.currentGrid[i] || gameState.currentGrid[i] === '') {
            gameState.currentGrid[i] = letters[Math.floor(Math.random() * letters.length)];
        }
    }
}

// Seleccionar celda
function selectCell(index) {
    const cell = document.querySelector(`[data-index="${index}"]`);
    
    // Cancelar timeout de limpieza automática si existe
    if (gameState.clearSelectionTimeout) {
        clearTimeout(gameState.clearSelectionTimeout);
        gameState.clearSelectionTimeout = null;
        console.log('🔄 Cancelando limpieza automática de selección');
    }
    
    // NO permitir seleccionar si el nivel ha expirado
    if (gameState.levelExpired) {
        showMessage('â° Nivel expirado. Usa "Limpiar SelecciÃ³n" para repetir.', 'error');
        return;
    }
    
    // NO revelar letras individuales con click - solo al completar palabras
    
    if (gameState.selectedCells.includes(index)) {
        // Deseleccionar celda si ya estÃ¡ seleccionada
        gameState.selectedCells = gameState.selectedCells.filter(i => i !== index);
        // AnimaciÃ³n sutil al deseleccionar
        cell.style.transform = 'scale(0.95)';
        setTimeout(() => {
            cell.style.transform = '';
        }, 150);
    } else {
        // AÃ±adir celda a la selecciÃ³n (en cualquier orden)
        gameState.selectedCells.push(index);
        // AnimaciÃ³n sutil al seleccionar
        cell.style.transform = 'scale(1.05)';
        setTimeout(() => {
            cell.style.transform = '';
        }, 150);
    }
    
    updateCellSelection();
    
    // Solo verificar palabras si tenemos al menos 2 celdas seleccionadas
    // Y solo si la selecciÃ³n forma una lÃ­nea recta vÃ¡lida
    if (gameState.selectedCells.length >= 2 && isValidWordSelection()) {
        checkForWord();
    }
}

// Verificar si la selecciÃ³n temporal forma una lÃ­nea recta
function isValidSelection(cells) {
    if (cells.length < 2) return true;
    
    const gridSize = Math.sqrt(gameState.currentGrid.length);
    const cellPositions = cells.map(index => ({
        index,
        row: Math.floor(index / gridSize),
        col: index % gridSize
    }));
    
    // Ordenar por posiciÃ³n
    cellPositions.sort((a, b) => {
        if (a.row !== b.row) return a.row - b.row;
        return a.col - b.col;
    });
    
    const first = cellPositions[0];
    const last = cellPositions[cellPositions.length - 1];
    
    // Calcular diferencias
    const deltaRow = last.row - first.row;
    const deltaCol = last.col - first.col;
    
    // Verificar si es horizontal (deltaRow = 0)
    if (deltaRow === 0) {
        return cellPositions.every((cell, i) => 
            cell.row === first.row && 
            cell.col === first.col + i
        );
    }
    
    // Verificar si es vertical (deltaCol = 0)
    if (deltaCol === 0) {
        return cellPositions.every((cell, i) => 
            cell.col === first.col && 
            cell.row === first.row + i
        );
    }
    
    // Verificar si es diagonal
    if (Math.abs(deltaRow) === Math.abs(deltaCol)) {
        const stepRow = deltaRow > 0 ? 1 : -1;
        const stepCol = deltaCol > 0 ? 1 : -1;
        
        return cellPositions.every((cell, i) => 
            cell.row === first.row + (i * stepRow) && 
            cell.col === first.col + (i * stepCol)
        );
    }
    
    return false;
}

// Validar que las celdas seleccionadas estÃ©n en lÃ­nea recta
function isValidWordSelection() {
    if (gameState.selectedCells.length < 2) return true;
    
    const gridSize = Math.sqrt(gameState.currentGrid.length);
    const cells = gameState.selectedCells.map(index => ({
        index,
        row: Math.floor(index / gridSize),
        col: index % gridSize
    }));
    
    // Ordenar celdas por posiciÃ³n
    cells.sort((a, b) => {
        if (a.row !== b.row) return a.row - b.row;
        return a.col - b.col;
    });
    
    // Verificar si estÃ¡n en lÃ­nea recta
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

// Ordenar celdas segÃºn la direcciÃ³n de la lÃ­nea recta
function sortCellsByDirection(cells) {
    if (cells.length < 2) return cells;
    
    // Ordenar primero por posiciÃ³n general
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

// Verificar automÃ¡ticamente si se formÃ³ una palabra
function checkForWord() {
    if (gameState.selectedCells.length < 2) return;
    
    // NO permitir encontrar palabras si el nivel ha expirado
    if (gameState.levelExpired) {
        showMessage('â° Nivel expirado. No se pueden encontrar mÃ¡s palabras.', 'error');
        return;
    }
    
    // Ya verificamos que es lÃ­nea recta antes de llamar esta funciÃ³n
    console.log('ðŸ” Verificando palabra con celdas:', gameState.selectedCells);
    
    // Ordenar celdas seleccionadas en el orden correcto de la lÃ­nea recta
    const gridSize = Math.sqrt(gameState.currentGrid.length);
    const cells = gameState.selectedCells.map(index => ({
        index,
        row: Math.floor(index / gridSize),
        col: index % gridSize
    }));
    
    // Determinar la direcciÃ³n de la lÃ­nea y ordenar apropiadamente
    const sortedCells = sortCellsByDirection(cells);
    
    // Crear palabra temporal para verificaciÃ³n (usando letras reales del grid original)
    const selectedWord = sortedCells
        .map(cell => {
            // Si la celda tiene niebla, usar la letra original para verificaciÃ³n
            if (gameState.currentGrid[cell.index] === '?') {
                return gameState.originalGrid[cell.index];
            }
            return gameState.currentGrid[cell.index];
        })
        .join('');
    
    const reverseWord = selectedWord.split('').reverse().join('');
    
    console.log(`ðŸ” Palabra formada: "${selectedWord}" (reversa: "${reverseWord}")`);
    console.log(`ðŸ” Celdas seleccionadas:`, gameState.selectedCells.map(i => `${i}(${gameState.currentGrid[i]})`).join(' '));
    
    // Verificar si la palabra estÃ¡ en la lista
    const foundWord = gameState.currentWords.find(word => 
        word === selectedWord || word === reverseWord
    );
    
    if (foundWord && !gameState.foundWords.includes(foundWord)) {
        // Verificar si la palabra expirÃ³ - BLOQUEAR si expirÃ³
        let isExpired = false;
        if (gameState.activeMechanics.includes('wordTimer') && gameState.wordTimers[foundWord] === 0) {
            isExpired = true;
            console.log(`â° Palabra "${foundWord}" expirada - BLOQUEANDO completaciÃ³n`);
            showMessage(`â° La palabra "${foundWord}" ha expirado. No se puede completar.`, 'error');
            // NO procesar la palabra si expirÃ³
            return;
        }
        
        // Palabra encontrada - revelar todas las celdas con niebla de la palabra
        gameState.foundWords.push(foundWord);
        
        // Calcular puntuaciÃ³n (reducida si expirÃ³)
        let scoreMultiplier = gameState.streak + 1;
        if (isExpired) {
            scoreMultiplier = Math.max(1, Math.floor(scoreMultiplier / 2)); // Reducir puntos si expirÃ³
        }
        
        gameState.score += foundWord.length * 100 * scoreMultiplier;
        gameState.streak++;
        
        // Animaciones
        const scoreElement = document.getElementById('score');
        const coinsElement = document.getElementById('coins');
        if (scoreElement) {
            animateScore(scoreElement, foundWord.length * 100 * scoreMultiplier);
        }
        if (coinsElement) {
            // No animar monedas por palabra individual
        }
        animateWordFound(foundWord);
        playSound('word'); // Sonido al encontrar palabra
        
        // Revelar celdas con niebla si hay mecÃ¡nica activa
        if (gameState.activeMechanics.includes('fog')) {
            gameState.selectedCells.forEach(index => {
                if (gameState.currentGrid[index] === '?') {
                    gameState.currentGrid[index] = gameState.originalGrid[index];
                    gameState.revealedCells.push(index);
                    
                    // Actualizar visualizaciÃ³n
                    const cell = document.querySelector(`[data-index="${index}"]`);
                    if (cell) {
                        cell.textContent = gameState.originalGrid[index];
                        cell.classList.remove('fog');
                    }
                }
            });
        }
        
        // Marcar celdas como encontradas con animaciÃ³n
        const foundCells = gameState.selectedCells.slice(); // Copia para usar en animaciÃ³n
        foundCells.forEach((index, i) => {
            const cell = document.querySelector(`[data-index="${index}"]`);
            cell.classList.add('found');
            // AnimaciÃ³n escalonada para cada celda
            setTimeout(() => {
                cell.style.transform = 'scale(1.2)';
                cell.style.backgroundColor = '#10b981';
                setTimeout(() => {
                    cell.style.transform = '';
                }, 200);
            }, i * 100);
        });
        
        // Mostrar mensaje (diferente si expirÃ³)
        if (isExpired) {
            showMessage(`Â¡Encontraste "${foundWord}"! (Tiempo expirado) +${foundWord.length * 100 * scoreMultiplier} puntos`, 'success');
        } else {
            showMessage(`Â¡Encontraste "${foundWord}"! +${foundWord.length * 100 * scoreMultiplier} puntos`, 'success');
        }
        
        // Limpiar selecciÃ³n
        gameState.selectedCells = [];
        updateCellSelection();
        updateHUD();
        updateWordsList();
        
        // Verificar si se completÃ³ el nivel
        if (gameState.foundWords.length === gameState.currentWords.length) {
            console.log('ðŸŽ¯ Nivel completado! Palabras encontradas:', gameState.foundWords.length, 'de', gameState.currentWords.length);
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
                
                // Esperar a que termine la animaciÃ³n antes de continuar
            setTimeout(() => {
                    console.log('ðŸ”„ Continuando al siguiente nivel...');
                    // Actualizar estado despuÃ©s de la animaciÃ³n
                    gameState.currentLevel++;
                    gameState.coins += 10;
                    console.log('ðŸ“Š Estado actualizado - Nivel:', gameState.currentLevel, 'Monedas:', gameState.coins);
                    // Resetear errores
                    gameState.foundWords = []; // Limpiar palabras encontradas
                    
                    // Guardar progreso segÃºn tipo de usuario
                    if (gameState.currentUser && gameState.currentUser.isGuest) {
            saveGuestProgress();
                    } else if (gameState.currentUser && !gameState.currentUser.isGuest) {
            saveUserProgress();
        }
        
        setTimeout(() => {
                        generateNextLevel();
                    }, 1000);
                }, 4500); // Esperar a que termine la animaciÃ³n del overlay (4s + 0.5s)
        }, 1000);
        }
    } else if (gameState.selectedCells.length >= 2) {
        // Palabra no válida - limpiar selección automáticamente después de un breve delay
        console.log(`âŒ Palabra no vÃ¡lida: ${selectedWord} o ${reverseWord}`);
        console.log('ðŸ“ Palabras disponibles:', gameState.currentWords);
        // Mostrar mensaje de error
        showMessage(`"${selectedWord}" no es una palabra válida`, 'error');
        
        // Limpiar selección después de un breve delay para que el usuario vea el error
        // Usar un ID único para poder cancelar el timeout si el usuario selecciona otra celda
        gameState.clearSelectionTimeout = setTimeout(() => {
            gameState.selectedCells = [];
            updateCellSelection();
            gameState.clearSelectionTimeout = null;
        }, 1500);
    }
}

// Actualizar selecciÃ³n visual
function updateCellSelection() {
    console.log('ðŸŽ¯ Actualizando selecciÃ³n visual:', gameState.selectedCells);
    document.querySelectorAll('.grid-cell').forEach((cell, index) => {
        cell.classList.remove('selected');
        // Comparar usando el dataset.index que es el Ã­ndice real
        const cellIndex = parseInt(cell.dataset.index);
        if (gameState.selectedCells.includes(cellIndex)) {
            cell.classList.add('selected');
            console.log(`âœ… Celda ${cellIndex} marcada como seleccionada`);
        }
    });
}

// Limpiar selecciÃ³n
function clearSelection() {
    console.log('ðŸ§¹ Limpiando selecciÃ³n...');
    gameState.selectedCells = [];
    updateCellSelection();
    
    // Si el nivel habÃ­a expirado, reiniciarlo con penalizaciÃ³n
    if (gameState.levelExpired) {
        console.log('ðŸ”„ Reiniciando nivel expirado...');
        gameState.failedAttempts++;
        
        // Reducir puntuaciÃ³n por cada intento fallido
        const penalty = gameState.failedAttempts * 100;
        gameState.score = Math.max(0, gameState.score - penalty);
        
        showMessage(`ðŸ”„ Reiniciando nivel... PenalizaciÃ³n: -${penalty} puntos (Intento ${gameState.failedAttempts})`, 'error');
        
        // Reiniciar el nivel
        setTimeout(() => {
            generateNextLevel(); // Esto aplicarÃ¡ las mecÃ¡nicas de nuevo
        }, 1500);
    } else {
        console.log('ðŸ§¹ SelecciÃ³n limpiada correctamente');
    }
}

// Confirmar selecciÃ³n
function submitSelection() {
    if (gameState.selectedCells.length < 2) {
        showMessage('Selecciona al menos 2 letras', 'error');
        return;
    }
    
    const selectedWord = gameState.selectedCells
        .map(index => gameState.currentGrid[index])
        .join('');
    
    const reverseWord = selectedWord.split('').reverse().join('');
    
    // Verificar si la palabra estÃ¡ en la lista
    const foundWord = gameState.currentWords.find(word => 
        word === selectedWord || word === reverseWord
    );
    
    if (foundWord && !gameState.foundWords.includes(foundWord)) {
        // Palabra encontrada
        gameState.foundWords.push(foundWord);
        gameState.score += foundWord.length * 100 * (gameState.streak + 1);
        gameState.streak++;
        
        // Marcar celdas como encontradas con animaciÃ³n
        const foundCells = gameState.selectedCells.slice(); // Copia para usar en animaciÃ³n
        foundCells.forEach((index, i) => {
            const cell = document.querySelector(`[data-index="${index}"]`);
            cell.classList.add('found');
            // AnimaciÃ³n escalonada para cada celda
            setTimeout(() => {
                cell.style.transform = 'scale(1.2)';
                cell.style.backgroundColor = '#10b981';
                setTimeout(() => {
                    cell.style.transform = '';
                }, 200);
            }, i * 100);
        });
        
        showMessage(`Â¡Encontraste "${foundWord}"! +${foundWord.length * 100} puntos`, 'success');
        playSound('word'); // Sonido al encontrar palabra
        
        // Verificar si se completÃ³ el nivel
        if (gameState.foundWords.length === gameState.currentWords.length) {
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
                
                // Esperar a que termine la animaciÃ³n antes de continuar
                setTimeout(() => {
                    // Actualizar estado despuÃ©s de la animaciÃ³n
                    gameState.currentLevel++;
                    gameState.coins += 10;
                    setTimeout(() => {
                        initGame();
                    }, 1000);
                }, 4500); // Esperar a que termine la animaciÃ³n del overlay
            }, 1000);
        }
    } else {
        // Palabra incorrecta
        gameState.streak = 0;
        showMessage(`"${selectedWord}" no es vÃ¡lida.`, 'error');
    }
    
    clearSelection();
    updateHUD();
    updateWordsList();
}
