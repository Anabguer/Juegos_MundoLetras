// Seeds para los primeros 100 niveles
export const LEVEL_SEEDS = [
  // Niveles 1-20: Onboarding (Océano)
  { id: 1,  tema: 'oceano', seed: 'oce-1-a1', dificultad: 'easy' as const },
  { id: 2,  tema: 'oceano', seed: 'oce-2-b3', dificultad: 'easy' as const },
  { id: 3,  tema: 'oceano', seed: 'oce-3-c7', dificultad: 'easy' as const },
  { id: 4,  tema: 'oceano', seed: 'oce-4-d2', dificultad: 'easy' as const },
  { id: 5,  tema: 'oceano', seed: 'oce-5-e5', dificultad: 'easy' as const },
  { id: 6,  tema: 'oceano', seed: 'oce-6-f8', dificultad: 'easy' as const },
  { id: 7,  tema: 'oceano', seed: 'oce-7-g1', dificultad: 'easy' as const },
  { id: 8,  tema: 'oceano', seed: 'oce-8-h9', dificultad: 'easy' as const },
  { id: 9,  tema: 'oceano', seed: 'oce-9-j4', dificultad: 'easy' as const },
  { id: 10, tema: 'oceano', seed: 'oce-10-k0', dificultad: 'easy' as const },

  // Niveles 11-20: Bosque
  { id: 11, tema: 'bosque', seed: 'bos-11-a2', dificultad: 'easy' as const },
  { id: 12, tema: 'bosque', seed: 'bos-12-b8', dificultad: 'easy' as const },
  { id: 13, tema: 'bosque', seed: 'bos-13-c3', dificultad: 'easy' as const },
  { id: 14, tema: 'bosque', seed: 'bos-14-d7', dificultad: 'easy' as const },
  { id: 15, tema: 'bosque', seed: 'bos-15-e1', dificultad: 'easy' as const },
  { id: 16, tema: 'bosque', seed: 'bos-16-f6', dificultad: 'easy' as const },
  { id: 17, tema: 'bosque', seed: 'bos-17-g0', dificultad: 'easy' as const },
  { id: 18, tema: 'bosque', seed: 'bos-18-h5', dificultad: 'easy' as const },
  { id: 19, tema: 'bosque', seed: 'bos-19-j9', dificultad: 'easy' as const },
  { id: 20, tema: 'bosque', seed: 'bos-20-k2', dificultad: 'easy' as const },

  // Niveles 21-40: Introducción mecánicas
  { id: 21, tema: 'oceano', seed: 'oce-21-m3', dificultad: 'medium' as const },
  { id: 22, tema: 'oceano', seed: 'oce-22-n7', dificultad: 'medium' as const },
  { id: 23, tema: 'bosque', seed: 'bos-23-p1', dificultad: 'medium' as const },
  { id: 24, tema: 'bosque', seed: 'bos-24-q5', dificultad: 'medium' as const },
  { id: 25, tema: 'oceano', seed: 'oce-25-r9', dificultad: 'medium' as const },
  { id: 26, tema: 'oceano', seed: 'oce-26-s2', dificultad: 'medium' as const },
  { id: 27, tema: 'bosque', seed: 'bos-27-t6', dificultad: 'medium' as const },
  { id: 28, tema: 'bosque', seed: 'bos-28-u0', dificultad: 'medium' as const },
  { id: 29, tema: 'oceano', seed: 'oce-29-v4', dificultad: 'medium' as const },
  { id: 30, tema: 'oceano', seed: 'oce-30-w8', dificultad: 'medium' as const },
  
  // Continuar con más niveles...
  { id: 31, tema: 'bosque', seed: 'bos-31-x1', dificultad: 'medium' as const },
  { id: 32, tema: 'bosque', seed: 'bos-32-y5', dificultad: 'medium' as const },
  { id: 33, tema: 'oceano', seed: 'oce-33-z9', dificultad: 'medium' as const },
  { id: 34, tema: 'oceano', seed: 'oce-34-a3', dificultad: 'medium' as const },
  { id: 35, tema: 'bosque', seed: 'bos-35-b7', dificultad: 'medium' as const },
  { id: 36, tema: 'bosque', seed: 'bos-36-c1', dificultad: 'medium' as const },
  { id: 37, tema: 'oceano', seed: 'oce-37-d5', dificultad: 'medium' as const },
  { id: 38, tema: 'oceano', seed: 'oce-38-e9', dificultad: 'medium' as const },
  { id: 39, tema: 'bosque', seed: 'bos-39-f2', dificultad: 'medium' as const },
  { id: 40, tema: 'bosque', seed: 'bos-40-g6', dificultad: 'medium' as const }
];

// Función para generar seeds dinámicamente
export function generateSeed(levelId: number, tema: string): string {
  const prefix = tema.substring(0, 3);
  const suffix = (levelId * 7 + tema.length) % 100;
  const char = String.fromCharCode(97 + (levelId % 26)); // a-z
  return `${prefix}-${levelId}-${char}${suffix}`;
}
