# Mundo Letras – Resumen para Testers

## 🎯 Filosofía del Juego
- Juego de sopa de letras con 1000 niveles fijos.
- No hay generación aleatoria: cada nivel está diseñado para ser justo y reproducible.
- Progresión no lineal: se alternan niveles fáciles, difíciles y de descanso.
- El objetivo es avanzar de nivel y subir en el ranking global.

## 💰 Sistema de Recompensas
- Monedas como único recurso.
- Se obtienen al completar un nivel y con bonus por tiempo sobrante (en niveles con límite).
- No existen estrellas, vidas ni otros sistemas.

## 🔍 Pistas
- 1 pista gratuita por nivel.
- Hasta 2 pistas adicionales viendo anuncios (máximo 2 por nivel).

## ⏱️ Cronómetro
- Todos los niveles muestran el **tiempo total empleado** (contador informativo).
- Solo algunos niveles tienen **límite de tiempo obligatorio** (mecánica extra).
- En esos niveles, si no completas antes del límite, pierdes la partida y empieza de nuevo el nivel

## 🧩 Mecánicas
- Direcciones: primero H/V, luego reversas y diagonales.
- Niebla/Fantasma opcionales en niveles avanzados.

## 🎨 Aspecto Visual
- Sin temas de palabras ni packs.
- El color de fondo cambia cada 20 niveles.

## 📚 Tutorial Inicial
- N1–20: progresivos, introducen mecánicas paso a paso (incluyendo primeros límites de tiempo).

## 🏆 Ranking
- Ranking global: por nivel alcanzado y monedas acumuladas.
- Mensajes de progreso: “¡Has superado a [Usuario] en el ranking global!”

## 📋 Checklist para Testers
1. Niveles cargan bien (palabras, grids, mecánicas).
2. El contador siempre muestra el tiempo empleado.
3. En niveles con límite, el cronómetro corta la partida si se agota.
4. Pistas revelan letras útiles.
5. Anuncios se muestran al pedir pistas extra (placeholder).
6. Monedas se calculan correctamente.
7. Fondo cambia cada 20 niveles.
8. Ranking se actualiza y muestra mensajes.
