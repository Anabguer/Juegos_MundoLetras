# 🔤 Mundo Letras

Un juego de sopa de letras moderno con más de 1000 niveles, optimizado para móvil y con mecánicas avanzadas.

## ✨ Características

### 🎮 Mecánicas de Juego
- **Búsqueda básica**: Horizontal y vertical
- **Búsqueda avanzada**: Diagonales y palabras reversas
- **Niebla**: Celdas ocultas que se revelan al tocar
- **Fantasma**: Letras que parpadean intermitentemente
- **Palabra Meta**: Palabras especiales con puntuación x3
- **Timer Dinámico**: Tiempo que se ajusta según aciertos/errores

### 🏆 Progresión
- **1000+ niveles** con dificultad progresiva
- **Grid dinámico**: De 6×6 hasta 12×12
- **5 temas únicos**: Océano, Bosque, Ciudad, Espacio, Animales
- **Sistema de monedas** y boosters
- **Ranking global** y semanal

### 💡 Boosters
- **Pista** (💡): Resalta primera y última letra de una palabra
- **Revelar Letra** (🔍): Descubre una letra aleatoria
- **Quitar Niebla** (🌪️): Elimina la niebla temporalmente

### 🔐 Sistema de Usuarios
- **Modo Invitado**: Progreso local sin registro
- **Cuenta Completa**: Sincronización entre dispositivos
- **Verificación por email** con código de 6 dígitos
- **Ranking global** para cuentas verificadas

## 🛠️ Tecnologías

- **Frontend**: React 18 + TypeScript + Vite
- **Estado**: Zustand para gestión de estado
- **Persistencia**: IndexedDB (Dexie) + localStorage
- **Móvil**: Capacitor para APK
- **Backend**: PHP 7.4+ + MySQL
- **Hosting**: Hostalia (sistema multi-aplicación)

## 🚀 Desarrollo Local

### Prerequisitos
- Node.js 18+
- npm o yarn
- Android Studio (para APK)

### Instalación
```bash
# Clonar repositorio
git clone https://github.com/Anabguer/Juegos_MundoLetras.git
cd Juegos_MundoLetras

# Instalar dependencias
npm install

# Iniciar desarrollo
npm run dev
```

### Comandos Disponibles
```bash
npm run dev          # Servidor de desarrollo
npm run build        # Compilar para producción
npm run preview      # Preview del build
npm run lint         # Linter
npm run android      # Ejecutar en Android
npm run build:android # Compilar y sincronizar Android
```

## 📱 Generación de APK

### 1. Compilar aplicación
```bash
npm run build
npx cap sync
```

### 2. Abrir en Android Studio
```bash
npx cap open android
```

### 3. Generar APK firmado
1. Build → Generate Signed Bundle/APK
2. Seleccionar APK
3. Crear/seleccionar keystore
4. Build Release

## 🌐 Despliegue en Hostalia

### 1. Compilar para Hostalia
```bash
node scripts/build-for-hostalia.js
```

### 2. Configurar base de datos
```bash
mysql -h PMYSQL165.dns-servicio.com -u sistema_apps_user -p 9606966_sistema_apps_db < PARA_HOSTALIA_BUILD/sql/create_tables.sql
```

### 3. Subir archivos via FTP
- **Host**: 82.194.68.83
- **Usuario**: sistema_apps_user
- **Contraseña**: GestionUploadSistemaApps!

Subir contenido de `PARA_HOSTALIA_BUILD/` a `sistema_apps_upload/`

### 4. URLs de producción
- **Selector**: https://colisan.com/sistema_apps_upload/
- **Router**: https://colisan.com/sistema_apps_upload/router.html?app=mundoletras
- **App**: https://colisan.com/sistema_apps_upload/app_mundoletras.html

## 🎯 Mecánicas de Juego Detalladas

### Progresión por Niveles
- **1-20**: Onboarding con mecánicas básicas
- **21-60**: Introducción de diagonales y niebla
- **61-120**: Fantasma y palabra meta
- **121-300**: Rotación completa de mecánicas
- **301-700**: Grids más grandes y mayor dificultad
- **701-1000**: Mecánicas dobles y desafíos extremos

### Sistema de Puntuación
```typescript
puntuación = longitud_palabra × 100 × multiplicador_racha
bonus_tiempo = tiempo_restante × 5
puntuación_final = puntuación + bonus_tiempo + bonus_completar
```

### Cálculo de Estrellas
- ⭐ **1 estrella**: Completar el nivel
- ⭐⭐ **2 estrellas**: Menos del 50% del tiempo usado / <30% errores
- ⭐⭐⭐ **3 estrellas**: Menos del 25% del tiempo usado / ≤1 error

## 🔒 Seguridad

### Medidas Anti-Trampas
- Hash de validación cliente-servidor
- Límites de tiempo y puntuación razonables
- Verificación de secuencia de movimientos
- Rate limiting en APIs críticas

### Protección de Datos
- Contraseñas hasheadas con salt
- Prepared statements contra SQL injection
- Sanitización de entradas
- Headers CORS configurados

## 📊 Base de Datos

### Tablas Principales
- `usuarios_aplicaciones`: Sistema multi-app existente
- `mundoletras_progreso`: Progreso de usuarios
- `mundoletras_scores`: Historial de puntuaciones
- `mundoletras_temas`: Catálogo de temas
- `mundoletras_niveles`: Configuraciones de niveles
- `mundoletras_ranking_cache`: Cache de rankings

## 🐛 Resolución de Problemas

### Errores Comunes
1. **Error CORS**: Verificar headers en config.php
2. **Base de datos**: Comprobar credenciales y conexión
3. **APK no instala**: Habilitar "Fuentes desconocidas"
4. **Emails no llegan**: Configurar SMTP en config.php

### Debug Mode
```bash
# Activar logs detallados
localStorage.setItem('mundoletras_debug', 'true');
```

## 🤝 Contribuir

1. Fork del repositorio
2. Crear rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 👥 Equipo

- **Desarrollador Principal**: Ana Bernal Guerrero
- **Diseño**: Equipo Colisan
- **Backend**: Sistema Multi-Aplicación Hostalia

---

**¡Desafía tu mente con Mundo Letras! 🧠✨**
