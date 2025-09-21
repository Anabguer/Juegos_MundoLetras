// Configuración de la aplicación
export const CONFIG = {
  APP_CODIGO: 'mundoletras',
  APP_NOMBRE: 'Mundo Letras',
  
  // URLs de Hostalia
  API_BASE_URL: 'https://colisan.com/sistema_apps_upload/sistema_apps_api/mundoletras/',
  WEB_BASE_URL: 'https://colisan.com/sistema_apps_upload/',
  
  // Configuración del juego
  GAME: {
    MAX_LEVELS: 1000,
    CHECKPOINT_INTERVAL: 10,
    MAX_RETRIES: 3,
    DEFAULT_LIVES: 3,
    
    // Puntuación
    BASE_SCORE: 100,
    MAX_STREAK_MULTIPLIER: 2.0,
    TIME_BONUS_MULTIPLIER: 5,
    
    // Progresión de grids
    GRID_PROGRESSION: {
      '1-20': { rows: 6, cols: 6 },
      '21-60': { rows: 7, cols: 7 },
      '61-120': { rows: 8, cols: 8 },
      '121-300': { rows: 9, cols: 9 },
      '301-700': { rows: 10, cols: 10 },
      '701-1000': { rows: 11, cols: 11 }
    },
    
    // Boosters
    BOOSTER_COSTS: {
      pista: 10,
      revelar_letra: 15,
      quitar_niebla: 20
    }
  },
  
  // Configuración de persistencia
  STORAGE: {
    USER_KEY: 'mundoletras_user',
    PROGRESS_KEY: 'mundoletras_progress',
    SETTINGS_KEY: 'mundoletras_settings',
    OFFLINE_SCORES_KEY: 'mundoletras_offline_scores'
  }
};

// Configuración de temas
export const TEMAS_CONFIG = {
  oceano: {
    nombre: 'Océano',
    color: '#1e40af',
    emoji: '🌊'
  },
  bosque: {
    nombre: 'Bosque',
    color: '#16a34a',
    emoji: '🌲'
  },
  ciudad: {
    nombre: 'Ciudad',
    color: '#dc2626',
    emoji: '🏙️'
  },
  espacio: {
    nombre: 'Espacio',
    color: '#7c3aed',
    emoji: '🚀'
  },
  animales: {
    nombre: 'Animales',
    color: '#ea580c',
    emoji: '🦁'
  }
};
