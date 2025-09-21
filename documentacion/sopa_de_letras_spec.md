# 📱 MANUAL SISTEMA MULTI-APLICACIÓN HOSTALIA

## 🔄 ** PROCESO CRONOLÓGICO PARA NUEVA APLICACIÓN**

## **🔗 URLs DE ACCESO:**

```
Selector:  https://colisan.com/sistema_apps_upload/
Router:    https://colisan.com/sistema_apps_upload/router.html?app=CODIGO
App Web:   https://colisan.com/sistema_apps_upload/app_CODIGO.html
API Auth:  https://colisan.com/sistema_apps_upload/sistema_apps_api/CODIGO/auth.php
API List:  https://colisan.com/sistema_apps_upload/sistema_apps_api/CODIGO/list.php
Uploads:   https://colisan.com/sistema_apps_upload/sistema_apps_upload/CODIGO/

EJEMPLOS ESPECÍFICOS:
- Recetas: https://colisan.com/sistema_apps_upload/app_recetas.html
- MemoFlip:  https://colisan.com/sistema_apps_upload/app_memoflip.html
- MundoLetras:  https://colisan.com/sistema_apps_upload/app_mundoletras.html
```

## 🌐  CONFIGURACIÓN HOSTALIA**

### **📡 DATOS DE CONEXIÓN:**

```php
// Configuración Base de Datos Hostalia
define('DB_HOST', 'PMYSQL165.dns-servicio.com');
define('DB_USUARIO', 'sistema_apps_user');
define('DB_CONTRA', 'GestionUploadSistemaApps!');
define('DB_NOMBRE', '9606966_sistema_apps_db');
define('DB_CHARSET', 'utf8');
define('DB_PORT', 3306);
```

### **🔗 URLs BASE:**

```php
// URLs de Hostalia
define('API_BASE_URL', 'https://colisan.com/sistema_apps_upload/sistema_apps_api/');
define('UPLOAD_BASE_URL', 'https://colisan.com/sistema_apps_upload/');
define('WEB_BASE_URL', 'https://colisan.com/sistema_apps_upload/');
```

## 11) SQL (Hostalia) — esquema base

```sql
-- usuarios_aplicaciones (ya existente)
-- (definición tabla)

usuario_aplicacion_id	
usuario_aplicacion_key
email
nombre
password_hash
app_codigo
fecha_registro
ultimo_acceso
activo
configuracion
verification_code
verification_expiry
created_at
verified_at
last_login

### **🔑 CLAVE ÚNICA: `usuario_aplicacion_key`**
- **Formato:** `email_appcodigo`
- **Ejemplo:** `1954amg@gmail.com_recetas`
- **Función:** Permite al mismo usuario estar en múltiples apps

-- aplicaciones (ya existente)
-- (definición tabla)
-- Tabla donde se insertan las aplicaciones del proyecto multi-aplicacion

app_id
app_codigo
app_nombre
app_descripcion
activa


/*
Navicat MySQL Data Transfer

Source Server         : Hostalia-Sistema_apps
Source Server Version : 50741
Source Host           : PMYSQL165.dns-servicio.com:3306
Source Database       : 9606966_sistema_apps_db

Target Server Type    : MYSQL
Target Server Version : 50741
File Encoding         : 65001

Date: 2025-09-21 16:13:00
*/

SET FOREIGN_KEY_CHECKS=0;

-- ------------------------------ ----------------------------
-- Table structure for mundoletras
-- ------------------------------ ----------------------------

-- progreso (uno por usuario)
CREATE TABLE mundoletras_progreso (
  progreso_id 	int(11)  NOT NULL AUTO_INCREMENT,
  usuario_aplicacion_key  varchar(150) NOT NULL,
  nivel_max INT NOT NULL DEFAULT 1,
  monedas INT NOT NULL DEFAULT 0,
  actualizado_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`progreso_id`),
  CONSTRAINT `recetas_ibfk_1` FOREIGN KEY (`usuario_aplicacion_key`) REFERENCES `usuarios_aplicaciones` (`usuario_aplicacion_key`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=775 DEFAULT CHARSET=utf8mb4;
);

-- niveles (catalogo)
CREATE TABLE mundoletras_niveles (
  niveles_id 	int(11)  NOT NULL AUTO_INCREMENT,
  usuario_aplicacion_key  varchar(150) NOT NULL,
  tema_id INT NOT NULL,
  seed VARCHAR(64) NOT NULL,
  config_json JSON NOT NULL
     PRIMARY KEY (`niveles_id`),
     CONSTRAINT `niveles_ibfk_1` FOREIGN KEY (`usuario_aplicacion_key`) REFERENCES `usuarios_aplicaciones` (`usuario_aplicacion_key`) ON DELETE CASCADE
   ) ENGINE=InnoDB AUTO_INCREMENT=775 DEFAULT CHARSET=utf8mb4;
 );

-- temas
CREATE TABLE mundoletras_temas (
  temas_id 	int(11)  NOT NULL AUTO_INCREMENT,
  usuario_aplicacion_key  varchar(150) NOT NULL,
  nombre VARCHAR(80) NOT NULL,
  idioma VARCHAR(10) NOT NULL DEFAULT 'es'
     PRIMARY KEY (`temas_id`),
     CONSTRAINT `temas_ibfk_1` FOREIGN KEY (`usuario_aplicacion_key`) REFERENCES `usuarios_aplicaciones` (`usuario_aplicacion_key`) ON DELETE CASCADE
   ) ENGINE=InnoDB AUTO_INCREMENT=775 DEFAULT CHARSET=utf8mb4;
 );

-- scores (histórico)
CREATE TABLE mundoletras_scores (
  scores_id 	int(11)  NOT NULL AUTO_INCREMENT,
  usuario_aplicacion_key  varchar(150) NOT NULL,
  nivel_id INT NOT NULL,
  score INT NOT NULL,
  tiempo_ms INT NOT NULL,
  fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  device_hash VARCHAR(64) NULL,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
  FOREIGN KEY (nivel_id) REFERENCES niveles_id),
  INDEX idx_scores_usuario (usuario_aplicaciones_id),
  INDEX idx_scores_nivel (nivel_id)
     PRIMARY KEY (`scores_id`),
     CONSTRAINT `scores_ibfk_1` FOREIGN KEY (`usuario_aplicacion_key`) REFERENCES `usuarios_aplicaciones` (`usuario_aplicacion_key`) ON DELETE CASCADE
   ) ENGINE=InnoDB AUTO_INCREMENT=775 DEFAULT CHARSET=utf8mb4;
);

-- cache de ranking (opcional)
CREATE TABLE mundoletras_ranking_cache (
  ranking_id 	int(11)  NOT NULL AUTO_INCREMENT,
  usuario_aplicacion_key  varchar(150) NOT NULL,
  tipo ENUM('global','semanal') NOT NULL,
  periodo VARCHAR(20) NOT NULL, -- p.ej. '2025-W39'
  payload_json JSON NOT NULL,
  actualizado_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
     PRIMARY KEY (`ranking_id`),
     CONSTRAINT `ranking_cache_ibfk_1` FOREIGN KEY (`usuario_aplicacion_key`) REFERENCES `usuarios_aplicaciones` (`usuario_aplicacion_key`) ON DELETE CASCADE
   ) ENGINE=InnoDB AUTO_INCREMENT=775 DEFAULT CHARSET=utf8mb4;
 );
```

## 📁 ** ESTRUCTURA DE CARPETAS EN HOSTALIA**

-- Conexión Filezilla (FTP)

Server: 82.194.68.83
Usuario: sistema_apps_user
Contraseña: GestionUploadSistemaApps!

sistema_apps_upload/ (RAÍZ)
├── index.html                    ← Selector de aplicaciones
├── router.html                   ← Router inteligente
├── app_recetas.html             ← Aplicación Recetas (ESPECÍFICA)
├── app_memoflip.html              ← Aplicación de Memoria
├── app_mundoletras.html              ← Aplicación de Sopa de Letras
├── sistema_apps_api/
│   ├── recetas/                 ← APIs Recetas
│   │   ├── config.php
│   │   ├── auth.php
│   │   ├── list.php
│   │   ├── create.php
│   │   ├── update.php
│   │   ├── delete.php
│   │   ├── get.php
│   │   └── upload.php
│   ├── memoflip/                  ← APIs Memoria
└── sistema_apps_upload/	                  ← Sistema de subida de imágenes y videos a Hostalia
    ├── recetas/                 ← Uploads Recetas
    │   └── upload_handler.php

### **📊 CONFIGURACIÓN DE APLICACIÓN:**

```php
// Datos que cambian por aplicación:
APP_CODIGO = 'memoflip'           // Código único de la app
APP_NOMBRE = 'MemoFlip'      // Nombre para mostrar
TABLA_DATOS = '??????'    // Tabla específica de datos
```


Aplicación de una Sopa de Letras (mundoletras):

# Sopa de Letras — Especificación MVP → v1.2 (Mapa Horizontal, sin “deslizamiento”)

> Juego de sopa de letras con progresión larga (1000+ niveles), mapa horizontal por nodos, rotación de mecánicas, ranking y login invitado/cuenta. Documento preparado para Cursor (estructura, módulos, esquemas y checklist).

---

## 0) Resumen ejecutivo (esquema)

- **Género:** Sopa de letras por niveles, 1000+ niveles.
- **Mapa:** Camino **horizontal** infinito con nodos (scroll lateral), checkpoints cada 10 niveles.
- **Stack:** **React + TypeScript + Vite** (web) + **Capacitor** (APK). Estado con **Zustand**.
- **Login:**
  - **Invitado** (localStorage/IndexedDB).
  - **Cuenta** (Hostalia/MySQL) para sincronizar y ranking global.
- **HUD:** tiempo (cuando aplique), errores/vidas, racha, puntuación, lista de palabras, boosters (pista, revelar letra, quitar niebla).
- **Mecánicas (rotables, SIN deslizamiento):**
  - Básica (H/V), Diagonales, Reversas.
  - Niebla (se despeja al tocar), Fantasma (oculta por instantes).
  - Señuelos (relleno temático), Palabra “meta” x3.
  - Temporizador dinámico (+seg por acierto, −seg por fallo).
  - Modo sin tiempo con **límite de errores**.
- **Dificultad por grid:** 6×6 → 12×12 gradual.
- **Puntuación:** 100 × longitud × multiplicador de racha + bonus por tiempo restante.
- **Progresión (tramos):**
  - 1–20 onboarding; 21–60 diagonales/reversas suave; 61–120 niebla/fantasma/meta; 121–300 rotación completa; 301–700 10×10→11×11; 701–1000 11×11→12×12 doble mecánica frecuente.
- **Ranking:** global/semanal (más tarde “amigos”), validación server con seed/hash.
- **Datos:** JSON de nivel `{grid, palabras, modificadores, tiempo, vidas/errores, seed, tema}` + SQL `usuarios`, `progreso`, `scores`, `niveles`, `temas`.
- **Estados:** `INIT → READY → RUNNING → PAUSED → COMPLETE(WIN/LOSE)`.

---

## 1) Estructura del proyecto

```
sopa-letras/
  /src
    /core        // state machine, eventos, reloj, puntuación, racha
    /gen         // generador de grids (colocación + relleno temático)
    /mods        // mecánicas: niebla, fantasma, palabra_meta, temporizador
    /ui          // pantallas y componentes (Mapa, Juego, Resultado, Ranking, Login)
    /data        // listas de palabras por tema, seeds de ejemplo
    /net         // sync + ranking (stub en MVP, server más tarde)
    main.tsx
  /public
  capacitor.config.ts
  vite.config.ts
  package.json
```

---

## 2) Estados y eventos

- **Estados:** `INIT → READY → RUNNING → PAUSED → COMPLETE(WIN/LOSE)`
- **Eventos:** `LEVEL_LOAD`, `WORD_FOUND`, `MISS`, `TIMER_TICK`, `BOOST_USED`, `LEVEL_WIN`, `LEVEL_LOSE`, `SYNC_OK/FAIL`

---

## 3) Tipos y contratos (TS)

```ts
// src/types.ts
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
  | 'timer_dinamico';

export type GameEvent =
  | 'LEVEL_LOAD' | 'WORD_FOUND' | 'MISS' | 'TIMER_TICK'
  | 'BOOST_USED' | 'LEVEL_WIN' | 'LEVEL_LOSE'
  | 'SYNC_OK' | 'SYNC_FAIL';

export type CharGrid = string[][]; // matriz rows x cols con letras A–Z
```

---

## 4) Generación de niveles

### 4.1 Algoritmo (resumen)
1. Determinar `rows/cols` por tramo de niveles.
2. Elegir **palabras** por longitud objetivo (equilibrio cortas/medias/largas).
3. Colocar con **backtracking** en direcciones válidas (H/V/diag, normal/reversa).
4. Rellenar celdas vacías con **letras temáticas** (frecuencias por tema) → “señuelos”.
5. Aplicar modificadores (flags).
6. Firmar `config` con `seed` (para validaciones y reintentos reproducibles).

### 4.2 Firma
```ts
// src/gen/generateLevel.ts
import { LevelConfig } from '../types';

export function generateLevel(seed: string, tema: string, dificultad: 'easy'|'mid'|'hard', id: number): LevelConfig {
  // stub: calcular rows/cols y flags por dificultad, seleccionar palabras del tema
  // devolver LevelConfig
  return {} as any;
}
```

---

## 5) Puntuación, racha, vidas/errores

```ts
// src/core/score.ts
export function scoreWord(len: number, streak: number): number {
  const mult = Math.min(2.0, 1 + streak / 10);
  return Math.round(100 * len * mult);
}

export function timeBonus(tiempoRestante: number): number {
  return Math.max(0, Math.round(tiempoRestante * 5));
}
```

- **Con tiempo:** 3 vidas (perder = agotar tiempo en intento). Reintentos hasta 3.
- **Sin tiempo:** `erroresMax` por nivel (p.ej. 10 en early). `MISS` reduce margen.

---

## 6) Mecánicas (sin deslizamiento)

- **Básica:** H/V (por defecto).  
- **Diagonales:** `grid.diagonales = true`.
- **Reversas:** `grid.reversas = true` (permite leer de derecha→izquierda y arriba→abajo).  
- **Niebla:** celdas opacas hasta tocar; al pasar/tocar se revelan (persistente).  
- **Fantasma:** algunas celdas ocultan letra 200–400 ms de forma intermitente.  
- **Palabra meta (x3):** 1 palabra marcada internamente concede x3 al puntuar.  
- **Temporizador dinámico:** `+5 s` por acierto, `−3 s` por fallo (configurable por nivel).

---

## 7) Boosters (economía suave)

- **Pista:** resalta primera y última letra de una palabra pendiente.
- **Revelar letra:** desbloquea una celda de una palabra aleatoria pendiente.
- **Quitar niebla:** 5 s sin niebla (si el mod estaba activo).

Costes bajos con **monedas** ganadas por jugar. Sin monetización dura en MVP.

---

## 8) UI / Pantallas

- **Inicio:** Continuar, Mapa, Ranking, Ajustes, Login (Invitado/Cuenta).
- **Mapa (horizontal):** scroll lateral, nodos con estrellas (1–3) y tema.
- **Juego:** Grid central; lista de palabras abajo; HUD arriba (tiempo/errores/racha/score/boosters).
- **Resultado:** estrellas, récord personal, botones Reintentar / Siguiente / Compartir.
- **Ranking:** Global / Semanal (más tarde “amigos”).  
- **Login:** Invitado o Cuenta (email/clave) → sync.

---

## 9) Persistencia y sincronización

- **Invitado:** IndexedDB (Dexie) o localStorage (progreso, monedas, ajustes).
- **Cuenta (Hostalia/MySQL):** usuarios, progreso, inventario, puntuaciones.
- **Sync:** al iniciar sesión, merge por **nivel más alto**, **monedas máximas** y **timestamp**. Si conflicto, se ofrece tomar lo más avanzado por dimensión.
- **Offline-first:** si no hay red, se encola upload de progreso/scores.

---

## 10) Ranking y validación anti-trampas (básico)

- El **cliente** envía: `levelId`, tiempos, palabras encontradas, `seed`, y `clientHash(start,end,seed)`.
- El **servidor** recalcúla score y valida:
  - Tiempo plausible por palabra (umbral).
  - Secuencia coherente de hallazgos.
  - Coincidencia del `hash(seed + config)`.
- Rate-limit y bloqueo de **tiempos imposibles** o inputs acelerados.

---

## 12) Reglas de progresión por tramos (1–1000)

**Grids:** 6×6 → 7×7 → 8×8 → 9×9 → 10×10 → 11×11 → 12×12

**Tramos y mecánicas:**
- **1–20 (Onboarding):** 6×6→7×7, sin tiempo; H/V → reversas → diagonales; `erroresMax=10`.
- **21–60:** 7×7→8×8; niebla y fantasma puntuales; 20–30% de niveles con tiempo (150–180 s).
- **61–120:** 8×8→9×9; palabra meta y timer dinámico; 40–50% con tiempo (130–160 s).
- **121–300:** 9×9→10×10; rotación completa; respiros sin tiempo cada 4–6; picos cada 5–7.
- **301–700:** 10×10→11×11; señuelos temáticos más densos; 110–140 s; `erroresMax=8` en sin-tiempo.
- **701–1000:** 11×11→12×12; dobles mecánicas (p.ej. diagonales + fantasma); 90–120 s; palabra meta frecuente.

**Checkpoints:** cada 10 niveles (reaparición tras 3 fallos).

---

## 13) Playlist de bloque (10 niveles) — plantilla

> Base editable por tramo; este ejemplo sirve para los bloques 1–3 con parámetros suaves.

```json
{
  "niveles": [
    { "mods": [],                               "tiempoSeg": null, "erroresMax": 10 },
    { "mods": ["reversas"],                     "tiempoSeg": null, "erroresMax": 10 },
    { "mods": ["diagonales"],                   "tiempoSeg": null, "erroresMax": 10 },
    { "mods": ["señuelos"],                     "tiempoSeg": null, "erroresMax": 10 },
    { "mods": ["niebla"],                       "tiempoSeg": null, "erroresMax": 10 },
    { "mods": ["fantasma"],                     "tiempoSeg": null, "erroresMax": 10 },
    { "mods": ["timer_dinamico"],               "tiempoSeg": 160,  "erroresMax": null },
    { "mods": ["diagonales","reversas"],        "tiempoSeg": null, "erroresMax": 10 },
    { "mods": ["palabra_meta"],                 "tiempoSeg": null, "erroresMax": 10 },
    { "mods": ["mixto_suave","palabra_meta"],   "tiempoSeg": 150,  "erroresMax": null }
  ]
}
```

> Nota: `diagonales` y `reversas` son flags de `grid`; el resto son `modificadores`.

---

## 14) Seeds de ejemplo (niveles 1–20)

```ts
// src/data/seeds.ts
export const LEVEL_SEEDS = [
  { id: 1,  tema: 'Océano', seed: 'oce-1-a1' },
  { id: 2,  tema: 'Océano', seed: 'oce-2-b3' },
  { id: 3,  tema: 'Océano', seed: 'oce-3-c7' },
  { id: 4,  tema: 'Océano', seed: 'oce-4-d2' },
  { id: 5,  tema: 'Océano', seed: 'oce-5-e5' },
  { id: 6,  tema: 'Océano', seed: 'oce-6-f8' },
  { id: 7,  tema: 'Océano', seed: 'oce-7-g1' },
  { id: 8,  tema: 'Océano', seed: 'oce-8-h9' },
  { id: 9,  tema: 'Océano', seed: 'oce-9-j4' },
  { id: 10, tema: 'Océano', seed: 'oce-10-k0' },

  { id: 11, tema: 'Bosque', seed: 'bos-11-a2' },
  { id: 12, tema: 'Bosque', seed: 'bos-12-b8' },
  { id: 13, tema: 'Bosque', seed: 'bos-13-c3' },
  { id: 14, tema: 'Bosque', seed: 'bos-14-d7' },
  { id: 15, tema: 'Bosque', seed: 'bos-15-e1' },
  { id: 16, tema: 'Bosque', seed: 'bos-16-f6' },
  { id: 17, tema: 'Bosque', seed: 'bos-17-g0' },
  { id: 18, tema: 'Bosque', seed: 'bos-18-h5' },
  { id: 19, tema: 'Bosque', seed: 'bos-19-j9' },
  { id: 20, tema: 'Bosque', seed: 'bos-20-k2' }
];
```

---

## 15) Listas de palabras (muestra)

```ts
// src/data/palabras.oceano.ts
export const PALABRAS_OCEANO = [
  'ALGA','CORAL','DELFIN','MEDUSA','ANCLA','MAREAS','PERLA','NARVAL','BAHIA','ORILLA',
  'BRISA','OCEANO','MAR','ARENAL','FARO','VELA','ANEMONA','CANGREJO','PULPO','BALLENA'
];

// src/data/palabras.bosque.ts
export const PALABRAS_BOSQUE = [
  'ARBOL','HOJA','MUSGO','RAMA','PIÑA','ROBLE','PINO','SETAS','ZORRO','CIERVO',
  'NIDO','TRONCO','ARROYO','NIEBLA','SELVA','BOSQUE','LADRONERA','BAYA','LIANA','TREBOL'
];
```

---

## 16) Mapa horizontal — UI mínima

```tsx
// src/ui/Mapa.tsx
import React from 'react';
import { LEVEL_SEEDS } from '../data/seeds';

export default function Mapa() {
  return (
    <div style={{ whiteSpace:'nowrap', overflowX:'auto', padding:'16px' }}>
      {LEVEL_SEEDS.map(n => (
        <button key={n.id} style={{
          display:'inline-block', width:80, height:80, marginRight:12,
          borderRadius:16, border:'2px solid #1e90ff', background:'#eaf4ff'
        }}
          onClick={() => window.location.hash = `#/level/${n.id}`}
          title={`${n.tema} • ${n.seed}`}
        >
          {n.id}
        </button>
      ))}
    </div>
  );
}
```

---

## 17) Pantalla de juego — estructura mínima

```tsx
// src/ui/Juego.tsx
import React from 'react';
import { useGameStore } from '../core/store';

export default function Juego() {
  const { grid, palabras, tiempo, errores, racha, score } = useGameStore();

  return (
    <div className="screen">
      <header className="hud">
        <div>Tiempo: {tiempo ?? '∞'}</div>
        <div>Errores: {errores}</div>
        <div>Racha: {racha}</div>
        <div>Puntos: {score}</div>
      </header>

      <main className="grid">
        {/* Render del grid; cada celda es clicable/touch */}
      </main>

      <footer className="words">
        {palabras.map(w => <span key={w}>{w}</span>)}
      </footer>
    </div>
  );
}
```

---

## 18) Store con Zustand (esqueleto)

```ts
// src/core/store.ts
import { create } from 'zustand';
import { LevelConfig, CharGrid } from '../types';

type GameState = {
  level?: LevelConfig;
  grid: CharGrid;
  palabras: string[];
  tiempo: number | null;
  errores: number;
  racha: number;
  score: number;
  setLevel: (lvl: LevelConfig) => void;
  wordFound: (w: string) => void;
  miss: () => void;
};

export const useGameStore = create<GameState>((set, get) => ({
  level: undefined,
  grid: [],
  palabras: [],
  tiempo: null,
  errores: 0,
  racha: 0,
  score: 0,
  setLevel: (lvl) => set({
    level: lvl,
    tiempo: lvl.tiempoSeg,
    palabras: lvl.palabras.slice()
  }),
  wordFound: (w) => {
    const rest = get().palabras.filter(p => p !== w);
    const racha = get().racha + 1;
    const score = get().score + Math.round(100 * w.length * Math.min(2, 1 + racha/10));
    set({ palabras: rest, racha, score });
  },
  miss: () => set({ racha: 0, errores: get().errores + 1 })
}));
```

---

## 19) Onboarding detallado (niveles 1–20)

- **1–5:** Grid 6×6, sin tiempo, H/V. Tutorial visual (tocar y arrastrar para seleccionar).
- **6–10:** Introducir **reversas**. Consejos contextuales (tooltip).
- **11–15:** Añadir **diagonales**. Un nivel con **niebla** suave.
- **16–20:** Primer **fantasma** breve; una **palabra meta** x3; un nivel con **timer dinámico** suave (160 s base).

Recompensas suaves (monedas), estrellas por tiempo/errores.

---

## 20) Accesibilidad y ajustes

- Alto contraste, tamaño de letra escalable, vibración opcional en `MISS`, opción de desactivar parpadeos (reduce fantasma).  
- Idiomas: ES/EN en strings (archivo de i18n).

---

## 21) Roadmap

- **MVP (bloques 1–20, ~200 niveles):** básica/diagonal/reversa, niebla, fantasma, palabra meta, ranking local (device), login invitado, APK.
- **v1.1:** login servidor + ranking global + sync + anti-trampas básico.
- **v1.2:** eventos semanales, más temas, variantes extra de mods, “modo maratón”.

---

## 22) Checklist de tareas (MVP)

- [ ] Proyecto Vite React TS + Capacitor.
- [ ] Zustand store (`session`, `level`, `score`, `inventory`).
- [ ] Generador `generateLevel(seed, tema, dificultad)`.
- [ ] Colocación palabras + relleno temático (señuelos).
- [ ] UI Mapa horizontal con bloques/checkpoints.
- [ ] Pantalla Juego (grid táctil, lista palabras, HUD).
- [ ] Mecánicas: diagonales, reversas, niebla, fantasma, palabra meta, timer dinámico.
- [ ] Puntuación (racha, bonus tiempo), vidas/errores, resultado con estrellas.
- [ ] Persistencia invitado (local).
- [ ] Ranking local (device).
- [ ] Empaquetado APK (Capacitor).

---

## 23) Notas de implementación

- Mantener **seed** por nivel para reproducibilidad y validación.
- Evitar solapados imposibles (si backtracking falla N veces, cambiar seed).
- Relleno temático usando distribución de letras inspirada en las palabras del tema (mejor que A–Z puro).
- `MISS` solo cuenta si el trazo seleccionado no corresponde a ninguna palabra pendiente.
- Modo sin tiempo → enfoca precisión; modo con tiempo → enfoca ritmo.

---

## 24) .env (para v1.1 servidor)

```
API_BASE_URL=https://api.tu-dominio.com
```

En MVP, `net/` puede tener stubs que simulen respuestas locales.
