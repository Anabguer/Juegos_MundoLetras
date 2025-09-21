import { LevelConfig, WordPlacement, ModName } from '../types';
import { PALABRAS_OCEANO, LETRAS_OCEANO } from '../data/palabras.oceano';
import { PALABRAS_BOSQUE, LETRAS_BOSQUE } from '../data/palabras.bosque';
import { CONFIG } from '../config';

// Mapeo de palabras por tema
const PALABRAS_POR_TEMA: Record<string, string[]> = {
  oceano: PALABRAS_OCEANO,
  bosque: PALABRAS_BOSQUE
};

const LETRAS_POR_TEMA: Record<string, Record<string, number>> = {
  oceano: LETRAS_OCEANO,
  bosque: LETRAS_BOSQUE
};

// PRNG simple basado en seed
class SeededRandom {
  private seed: number;

  constructor(seed: string) {
    this.seed = this.hashCode(seed);
  }

  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  nextInt(max: number): number {
    return Math.floor(this.next() * max);
  }

  shuffle<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = this.nextInt(i + 1);
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}

// Determinar dimensiones del grid según el nivel
function getGridDimensions(levelId: number): { rows: number; cols: number } {
  const progression = CONFIG.GAME.GRID_PROGRESSION;
  
  if (levelId <= 20) return progression['1-20'];
  if (levelId <= 60) return progression['21-60'];
  if (levelId <= 120) return progression['61-120'];
  if (levelId <= 300) return progression['121-300'];
  if (levelId <= 700) return progression['301-700'];
  return progression['701-1000'];
}

// Determinar modificadores según el nivel
function getModificadores(levelId: number, rng: SeededRandom): ModName[] {
  const mods: ModName[] = [];
  
  // Progresión gradual de mecánicas
  if (levelId <= 5) {
    // Solo básico
    return mods;
  }
  
  if (levelId <= 10) {
    // Introducir reversas
    if (levelId >= 6) mods.push('señuelos');
    return mods;
  }
  
  if (levelId <= 20) {
    // Añadir diagonales y mecánicas suaves
    mods.push('señuelos');
    if (levelId >= 15 && rng.next() < 0.3) mods.push('niebla');
    if (levelId >= 18 && rng.next() < 0.2) mods.push('fantasma');
    return mods;
  }
  
  if (levelId <= 60) {
    // Introducir todas las mecánicas
    mods.push('señuelos');
    if (rng.next() < 0.4) mods.push('niebla');
    if (rng.next() < 0.3) mods.push('fantasma');
    if (levelId >= 30 && rng.next() < 0.2) mods.push('palabra_meta');
    if (levelId >= 40 && rng.next() < 0.15) mods.push('timer_dinamico');
    return mods;
  }
  
  // Niveles avanzados: rotación completa
  mods.push('señuelos');
  if (rng.next() < 0.6) mods.push('niebla');
  if (rng.next() < 0.5) mods.push('fantasma');
  if (rng.next() < 0.4) mods.push('palabra_meta');
  if (rng.next() < 0.3) mods.push('timer_dinamico');
  
  return mods;
}

// Seleccionar palabras apropiadas para el nivel
function selectWords(tema: string, targetCount: number, gridSize: number, rng: SeededRandom): string[] {
  const availableWords = PALABRAS_POR_TEMA[tema] || PALABRAS_OCEANO;
  const maxLength = Math.min(gridSize - 1, 12);
  
  // Filtrar palabras por longitud apropiada
  const suitableWords = availableWords.filter(word => 
    word.length >= 3 && word.length <= maxLength
  );
  
  // Balancear longitudes
  const shortWords = suitableWords.filter(w => w.length <= 5);
  const mediumWords = suitableWords.filter(w => w.length >= 6 && w.length <= 8);
  const longWords = suitableWords.filter(w => w.length >= 9);
  
  const selected: string[] = [];
  const targetShort = Math.ceil(targetCount * 0.4);
  const targetMedium = Math.ceil(targetCount * 0.4);
  const targetLong = targetCount - targetShort - targetMedium;
  
  // Seleccionar palabras balanceadas
  selected.push(...rng.shuffle(shortWords).slice(0, targetShort));
  selected.push(...rng.shuffle(mediumWords).slice(0, targetMedium));
  selected.push(...rng.shuffle(longWords).slice(0, targetLong));
  
  // Completar si faltan
  if (selected.length < targetCount) {
    const remaining = rng.shuffle(suitableWords.filter(w => !selected.includes(w)));
    selected.push(...remaining.slice(0, targetCount - selected.length));
  }
  
  return selected.slice(0, targetCount);
}

// Intentar colocar una palabra en el grid
function tryPlaceWord(
  grid: string[][],
  word: string,
  rows: number,
  cols: number,
  allowDiagonals: boolean,
  allowReverse: boolean,
  rng: SeededRandom
): WordPlacement | null {
  const directions: Array<{ dir: 'H' | 'V' | 'D1' | 'D2', dx: number, dy: number }> = [
    { dir: 'H', dx: 1, dy: 0 },   // Horizontal
    { dir: 'V', dx: 0, dy: 1 }    // Vertical
  ];
  
  if (allowDiagonals) {
    directions.push(
      { dir: 'D1', dx: 1, dy: 1 },   // Diagonal \
      { dir: 'D2', dx: 1, dy: -1 }   // Diagonal /
    );
  }
  
  const reverseOptions = allowReverse ? [false, true] : [false];
  const attempts: Array<{
    startRow: number;
    startCol: number;
    direction: typeof directions[0];
    reverse: boolean;
  }> = [];
  
  // Generar todas las posibles posiciones
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      for (const direction of directions) {
        for (const reverse of reverseOptions) {
          attempts.push({ startRow: row, startCol: col, direction, reverse });
        }
      }
    }
  }
  
  // Barajar intentos
  const shuffledAttempts = rng.shuffle(attempts);
  
  for (const attempt of shuffledAttempts) {
    const { startRow, startCol, direction, reverse } = attempt;
    const wordToPlace = reverse ? word.split('').reverse().join('') : word;
    
    // Verificar si la palabra cabe
    const endRow = startRow + direction.dy * (word.length - 1);
    const endCol = startCol + direction.dx * (word.length - 1);
    
    if (endRow < 0 || endRow >= rows || endCol < 0 || endCol >= cols) {
      continue;
    }
    
    // Verificar conflictos
    let canPlace = true;
    const positions: Array<{ row: number; col: number }> = [];
    
    for (let i = 0; i < word.length; i++) {
      const currentRow = startRow + direction.dy * i;
      const currentCol = startCol + direction.dx * i;
      const currentLetter = wordToPlace[i];
      
      positions.push({ row: currentRow, col: currentCol });
      
      const existingLetter = grid[currentRow][currentCol];
      if (existingLetter !== '' && existingLetter !== currentLetter) {
        canPlace = false;
        break;
      }
    }
    
    if (canPlace) {
      // Colocar la palabra
      for (let i = 0; i < word.length; i++) {
        const currentRow = startRow + direction.dy * i;
        const currentCol = startCol + direction.dx * i;
        grid[currentRow][currentCol] = wordToPlace[i];
      }
      
      return {
        word,
        startRow,
        startCol,
        direction: direction.dir,
        reverse,
        positions
      };
    }
  }
  
  return null;
}

// Rellenar celdas vacías con letras temáticas
function fillEmptyCells(grid: string[][], tema: string, rng: SeededRandom): void {
  const letterFreq = LETRAS_POR_TEMA[tema] || LETRAS_OCEANO;
  const letters = Object.keys(letterFreq);
  const weights = Object.values(letterFreq);
  
  // Crear distribución acumulativa
  const cumulative: number[] = [];
  let sum = 0;
  for (const weight of weights) {
    sum += weight;
    cumulative.push(sum);
  }
  
  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[row].length; col++) {
      if (grid[row][col] === '') {
        // Seleccionar letra según distribución
        const rand = rng.next();
        let selectedLetter = 'A';
        
        for (let i = 0; i < cumulative.length; i++) {
          if (rand <= cumulative[i]) {
            selectedLetter = letters[i];
            break;
          }
        }
        
        grid[row][col] = selectedLetter;
      }
    }
  }
}

// Función principal para generar un nivel
export function generateLevel(
  levelId: number,
  tema: string,
  seed: string
): LevelConfig {
  const rng = new SeededRandom(seed);
  const { rows, cols } = getGridDimensions(levelId);
  
  // Determinar configuración del grid
  const allowDiagonals = levelId >= 11;
  const allowReverse = levelId >= 6;
  
  // Determinar número de palabras según tamaño del grid
  const targetWordCount = Math.min(8, Math.max(4, Math.floor((rows * cols) / 12)));
  
  // Seleccionar palabras
  const palabras = selectWords(tema, targetWordCount, Math.max(rows, cols), rng);
  
  // Crear grid vacío
  const grid: string[][] = Array(rows).fill(null).map(() => Array(cols).fill(''));
  
  // Colocar palabras
  const placements: WordPlacement[] = [];
  for (const palabra of palabras) {
    const placement = tryPlaceWord(grid, palabra, rows, cols, allowDiagonals, allowReverse, rng);
    if (placement) {
      placements.push(placement);
    }
  }
  
  // Rellenar celdas vacías
  fillEmptyCells(grid, tema, rng);
  
  // Determinar modificadores
  const modificadores = getModificadores(levelId, rng);
  
  // Configurar tiempo y errores
  let tiempoSeg: number | null = null;
  let erroresMax: number | null = 10;
  let vidas = 1;
  
  if (levelId >= 20 && (modificadores.includes('timer_dinamico') || rng.next() < 0.3)) {
    // Nivel con tiempo
    tiempoSeg = Math.max(90, 180 - Math.floor(levelId / 10) * 5);
    erroresMax = null;
    vidas = 3;
  } else {
    // Nivel sin tiempo
    erroresMax = Math.max(5, 15 - Math.floor(levelId / 20));
  }
  
  // Calcular recompensas
  const baseCoins = 10 + Math.floor(levelId / 10) * 2;
  const recompensas = { monedas: baseCoins };
  
  return {
    id: levelId,
    tema,
    grid: { rows, cols, diagonales: allowDiagonals, reversas: allowReverse },
    palabras: placements.map(p => p.word),
    modificadores,
    tiempoSeg,
    erroresMax,
    vidas,
    seed,
    recompensas
  };
}
