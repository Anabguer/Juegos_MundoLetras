import { create } from 'zustand';
import { LevelConfig, CellState, GameState, UserAuth, UserProgress, ScoreEntry, BoosterType } from '../types';
import { 
  createInitialGrid, 
  checkWordSelection, 
  isValidSelection, 
  revealCell,
  markWordFound,
  isLevelComplete,
  isGameOver,
  applyTimerModifier,
  getWordHint,
  revealRandomLetter
} from './gameLogic';
import { scoreWord, calculateLevelScore, calculateStars, calculateCoinsEarned } from './score';
import { generateLevel } from '../gen/generateLevel';
import { LEVEL_SEEDS, generateSeed } from '../data/seeds';
import { CONFIG } from '../config';

// Estado del usuario
interface UserState {
  isAuthenticated: boolean;
  user: UserAuth | null;
  progress: UserProgress | null;
  isGuest: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  loginGuest: () => void;
  logout: () => void;
  register: (email: string, password: string, nombre: string) => Promise<boolean>;
  verifyCode: (code: string) => Promise<boolean>;
  syncProgress: () => Promise<void>;
}

// Estado del juego
interface GamePlayState {
  // Configuración del nivel
  currentLevel: LevelConfig | null;
  grid: CellState[][];
  
  // Estado del juego
  gameState: GameState;
  selectedCells: Array<{ row: number; col: number }>;
  
  // Progreso
  remainingWords: string[];
  foundWords: Array<{ word: string; timeFound: number; isMetaWord: boolean }>;
  
  // Puntuación y estadísticas
  score: number;
  streak: number;
  errorsCount: number;
  lives: number;
  
  // Tiempo
  timeRemaining: number | null;
  startTime: number;
  
  // Boosters y monedas
  coins: number;
  boosters: Record<BoosterType, number>;
  
  // Acciones
  loadLevel: (levelId: number) => void;
  startGame: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  selectCell: (row: number, col: number) => void;
  clearSelection: () => void;
  submitSelection: () => void;
  useBooster: (type: BoosterType) => boolean;
  tick: () => void; // Para el timer
  restartLevel: () => void;
  nextLevel: () => void;
}

// Store del usuario
export const useUserStore = create<UserState>((set, get) => ({
  isAuthenticated: false,
  user: null,
  progress: null,
  isGuest: true,
  
  login: async (email: string, password: string) => {
    try {
      // TODO: Implementar llamada a API
      const response = await fetch(`${CONFIG.API_BASE_URL}auth.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', email, password })
      });
      
      const data = await response.json();
      
      if (data.success) {
        set({
          isAuthenticated: true,
          user: data.user,
          progress: data.progress,
          isGuest: false
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error en login:', error);
      return false;
    }
  },
  
  loginGuest: () => {
    // Cargar progreso local
    const savedProgress = localStorage.getItem(CONFIG.STORAGE.PROGRESS_KEY);
    const progress = savedProgress ? JSON.parse(savedProgress) : {
      usuario_aplicacion_key: 'guest_' + Date.now(),
      nivel_max: 1,
      monedas: 50,
      actualizado_at: new Date().toISOString()
    };
    
    set({
      isAuthenticated: true,
      user: null,
      progress,
      isGuest: true
    });
  },
  
  logout: () => {
    set({
      isAuthenticated: false,
      user: null,
      progress: null,
      isGuest: true
    });
  },
  
  register: async (email: string, password: string, nombre: string) => {
    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}auth.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'register', 
          email, 
          password, 
          nombre,
          app_codigo: CONFIG.APP_CODIGO
        })
      });
      
      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('Error en registro:', error);
      return false;
    }
  },
  
  verifyCode: async (code: string) => {
    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}auth.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify', code })
      });
      
      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('Error en verificación:', error);
      return false;
    }
  },
  
  syncProgress: async () => {
    const { user, isGuest } = get();
    if (isGuest || !user) return;
    
    try {
      // TODO: Implementar sincronización
      console.log('Sincronizando progreso...');
    } catch (error) {
      console.error('Error sincronizando:', error);
    }
  }
}));

// Store del juego
export const useGameStore = create<GamePlayState>((set, get) => ({
  // Estado inicial
  currentLevel: null,
  grid: [],
  gameState: 'INIT',
  selectedCells: [],
  remainingWords: [],
  foundWords: [],
  score: 0,
  streak: 0,
  errorsCount: 0,
  lives: 3,
  timeRemaining: null,
  startTime: 0,
  coins: 50,
  boosters: {
    pista: 3,
    revelar_letra: 2,
    quitar_niebla: 1
  },
  
  loadLevel: (levelId: number) => {
    // Buscar configuración del nivel
    const seedData = LEVEL_SEEDS.find(s => s.id === levelId) || {
      id: levelId,
      tema: 'oceano',
      seed: generateSeed(levelId, 'oceano'),
      dificultad: 'medium' as const
    };
    
    // Generar nivel
    const level = generateLevel(levelId, seedData.tema, seedData.seed);
    const grid = createInitialGrid(level);
    
    set({
      currentLevel: level,
      grid,
      gameState: 'READY',
      selectedCells: [],
      remainingWords: [...level.palabras],
      foundWords: [],
      score: 0,
      streak: 0,
      errorsCount: 0,
      lives: level.vidas,
      timeRemaining: level.tiempoSeg,
      startTime: Date.now()
    });
  },
  
  startGame: () => {
    set({ gameState: 'RUNNING', startTime: Date.now() });
  },
  
  pauseGame: () => {
    const { gameState } = get();
    if (gameState === 'RUNNING') {
      set({ gameState: 'PAUSED' });
    }
  },
  
  resumeGame: () => {
    const { gameState } = get();
    if (gameState === 'PAUSED') {
      set({ gameState: 'RUNNING' });
    }
  },
  
  selectCell: (row: number, col: number) => {
    const { selectedCells, grid, gameState } = get();
    if (gameState !== 'RUNNING') return;
    
    const newCell = { row, col };
    const isAlreadySelected = selectedCells.some(cell => 
      cell.row === row && cell.col === col
    );
    
    if (isAlreadySelected) {
      // Deseleccionar desde esta celda hacia adelante
      const index = selectedCells.findIndex(cell => 
        cell.row === row && cell.col === col
      );
      set({ selectedCells: selectedCells.slice(0, index + 1) });
    } else {
      // Añadir nueva celda si la selección sigue siendo válida
      const newSelection = [...selectedCells, newCell];
      if (isValidSelection(newSelection)) {
        // Revelar celda si está con niebla
        revealCell(grid, row, col);
        set({ selectedCells: newSelection, grid: [...grid] });
      }
    }
  },
  
  clearSelection: () => {
    set({ selectedCells: [] });
  },
  
  submitSelection: () => {
    const { 
      selectedCells, 
      grid, 
      remainingWords, 
      foundWords, 
      score, 
      streak, 
      errorsCount,
      currentLevel,
      timeRemaining,
      lives
    } = get();
    
    if (selectedCells.length < 2 || !currentLevel) return;
    
    const foundWord = checkWordSelection(grid, selectedCells, remainingWords);
    
    if (foundWord) {
      // Palabra encontrada
      const isMetaWord = currentLevel.modificadores.includes('palabra_meta') && Math.random() < 0.1;
      const wordScore = scoreWord(foundWord.length, streak) * (isMetaWord ? 3 : 1);
      const newStreak = streak + 1;
      
      // Marcar palabra en el grid
      markWordFound(grid, selectedCells, isMetaWord);
      
      // Actualizar estado
      const newRemainingWords = remainingWords.filter(w => w !== foundWord);
      const newFoundWords = [...foundWords, { 
        word: foundWord, 
        timeFound: Date.now(),
        isMetaWord 
      }];
      
      // Aplicar modificador de tiempo dinámico
      let newTimeRemaining = timeRemaining;
      if (currentLevel.modificadores.includes('timer_dinamico') && timeRemaining !== null) {
        newTimeRemaining = applyTimerModifier(timeRemaining, true, { 
          addOnCorrect: 5, 
          subtractOnError: 0 
        });
      }
      
      set({
        grid: [...grid],
        selectedCells: [],
        remainingWords: newRemainingWords,
        foundWords: newFoundWords,
        score: score + wordScore,
        streak: newStreak,
        timeRemaining: newTimeRemaining
      });
      
      // Verificar si el nivel está completo
      if (isLevelComplete(newRemainingWords)) {
        set({ gameState: 'COMPLETE_WIN' });
      }
    } else {
      // Error
      const newErrorsCount = errorsCount + 1;
      const newStreak = 0;
      
      // Aplicar modificador de tiempo dinámico
      let newTimeRemaining = timeRemaining;
      let newLives = lives;
      
      if (currentLevel.modificadores.includes('timer_dinamico') && timeRemaining !== null) {
        newTimeRemaining = applyTimerModifier(timeRemaining, false, { 
          addOnCorrect: 0, 
          subtractOnError: 3 
        });
      }
      
      if (timeRemaining !== null && newTimeRemaining <= 0) {
        newLives = lives - 1;
        if (newLives > 0) {
          // Reiniciar tiempo para nuevo intento
          newTimeRemaining = currentLevel.tiempoSeg;
        }
      }
      
      set({
        selectedCells: [],
        errorsCount: newErrorsCount,
        streak: newStreak,
        timeRemaining: newTimeRemaining,
        lives: newLives
      });
      
      // Verificar game over
      if (isGameOver(newTimeRemaining, newErrorsCount, currentLevel.erroresMax, newLives)) {
        set({ gameState: 'COMPLETE_LOSE' });
      }
    }
  },
  
  useBooster: (type: BoosterType) => {
    const { boosters, coins, currentLevel, remainingWords, grid } = get();
    const cost = CONFIG.GAME.BOOSTER_COSTS[type];
    
    if (boosters[type] <= 0 && coins < cost) return false;
    
    // Usar booster o monedas
    const newBoosters = { ...boosters };
    let newCoins = coins;
    
    if (boosters[type] > 0) {
      newBoosters[type]--;
    } else {
      newCoins -= cost;
    }
    
    // Aplicar efecto del booster
    switch (type) {
      case 'pista':
        // Mostrar pista de una palabra aleatoria
        if (remainingWords.length > 0) {
          const randomWord = remainingWords[Math.floor(Math.random() * remainingWords.length)];
          // TODO: Implementar lógica de mostrar pista
          console.log(`Pista para: ${randomWord}`);
        }
        break;
        
      case 'revelar_letra':
        // Revelar una letra aleatoria
        if (remainingWords.length > 0) {
          // TODO: Implementar lógica de revelar letra
          console.log('Letra revelada');
        }
        break;
        
      case 'quitar_niebla':
        // Quitar niebla temporalmente
        if (currentLevel?.modificadores.includes('niebla')) {
          // TODO: Implementar lógica de quitar niebla
          console.log('Niebla quitada temporalmente');
        }
        break;
    }
    
    set({ boosters: newBoosters, coins: newCoins });
    return true;
  },
  
  tick: () => {
    const { gameState, timeRemaining, currentLevel, errorsCount, lives } = get();
    
    if (gameState !== 'RUNNING' || timeRemaining === null) return;
    
    const newTimeRemaining = Math.max(0, timeRemaining - 1);
    set({ timeRemaining: newTimeRemaining });
    
    // Verificar game over por tiempo
    if (newTimeRemaining <= 0) {
      if (isGameOver(newTimeRemaining, errorsCount, currentLevel?.erroresMax || null, lives)) {
        set({ gameState: 'COMPLETE_LOSE' });
      }
    }
  },
  
  restartLevel: () => {
    const { currentLevel } = get();
    if (currentLevel) {
      get().loadLevel(currentLevel.id);
    }
  },
  
  nextLevel: () => {
    const { currentLevel } = get();
    if (currentLevel) {
      get().loadLevel(currentLevel.id + 1);
    }
  }
}));
