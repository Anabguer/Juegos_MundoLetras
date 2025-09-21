import { CharGrid, CellState, WordPlacement, GameState, LevelConfig } from '../types';

// Crear estado inicial del grid
export function createInitialGrid(config: LevelConfig): CellState[][] {
  const { rows, cols } = config.grid;
  
  // Generar el grid con el algoritmo
  const generatedGrid = generateGridFromConfig(config);
  
  // Convertir a CellState
  const cellGrid: CellState[][] = [];
  for (let row = 0; row < rows; row++) {
    cellGrid[row] = [];
    for (let col = 0; col < cols; col++) {
      cellGrid[row][col] = {
        letter: generatedGrid[row][col],
        revealed: !config.modificadores.includes('niebla'),
        isWordPart: false,
        isFoggy: config.modificadores.includes('niebla'),
        isGhost: config.modificadores.includes('fantasma') && Math.random() < 0.2,
        ghostTimer: undefined
      };
    }
  }
  
  return cellGrid;
}

// Generar grid básico desde configuración (simplificado para MVP)
function generateGridFromConfig(config: LevelConfig): string[][] {
  // Por ahora, usar un generador simple
  // En producción, esto usaría el algoritmo completo de generateLevel.ts
  const { rows, cols } = config.grid;
  const grid: string[][] = Array(rows).fill(null).map(() => Array(cols).fill(''));
  
  // Rellenar con letras aleatorias por ahora
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      grid[row][col] = letters[Math.floor(Math.random() * letters.length)];
    }
  }
  
  return grid;
}

// Verificar si una selección forma una palabra válida
export function checkWordSelection(
  grid: CellState[][],
  selectedCells: Array<{ row: number; col: number }>,
  validWords: string[]
): string | null {
  if (selectedCells.length < 2) return null;
  
  // Construir palabra desde las celdas seleccionadas
  const word = selectedCells.map(cell => grid[cell.row][cell.col].letter).join('');
  const reverseWord = word.split('').reverse().join('');
  
  // Verificar si la palabra está en la lista
  if (validWords.includes(word)) return word;
  if (validWords.includes(reverseWord)) return reverseWord;
  
  return null;
}

// Verificar si la selección es válida (línea recta)
export function isValidSelection(selectedCells: Array<{ row: number; col: number }>): boolean {
  if (selectedCells.length < 2) return true;
  
  const first = selectedCells[0];
  const second = selectedCells[1];
  
  const deltaRow = second.row - first.row;
  const deltaCol = second.col - first.col;
  
  // Normalizar dirección
  const stepRow = deltaRow === 0 ? 0 : deltaRow / Math.abs(deltaRow);
  const stepCol = deltaCol === 0 ? 0 : deltaCol / Math.abs(deltaCol);
  
  // Verificar que todas las celdas siguen la misma dirección
  for (let i = 1; i < selectedCells.length; i++) {
    const expected = {
      row: first.row + stepRow * i,
      col: first.col + stepCol * i
    };
    
    if (selectedCells[i].row !== expected.row || selectedCells[i].col !== expected.col) {
      return false;
    }
  }
  
  return true;
}

// Revelar celda (para mecánica de niebla)
export function revealCell(grid: CellState[][], row: number, col: number): void {
  if (grid[row] && grid[row][col]) {
    grid[row][col].revealed = true;
    grid[row][col].isFoggy = false;
  }
}

// Aplicar efecto fantasma
export function applyGhostEffect(grid: CellState[][]): void {
  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[row].length; col++) {
      const cell = grid[row][col];
      if (cell.isGhost) {
        // Alternar visibilidad cada 300-500ms
        if (!cell.ghostTimer) {
          cell.ghostTimer = Date.now();
        }
        
        const elapsed = Date.now() - cell.ghostTimer;
        const cycle = 800; // 800ms cycle
        const visible = (elapsed % cycle) < (cycle / 2);
        
        cell.revealed = visible || !cell.isFoggy;
      }
    }
  }
}

// Marcar palabra como encontrada
export function markWordFound(
  grid: CellState[][],
  wordPositions: Array<{ row: number; col: number }>,
  isMetaWord: boolean = false
): void {
  for (const pos of wordPositions) {
    if (grid[pos.row] && grid[pos.row][pos.col]) {
      grid[pos.row][pos.col].isWordPart = true;
      grid[pos.row][pos.col].revealed = true;
      grid[pos.row][pos.col].isFoggy = false;
    }
  }
}

// Verificar si el nivel está completo
export function isLevelComplete(remainingWords: string[]): boolean {
  return remainingWords.length === 0;
}

// Verificar si el juego ha terminado (por tiempo o errores)
export function isGameOver(
  timeRemaining: number | null,
  errorsCount: number,
  maxErrors: number | null,
  lives: number
): boolean {
  if (timeRemaining !== null && timeRemaining <= 0 && lives <= 0) {
    return true;
  }
  
  if (maxErrors !== null && errorsCount >= maxErrors) {
    return true;
  }
  
  return false;
}

// Aplicar modificador de tiempo dinámico
export function applyTimerModifier(
  currentTime: number,
  isCorrect: boolean,
  config: { addOnCorrect: number; subtractOnError: number }
): number {
  if (isCorrect) {
    return currentTime + config.addOnCorrect;
  } else {
    return Math.max(0, currentTime - config.subtractOnError);
  }
}

// Obtener pista para una palabra
export function getWordHint(
  grid: CellState[][],
  word: string,
  wordPositions: Array<{ row: number; col: number }>
): Array<{ row: number; col: number }> {
  // Devolver primera y última posición de la palabra
  if (wordPositions.length >= 2) {
    return [wordPositions[0], wordPositions[wordPositions.length - 1]];
  }
  return wordPositions;
}

// Revelar una letra aleatoria de una palabra
export function revealRandomLetter(
  grid: CellState[][],
  wordPositions: Array<{ row: number; col: number }>
): { row: number; col: number } | null {
  const hiddenPositions = wordPositions.filter(pos => 
    !grid[pos.row][pos.col].revealed || grid[pos.row][pos.col].isFoggy
  );
  
  if (hiddenPositions.length === 0) return null;
  
  const randomPos = hiddenPositions[Math.floor(Math.random() * hiddenPositions.length)];
  revealCell(grid, randomPos.row, randomPos.col);
  
  return randomPos;
}
