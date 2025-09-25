# Mundo Letras – Documento Técnico para Cursor

## 🎯 Filosofía General
- 1000 niveles predefinidos en un JSON, sin generación procedural.
- No hay temas (océano, bosque, etc.). Las palabras se toman de un diccionario general variado.
- Variedad no lineal: niveles fáciles mezclados con difíciles, y “niveles descanso” con grids pequeños.
- Monedas como única recompensa (sin estrellas).
- Ranking global: el progreso se mide por el nivel más alto superado y por las monedas acumuladas.

## 🔢 Estructura de Nivel (JSON)
Cada nivel se define con estos campos:

```json
{
  "id": 34,
  "gridSize": 7,
  "wordCount": 5,
  "words": ["PERRO","CASA","ARBOL"],
  "directions": ["H","V","R"],
  "timerSec": 0,
  "mechanics": { "fog": false, "ghost": false },
  "restLevel": false,
  "hints": { "base": 1, "adMaxExtra": 2 },
  "coins": { "base": 12, "timeBonus": { "perSec": 0.5, "cap": 30 } }
}
```

> **Nota**:  
> - `"timerSec": 0` → sin límite de tiempo (solo contador de cuánto tarda el jugador).  
> - `"timerSec": 120` → nivel con límite de 120 segundos (mecánica extra).  

## ⏱️ Cronómetro
- Todos los niveles muestran **tiempo total empleado** como contador informativo.
- Algunos niveles incluyen un **límite de tiempo obligatorio** (`timerSec > 0`).  
- El cronómetro se considera una **mecánica extra**, igual que reversas o diagonales.

## 🔍 Pistas
- 1 pista gratis por nivel (revela una letra de una palabra no resuelta).
- Hasta 2 pistas extra, cada una requiere ver un anuncio (máximo 2 anuncios por nivel).
- Cursor debe preparar la UI de pista + botón de anuncio (placeholder de vídeo).

## 🎨 Fondo/Progresión Visual
- El color de fondo cambia cada 20 niveles.
- No se usan temas visuales ni packs de palabras.

## 📚 Tutorial Inicial
- N1–5: grid 6×6, solo H/V, sin límite de tiempo.
- N6–10: añade reversa, primeros niveles con límite generoso (ej. 300s).
- N11–15: aparecen diagonales en algunos niveles, mezcla con niveles sin límite.
- N16–20: combinación variada (con/sin límite, con/sin reversa).

## 🔀 Del 21 al 1000
- Variación libre con descansos.
- `wordCount` proporcional al grid pero definido manualmente.
- Fog/Ghost opcionales.
- ~25% de los niveles incluyen límite de tiempo.

## 🏆 Ranking y Avance
- Ranking global basado en nivel alcanzado y monedas acumuladas.
- Mensajes al avanzar: “¡Has superado a [Usuario] en el ranking global!”

## 💰 Sistema de Monedas
- Monedas base por nivel.
- Bonus por segundos restantes en niveles con límite, con un máximo configurado.
