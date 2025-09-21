import { CONFIG } from '../config';

// Calcular puntuación por palabra encontrada
export function scoreWord(wordLength: number, streak: number): number {
  const baseScore = CONFIG.GAME.BASE_SCORE;
  const maxMultiplier = CONFIG.GAME.MAX_STREAK_MULTIPLIER;
  
  const multiplier = Math.min(maxMultiplier, 1 + streak / 10);
  return Math.round(baseScore * wordLength * multiplier);
}

// Calcular bonus por tiempo restante
export function timeBonus(tiempoRestante: number): number {
  const multiplier = CONFIG.GAME.TIME_BONUS_MULTIPLIER;
  return Math.max(0, Math.round(tiempoRestante * multiplier));
}

// Calcular puntuación total del nivel
export function calculateLevelScore(
  wordsFound: Array<{ word: string; timeFound: number }>,
  totalTime: number,
  timeRemaining: number,
  streak: number
): number {
  let totalScore = 0;
  
  // Puntuación por palabras
  let currentStreak = 0;
  for (const { word } of wordsFound) {
    totalScore += scoreWord(word.length, currentStreak);
    currentStreak++;
  }
  
  // Bonus por tiempo (solo si había límite de tiempo)
  if (totalTime > 0) {
    totalScore += timeBonus(timeRemaining);
  }
  
  // Bonus por completar el nivel
  const completionBonus = Math.round(totalScore * 0.1);
  totalScore += completionBonus;
  
  return totalScore;
}

// Calcular estrellas obtenidas (1-3)
export function calculateStars(
  score: number,
  timeUsed: number,
  totalTime: number,
  errorsCount: number,
  maxErrors: number
): number {
  let stars = 1; // Mínimo 1 estrella por completar
  
  // Segunda estrella: tiempo o errores
  if (totalTime > 0) {
    // Nivel con tiempo: menos del 50% del tiempo usado
    if (timeUsed < totalTime * 0.5) {
      stars = 2;
    }
  } else {
    // Nivel sin tiempo: menos del 30% de errores máximos
    if (errorsCount < maxErrors * 0.3) {
      stars = 2;
    }
  }
  
  // Tercera estrella: excelencia
  if (totalTime > 0) {
    // Nivel con tiempo: menos del 25% del tiempo usado
    if (timeUsed < totalTime * 0.25) {
      stars = 3;
    }
  } else {
    // Nivel sin tiempo: sin errores o máximo 1
    if (errorsCount <= 1) {
      stars = 3;
    }
  }
  
  return stars;
}

// Calcular monedas ganadas
export function calculateCoinsEarned(
  baseCoins: number,
  stars: number,
  isFirstTime: boolean
): number {
  let coins = baseCoins;
  
  // Multiplicador por estrellas
  coins *= stars;
  
  // Bonus por primera vez
  if (isFirstTime) {
    coins = Math.round(coins * 1.5);
  }
  
  return coins;
}
