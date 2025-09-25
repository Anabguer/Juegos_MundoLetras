🎯 SISTEMA DE PUNTUACIÓN ACTUAL ANTES DE CHATGPT
Puntuación Base:
Puntuación por palabra: 100 puntos × longitud de palabra × multiplicador de racha
Multiplicador de racha: 1 + (racha/10), máximo 2.0x
Bonus por tiempo restante: tiempo restante × 5 puntos
Bonus por completar nivel: 10% de la puntuación total
Sistema de Estrellas (1-3):
1 estrella: Completar el nivel (mínimo)
2 estrellas:
Con tiempo: usar menos del 50% del tiempo
Sin tiempo: menos del 30% de errores máximos
3 estrellas:
Con tiempo: usar menos del 25% del tiempo
Sin tiempo: máximo 1 error
Sistema de Monedas:
Base: 10 + (nivel/10) × 2 monedas
Multiplicador por estrellas: monedas × estrellas obtenidas
Bonus primera vez: ×1.5 si es la primera vez que completas el nivel
🎮 MECÁNICAS DE JUEGO
Mecánicas Básicas:
Horizontal/Vertical: Siempre disponibles
Diagonales: Desde nivel 11
Reversas: Desde nivel 6 (leer de derecha a izquierda, arriba a abajo)
Modificadores Especiales:
Niebla: Celdas opacas hasta tocarlas (se revelan permanentemente)
Fantasma: Algunas celdas ocultan letras intermitentemente (200-400ms)
Palabra Meta: 10% probabilidad de que una palabra dé x3 puntos
Timer Dinámico: +5 segundos por acierto, -3 por error
Cuándo se Aplican:
Niveles 1-5: Solo básico
Niveles 6-10: Introducen reversas
Niveles 11-20: Añaden diagonales, niebla (30% prob), fantasma (20% prob)
Niveles 21-60: Todas las mecánicas con probabilidades variables
Niveles 61+: Rotación completa de todas las mecánicas
�� NIVELES Y PROGRESIÓN
Cantidad de Niveles:
Máximo: 1000 niveles
Checkpoints: Cada 10 niveles
Seeds definidos: Primeros 40 niveles (luego generación dinámica)
Progresión de Grids:
Niveles 1-20: 6×6
Niveles 21-60: 7×7
Niveles 61-120: 8×8
Niveles 121-300: 9×9
Niveles 301-700: 10×10
Niveles 701-1000: 11×11
Temas:
Niveles 1-10: Océano 🌊
Niveles 11-20: Bosque 🌲
Niveles 21+: Alternancia entre temas
💰 SISTEMA ECONÓMICO
Monedas:
Se ganan al completar niveles
Se usan para comprar boosters
Boosters:
Pista: 10 monedas (resalta primera y última letra)
Revelar letra: 15 monedas (desbloquea una celda aleatoria)
Quitar niebla: 20 monedas (5 segundos sin niebla)
Vidas:
Con tiempo: 3 vidas (pierdes 1 por agotar tiempo)
Sin tiempo: Sistema de errores máximos (5-15 según nivel)
🎲 PROBABILIDADES vs MARCAS
Es un sistema híbrido:
Niveles 1-40: Seeds predefinidos (marcados)
Niveles 41+: Generación procedural con seeds dinámicos
Mecánicas: Aplicación por probabilidad según el nivel
Palabras: Selección balanceada (40% cortas, 40% medianas, 20% largas)

📝 SISTEMA DE SELECCIÓN DE PALABRAS - MUNDO LETRAS
�� ¿De dónde salen las palabras?
Las palabras provienen de bases de datos temáticas organizadas por temas:
Tema Océano (palabras.oceano.ts): 33 palabras relacionadas con el mar
Tema Bosque (palabras.bosque.ts): 33 palabras relacionadas con la naturaleza
📊 ¿Cuántas palabras por nivel?
El número de palabras se calcula dinámicamente según la fórmula:
Esto significa:
Mínimo: 4 palabras por nivel
Máximo: 8 palabras por nivel
Cálculo: Tamaño del grid ÷ 12 (redondeado hacia abajo)
�� Progresión por tamaño de grid:


Niveles	Grid	Palabras típicas
1-20	6×6	3 palabras (36÷12)
21-60	7×7	4 palabras (49÷12)
61-120	8×8	5 palabras (64÷12)
121-300	9×9	6 palabras (81÷12)
301-700	10×10	8 palabras (100÷12)
701-1000	11×11	8 palabras (máximo)
⚖️ Balance de longitudes de palabras:

El sistema aplica una distribución balanceada:
40% palabras cortas (3-5 letras): ALGA, MAR, CORAL
40% palabras medianas (6-8 letras): DELFIN, MEDUSA, BALLENA
20% palabras largas (9+ letras): SUBMARINO, NAVEGACION
�� Sistema de Seeds (Semillas):
Niveles 1-40: Seeds predefinidos (marcados)
Cada nivel tiene una semilla fija como 'oce-1-a1', 'bos-12-b8'
Garantiza experiencia consistente para nuevos jugadores
Niveles 41+: Seeds dinámicos (generación procedural)
Se generan automáticamente: generateSeed(levelId, tema)
Permite infinitos niveles únicos
🌊�� Temas por niveles:
Niveles 1-10: Solo Océano
Niveles 11-20: Solo Bosque
Niveles 21+: Alternancia entre temas
🔧 Restricciones de colocación:
Longitud máxima: Math.min(gridSize - 1, 12) letras
Mínimo: 3 letras por palabra
Direcciones permitidas:
Niveles 1-5: Solo horizontal/vertical
Niveles 6-10: + reversas
Niveles 11+: + diagonales

🎯 Resumen del algoritmo:
Calcular número objetivo de palabras según grid
Filtrar palabras por longitud apropiada al grid
Balancear selección (40% cortas, 40% medianas, 20% largas)
Barajar aleatoriamente usando seed determinística
Intentar colocar cada palabra en el grid
Rellenar celdas vacías con letras temáticas
Este sistema garantiza que cada nivel tenga una dificultad apropiada y variedad equilibrada de palabras, manteniendo la reproducibilidad gracias a los seeds determinísticos.

