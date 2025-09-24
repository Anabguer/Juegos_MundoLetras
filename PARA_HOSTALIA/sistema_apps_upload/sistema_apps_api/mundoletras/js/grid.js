// Inicializar juego
async function initGame() {
    // Cargar progreso según tipo de usuario
    if (gameState.currentUser && gameState.currentUser.isGuest) {
        // Invitado: cargar de localStorage
        loadGuestProgress();
    } else if (gameState.currentUser && !gameState.currentUser.isGuest) {
        // Usuario registrado: cargar de BBDD
        await loadUserProgress();
    }
    
    // Configurar palabras del nivel actual
    gameState.currentWords = getLevelWords(gameState.currentLevel);
    
    // El grid ahora es dinámico basado en las palabras, no fijo por nivel
    // CONFIG.GRID_SIZE ya no se usa - se calcula dinámicamente
    
    // Ocultar botón de reiniciar progreso (no disponible para invitados)
    const clearProgressBtn = document.getElementById('clear-progress-btn');
    if (clearProgressBtn) {
        clearProgressBtn.style.display = 'none';
    }
    
    // Actualizar información del usuario
    updateUserInfo();
    
    generateGrid();
    updateHUD();
    
    // Generar y aplicar mecánicas aleatorias DESPUÉS de generar el grid
    const randomMechanics = generateRandomMechanics(gameState.currentLevel);
    applyMechanics(randomMechanics);
    
    // Actualizar lista de palabras DESPUÉS de aplicar mecánicas
    updateWordsList();
    
    // Aplicar mecánicas visuales después de inicializar el juego
    setTimeout(() => {
        applyVisualMechanics();
    }, 200);
}

// Generar siguiente nivel
function generateNextLevel() {
    
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
    
    // Cambiar palabras según el nivel
    const levelWords = getLevelWords(gameState.currentLevel);
    gameState.currentWords = levelWords;
    
    // La dificultad ahora se maneja con el número y tipo de palabras, no con grid fijo
    // El grid se calcula dinámicamente basado en las palabras seleccionadas
    
    generateGrid();
    updateHUD();
    
    // Generar y aplicar mecánicas aleatorias DESPUÉS de generar el grid
    const randomMechanics = generateRandomMechanics(gameState.currentLevel);
    applyMechanics(randomMechanics);
    
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
        cell.onclick = () => selectCell(index);
        
        gridContainer.appendChild(cell);
    });
    
}

// Colocar palabras en el grid
function placeWordsInGrid(words, gridSize) {
    
    words.forEach((word, wordIndex) => {
        let placed = false;
        let attempts = 0;
        const maxAttempts = 200; // Aumentar intentos
        
        // Intentar todas las direcciones posibles para cada palabra
        const directions = [0, 1, 2, 3, 4, 5, 6, 7]; // 8 direcciones incluyendo reversa
        
        // Mejorar: intentar direcciones de forma más sistemática
        const shuffledDirections = [...directions].sort(() => Math.random() - 0.5);
        
        while (!placed && attempts < maxAttempts) {
            // Usar dirección del array mezclado para mejor distribución
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
        
        // Si no se pudo colocar, intentar estrategias alternativas
        if (!placed) {
            
            // Estrategia 1: Intentar con posiciones más especí­ficas
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
    words.forEach(word => {
        if (isWordInGrid(word, gridSize)) {
            placedCount++;
        } else {
        }
    });
    
    if (placedCount === words.length) {
    } else {
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
function selectCell(index) {
    const cell = document.querySelector(`[data-index="${index}"]`);
    
    // Cancelar timeout de limpieza automática si existe
    if (gameState.clearSelectionTimeout) {
        clearTimeout(gameState.clearSelectionTimeout);
        gameState.clearSelectionTimeout = null;
    }
    
    // NO permitir seleccionar si el nivel ha expirado
    if (gameState.levelExpired) {
        showMessage('⏰ Nivel expirado. Usa "Limpiar Selección" para repetir.', 'error');
        return;
    }
    
    // NO revelar letras individuales con click - solo al completar palabras
    
    if (gameState.selectedCells.includes(index)) {
        // Deseleccionar celda si ya está seleccionada
        gameState.selectedCells = gameState.selectedCells.filter(i => i !== index);
        // Animación sutil al deseleccionar
        cell.style.transform = 'scale(0.95)';
        setTimeout(() => {
            cell.style.transform = '';
        }, 150);
    } else {
        // Añadir celda a la selección (en cualquier orden)
        gameState.selectedCells.push(index);
        // Animación sutil al seleccionar
        cell.style.transform = 'scale(1.05)';
        setTimeout(() => {
            cell.style.transform = '';
        }, 150);
    }
    
    updateCellSelection();
    
    // Solo verificar palabras si tenemos al menos 2 celdas seleccionadas
    // Y solo si la selección forma una lí­nea recta válida
    if (gameState.selectedCells.length >= 2 && isValidWordSelection()) {
        checkForWord();
    }
}

// Verificar si la selección temporal forma una lí­nea recta
function isValidSelection(cells) {
    if (cells.length < 2) return true;
    
    const gridSize = Math.sqrt(gameState.currentGrid.length);
    const cellPositions = cells.map(index => ({
        index,
        row: Math.floor(index / gridSize),
        col: index % gridSize
    }));
    
    // Ordenar por posición
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
    
    
    // Verificar si la palabra está en la lista
    const foundWord = gameState.currentWords.find(word => 
        word === selectedWord || word === reverseWord
    );
    
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
        
        // Calcular puntuación
        const scoreMultiplier = gameState.streak + 1;
        
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
        
        // Revelar celdas con niebla si hay mecánica activa
        if (gameState.activeMechanics.includes('fog')) {
            gameState.selectedCells.forEach(index => {
                if (gameState.currentGrid[index] === '?') {
                    gameState.currentGrid[index] = gameState.originalGrid[index];
                    gameState.revealedCells.push(index);
                    
                    // Actualizar visualización
                    const cell = document.querySelector(`[data-index="${index}"]`);
                    if (cell) {
                        cell.textContent = gameState.originalGrid[index];
                        cell.classList.remove('fog');
                    }
                }
            });
        }
        
        // Marcar celdas como encontradas con animación
        const foundCells = gameState.selectedCells.slice(); // Copia para usar en animación
        foundCells.forEach((index, i) => {
            const cell = document.querySelector(`[data-index="${index}"]`);
            cell.classList.add('found');
            // Animación escalonada para cada celda
            setTimeout(() => {
                cell.style.transform = 'scale(1.2)';
                cell.style.backgroundColor = '#10b981';
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
        if (gameState.foundWords.length === gameState.currentWords.length) {
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
                
                // Esperar a que termine la animación antes de continuar
            setTimeout(() => {
                    // Actualizar estado después de la animación
                    gameState.currentLevel++;
                    gameState.coins += 10;
                    // Resetear errores
                    gameState.foundWords = []; // Limpiar palabras encontradas
                    
                    // Guardar progreso según tipo de usuario
                    if (gameState.currentUser && gameState.currentUser.isGuest) {
            saveGuestProgress();
                    } else if (gameState.currentUser && !gameState.currentUser.isGuest) {
            saveUserProgress();
        }
        
        setTimeout(() => {
                        generateNextLevel();
                    }, 1000);
                }, 4500); // Esperar a que termine la animación del overlay (4s + 0.5s)
        }, 1000);
        }
    } else if (gameState.selectedCells.length >= 2) {
        // Palabra no válida - limpiar selección automáticamente después de un breve delay
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

// Actualizar selección visual
function updateCellSelection() {
    document.querySelectorAll('.grid-cell').forEach((cell, index) => {
        cell.classList.remove('selected');
        // Comparar usando el dataset.index que es el Í­ndice real
        const cellIndex = parseInt(cell.dataset.index);
        if (gameState.selectedCells.includes(cellIndex)) {
            cell.classList.add('selected');
        }
    });
}

// Limpiar selección
function clearSelection() {
    gameState.selectedCells = [];
    updateCellSelection();
    
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
    
    // Verificar si la palabra está en la lista
    const foundWord = gameState.currentWords.find(word => 
        word === selectedWord || word === reverseWord
    );
    
    if (foundWord && !gameState.foundWords.includes(foundWord)) {
        // Palabra encontrada
        gameState.foundWords.push(foundWord);
        gameState.score += foundWord.length * 100 * (gameState.streak + 1);
        gameState.streak++;
        
        // Marcar celdas como encontradas con animación
        const foundCells = gameState.selectedCells.slice(); // Copia para usar en animación
        foundCells.forEach((index, i) => {
            const cell = document.querySelector(`[data-index="${index}"]`);
            cell.classList.add('found');
            // Animación escalonada para cada celda
            setTimeout(() => {
                cell.style.transform = 'scale(1.2)';
                cell.style.backgroundColor = '#10b981';
                setTimeout(() => {
                    cell.style.transform = '';
                }, 200);
            }, i * 100);
        });
        
        showMessage(`Encontraste "${foundWord}"! +${foundWord.length * 100} puntos`, 'success');
        playSound('word'); // Sonido al encontrar palabra
        
        // Verificar si se completó el nivel
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
                
                // Esperar a que termine la animación antes de continuar
                setTimeout(() => {
                    // Actualizar estado después de la animación
                    gameState.currentLevel++;
                    gameState.coins += 10;
                    setTimeout(() => {
                        initGame();
                    }, 1000);
                }, 4500); // Esperar a que termine la animación del overlay
            }, 1000);
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


