# Mundo Letras — Documento Técnico y de Test (Versión Completa y Corregida)

Este documento reúne toda la información para **implementar** y **probar** el juego.  
Sirve tanto para **Cursor (programador)** como para **testers**. Incluye **todas las mecánicas**: direcciones, cronómetro de nivel, y especiales `fog`, `ghost`, `hiddenWords`, `wordTimer`, `dynamicTimer`.

---

## 1) Filosofía del juego
- Juego de sopa de letras con **1.000 niveles fijos** (definidos en JSON).
- **Sin aleatoriedad en runtime**: el juego aplica lo que marca el JSON.
- Progresión **no lineal**: se alternan niveles fáciles, difíciles y de descanso.
- Recompensa única: **monedas** (no hay estrellas ni vidas).
- Ranking por **nivel más alto** y **monedas acumuladas**.

---

## 2) JSON de niveles (fuente de verdad)

Cada nivel en el JSON se define así:

```json
{
  "id": 34,
  "gridSize": 7,
  "wordCount": 5,
  "words": ["ARBOL","CAMINO","RELOJ"],            // lógica (sin tildes, Ñ preservada)
  "wordsDisplay": ["ÁRBOL","CAMINO","RELOJ"],     // UI (tildes + Ñ)
  "directions": ["H","V","R"],                    // H,V,R,D
  "timerSec": 120,                                // 0 = sin límite; >0 = límite de nivel
  "mechanics": { "special": "fog" },              // none|fog|ghost|hiddenWords|wordTimer|dynamicTimer
  "hints": { "base": 0, "adMaxExtra": 2 },        // 2 pistas máximo; siempre con anuncio
  "coins": { "base": 12, "timeBonus": { "perSec": 0.5, "cap": 30 } },
  "restLevel": false
}
```

### Nota de palabras (obligatoria)
- `wordsDisplay` → se **muestran** en UI (con tildes y **Ñ**).  
- `words` → se **usan para lógica**: comparar la selección; están **normalizadas** (tildes quitadas) y **preservan la Ñ**.  
- Comparación **case-insensitive** con alfabeto español. Mostrar siempre `wordsDisplay` en la lista del nivel.

---

## 3) Mecánicas (lista completa)

### 3.1 Core
- **Direcciones (`directions`)**:  
  - H = horizontal izq→der  
  - V = vertical arriba→abajo  
  - R = reversas (H/V invertidas)  
  - D = diagonales (y reversas)  
  > El motor solo valida rutas en las direcciones declaradas.

- **Cronómetro de nivel (`timerSec`)**:  
  - `0` → sin límite (solo **contador informativo** de tiempo jugado).  
  - `>0` → **límite obligatorio**; si llega a 0, el jugador **pierde y repite** el nivel.  
  - Mensaje de fallo: “**¡Tiempo agotado! Debes repetir el nivel**”.

### 3.2 Especiales (máx. **1** por nivel) — `mechanics.special`
- `none` → sin especial.
- `fog` (**Niebla**) → algunas celdas se muestran como `?` hasta progresar.  
  - Aplicación **determinista** (no aleatorio en runtime): escoger índices por patrón estable.
- `ghost` (**Fantasma**) → algunas celdas son translúcidas/parpadean.  
  - También determinista (conjunto fijo de celdas).
- `hiddenWords` (**Palabras ocultas**) → 1–n palabras no aparecen en la lista hasta que el jugador las descubre.
- `wordTimer` (**Temporizador por palabra**) → cada palabra tiene su propio tiempo:  
  - Recomendado: ordenar por longitud y asignar 40s, 35s, 30s, 25s… **mínimo 15s**.  
  - Al expirar **todas** las palabras pendientes, el nivel se considera fallido.  
  - `timerSec` del nivel se **ignora** en esta mecánica.
- `dynamicTimer` (**Temporizador dinámico de nivel**) → cuenta atrás que puede **variar** con aciertos/errores:  
  - Comienza en `timerSec`.  
  - Implementación mínima: al acertar suma +5s; al fallar resta −3s (valores ajustables).  
  - Si llega a 0 → fallo y repetir nivel.

> En **V1** se aplica **solo una** de estas especiales por nivel. Si un día quisieras mezclarlas, habrá que definir prioridades y UX.

---

## 4) Pistas (con anuncios)
- No hay pista gratis. Config en JSON: `"hints": { "base": 0, "adMaxExtra": 2 }`.
- Máximo **2 pistas** por nivel. Cada una requiere **ver un anuncio rewarded**.
- Efecto: revelar **una letra útil** de una palabra no resuelta (preferible primera o última).

**Implementación (fase 1 con placeholder):**
- Botón “Pista” → modal de anuncio dummy (temporizador de 5–10s) → `onReward` revela letra y descuenta 1.
- Botón se deshabilita al consumir 2/2.

---

## 5) Monedas (recompensa)
- Único recurso del juego.  
- `coins.base = 10 + (gridSize − 5)`  
- Si hay límite (`timerSec>0` o `dynamicTimer`): **bonus** = `perSec × segundosRestantes`, tope `cap`.
- Mostrar desglose al completar: base + bonus (si aplica).

---

## 6) Ranking
- Ranking global por **nivel máximo superado** + **monedas acumuladas**.
- Al superar a alguien: mensaje **“¡Has superado a [Usuario] en el ranking global!”**.

---

## 7) Fondo visual
- Cambio de color **cada 20 niveles**. Sin temas gráficos ni assets extra.

---

## 8) Tutorial (niveles 1–20) — ejemplo de despliegue
> Introduce **todas** las mecánicas en grids pequeños y sin castigar.
- N2 → `hiddenWords` (6×6, sin límite).  
- N4 → `fog` (6×6, sin límite).  
- N6 → `R` + límite generoso (6×6).  
- N12 → `dynamicTimer` (6×6, `timerSec` base).  
- N13 → `ghost` (6×6, sin límite).  
- N15 → `wordTimer` (6×6, tiempos por palabra).  
- N11–20 → se introducen `D` y mezclas suaves.

> El JSON entregado ya define estos 20 niveles con esta pauta.

---

## 9) Plan de implementación (para Cursor)
1. **Loader JSON**: validar campos, cargar grid y `wordsDisplay`.  
2. **Cronómetro**: contador informativo; si `timerSec>0` → countdown y `restartLevel()` al expirar.  
3. **Pistas (rewarded dummy)**: 2 máximo; revelar letra útil.  
4. **Especiales**: aplicar **una** según `mechanics.special` (determinista, sin azar puro).  
5. **Direcciones**: validar rutas solo en las declaradas.  
6. **Monedas**: calcular (base + bonus si corresponde) y persistir acumulado.  
7. **Ranking**: actualizar al completar; mostrar mensaje de superación.  
8. **Fondo**: cambiar cada 20 niveles.

---

## 10) Plan de pruebas (para testers)
- Carga de niveles: lista de palabras **con tildes** (`wordsDisplay`).  
- Cronómetro:  
  - `timerSec=0` → solo contador;  
  - `>0` → al llegar a 0 se repite el nivel.  
- Pistas: 2 máximas, siempre tras anuncio; revelan letra útil.  
- Especiales:  
  - **fog** → aparecen `?` en celdas; se van revelando según avance.  
  - **ghost** → celdas translúcidas/parpadeo (sin afectar selección).  
  - **hiddenWords** → lista inicial incompleta; palabras se muestran al descubrirlas.  
  - **wordTimer** → mostrar tiempo restante por palabra; al agotarse todas, fallo.  
  - **dynamicTimer** → cuenta atrás que sube/baja con aciertos/errores.  
- Monedas: verificar base + bonus cuando hay tiempo restante.  
- Ranking: sube y muestra mensaje “has superado a”.  
- Fondo: cambia cada 20 niveles.

---

## 11) Checklist técnico
- [ ] UI usa `wordsDisplay`; lógica usa `words` (Ñ preservada, tildes normalizadas y fuera).  
- [ ] `timerSec`: 0 = sin límite; >0 = límite y **reinicio** al expirar.  
- [ ] Pistas: sin gratis; máx 2 con anuncio.  
- [ ] `mechanics.special`: aplicar **solo 1** entre `none/fog/ghost/hiddenWords/wordTimer/dynamicTimer`.  
- [ ] Direcciones: respetar `H/V/R/D` del JSON.  
- [ ] Monedas: `base + min(perSec×segundosRestantes, cap)` cuando haya límite.  
- [ ] Ranking y mensaje de superación.  
- [ ] Fondo por tramos de 20.  
