// Tipos principales del juego
export type LevelConfig = {
  id: number;
  tema: string;
  grid: { rows: number; cols: number; diagonales: boolean; reversas: boolean };
  palabras: string[];                 // En MAYÚSCULAS
  modificadores: ModName[];           // ['niebla','fantasma','palabra_meta','timer_dinamico']
  tiempoSeg: number | null;           // null = sin tiempo
  erroresMax: number | null;          // null = no aplica
  vidas: number;                      // con tiempo: 3 por defecto
  seed: string;                       // reproducible
  recompensas: { monedas: number };
};

export type ModName =
  | 'niebla'
  | 'fantasma'
  | 'palabra_meta'
  | 'timer_dinamico'
  | 'señuelos';

export type GameEvent =
  | 'LEVEL_LOAD' | 'WORD_FOUND' | 'MISS' | 'TIMER_TICK'
  | 'BOOST_USED' | 'LEVEL_WIN' | 'LEVEL_LOSE'
  | 'SYNC_OK' | 'SYNC_FAIL';

export type GameState = 
  | 'INIT' 
  | 'READY' 
  | 'RUNNING' 
  | 'PAUSED' 
  | 'COMPLETE_WIN' 
  | 'COMPLETE_LOSE';

export type CharGrid = string[][]; // matriz rows x cols con letras A–Z

export type WordPlacement = {
  word: string;
  startRow: number;
  startCol: number;
  direction: 'H' | 'V' | 'D1' | 'D2'; // Horizontal, Vertical, Diagonal1(\), Diagonal2(/)
  reverse: boolean;
  positions: Array<{ row: number; col: number }>;
};

export type CellState = {
  letter: string;
  revealed: boolean;
  isWordPart: boolean;
  isFoggy: boolean;
  isGhost: boolean;
  ghostTimer?: number;
};

export type BoosterType = 'pista' | 'revelar_letra' | 'quitar_niebla';

export type UserProgress = {
  usuario_aplicacion_key: string;
  nivel_max: number;
  monedas: number;
  actualizado_at: string;
};

export type UserAuth = {
  usuario_aplicacion_id: number;
  usuario_aplicacion_key: string;
  email: string;
  nombre: string;
  app_codigo: string;
  verified_at: string | null;
  last_login: string | null;
};

export type ScoreEntry = {
  scores_id?: number;
  usuario_aplicacion_key: string;
  nivel_id: number;
  score: number;
  tiempo_ms: number;
  fecha: string;
  device_hash?: string;
};

export type ApiResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};
