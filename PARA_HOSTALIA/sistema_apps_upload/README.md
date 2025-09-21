# 🔤 Mundo Letras - Instalación en Hostalia

## 📋 Resumen del Proyecto

**Mundo Letras** es un juego de sopa de letras optimizado para móvil con más de 1000 niveles, progresión compleja, sistema de monedas, boosters, ranking global y mecánicas avanzadas (niebla, fantasma, palabra meta, etc.).

## 🏗️ Arquitectura del Sistema

- **Frontend**: React + TypeScript + Vite (compilado a HTML/JS/CSS estáticos)
- **Backend**: PHP 7.4+ con MySQL
- **Base de Datos**: MySQL (sistema multi-aplicación existente)
- **Móvil**: Capacitor para generar APK
- **Hosting**: Hostalia (integración con sistema existente)

## 📁 Estructura de Archivos para Subir

```
sistema_apps_upload/
├── app_mundoletras.html          ← Aplicación principal
├── index.html                    ← Selector actualizado
├── router.html                   ← Router actualizado
├── sistema_apps_api/
│   └── mundoletras/              ← APIs del juego
│       ├── config.php
│       ├── auth.php
│       ├── progress.php
│       └── ranking.php
└── sql/
    └── create_tables.sql         ← Script de base de datos
```

## 🚀 Proceso de Instalación

### 1. Base de Datos

1. **Conectar a MySQL de Hostalia**:
   ```bash
   mysql -h PMYSQL165.dns-servicio.com -u sistema_apps_user -p 9606966_sistema_apps_db
   ```

2. **Ejecutar script SQL**:
   ```sql
   SOURCE create_tables.sql;
   ```

3. **Verificar tablas creadas**:
   ```sql
   SHOW TABLES LIKE 'mundoletras_%';
   ```

### 2. Archivos PHP (APIs)

1. **Subir carpeta completa**:
   ```
   PARA_HOSTALIA/sistema_apps_api/mundoletras/ → sistema_apps_upload/sistema_apps_api/mundoletras/
   ```

2. **Verificar permisos**:
   ```bash
   chmod 644 sistema_apps_api/mundoletras/*.php
   ```

3. **Probar API de autenticación**:
   ```
   https://colisan.com/sistema_apps_upload/sistema_apps_api/mundoletras/auth.php
   ```

### 3. Aplicación Web

1. **Compilar React** (en desarrollo local):
   ```bash
   npm run build
   ```

2. **Integrar build en app_mundoletras.html**:
   - Copiar archivos de `dist/` 
   - Actualizar rutas en `app_mundoletras.html`

3. **Subir archivos**:
   ```
   PARA_HOSTALIA/app_mundoletras.html → sistema_apps_upload/app_mundoletras.html
   PARA_HOSTALIA/index.html → sistema_apps_upload/index.html
   PARA_HOSTALIA/router.html → sistema_apps_upload/router.html
   ```

### 4. Verificación

1. **Probar selector**:
   ```
   https://colisan.com/sistema_apps_upload/
   ```

2. **Probar router**:
   ```
   https://colisan.com/sistema_apps_upload/router.html?app=mundoletras
   ```

3. **Probar aplicación**:
   ```
   https://colisan.com/sistema_apps_upload/app_mundoletras.html
   ```

## 🔧 Configuración

### Variables de Entorno (config.php)

```php
// Base de datos
define('DB_HOST', 'PMYSQL165.dns-servicio.com');
define('DB_USUARIO', 'sistema_apps_user');
define('DB_CONTRA', 'GestionUploadSistemaApps!');
define('DB_NOMBRE', '9606966_sistema_apps_db');

// Aplicación
define('APP_CODIGO', 'mundoletras');
define('APP_NOMBRE', 'Mundo Letras');

// URLs
define('API_BASE_URL', 'https://colisan.com/sistema_apps_upload/sistema_apps_api/');
```

### Configuración de Email

Para el sistema de verificación por email, configurar en `config.php`:

```php
define('SMTP_HOST', 'smtp.hostalia.com');
define('SMTP_PORT', 587);
define('SMTP_USER', 'noreply@colisan.com');
define('SMTP_PASS', 'TuPasswordDeEmail');
```

## 📱 Generación de APK

### Prerequisitos

1. **Instalar Android Studio**
2. **Instalar Capacitor CLI**:
   ```bash
   npm install -g @capacitor/cli
   ```

### Proceso

1. **Compilar aplicación**:
   ```bash
   npm run build
   ```

2. **Sincronizar con Capacitor**:
   ```bash
   npx cap sync
   ```

3. **Abrir en Android Studio**:
   ```bash
   npx cap open android
   ```

4. **Generar APK**:
   - Build → Generate Signed Bundle/APK
   - Seleccionar APK
   - Configurar keystore
   - Build Release

## 🎮 Características del Juego

### Mecánicas Implementadas

- ✅ **Básica**: Horizontal y Vertical
- ✅ **Diagonales**: Búsqueda en diagonales
- ✅ **Reversas**: Palabras al revés
- ✅ **Niebla**: Celdas ocultas que se revelan
- ✅ **Fantasma**: Letras que parpadean
- ✅ **Palabra Meta**: Palabras con puntuación x3
- ✅ **Timer Dinámico**: Tiempo que cambia según aciertos/errores

### Sistema de Progresión

- **1000+ niveles** con dificultad progresiva
- **Grid dinámico**: 6x6 → 12x12
- **5 temas**: Océano, Bosque, Ciudad, Espacio, Animales
- **Sistema de monedas** y boosters
- **Ranking global** y semanal

### Boosters Disponibles

- 💡 **Pista**: Resalta primera y última letra
- 🔍 **Revelar Letra**: Descubre una letra aleatoria
- 🌪️ **Quitar Niebla**: Elimina niebla temporalmente

## 🔒 Seguridad

### Medidas Implementadas

- **Hash de contraseñas** con salt personalizado
- **Códigos de verificación** por email
- **Validación anti-trampas** básica con hashes
- **Rate limiting** en APIs críticas
- **Sanitización** de todas las entradas
- **Prepared statements** para prevenir SQL injection

### Validación de Puntuaciones

```php
// Validación de hash cliente
$expectedHash = hash('sha256', $levelId . $score . $timeMs . $seed . 'MUNDO_LETRAS_SALT');
$isValid = hash_equals($expectedHash, $clientHash);
```

## 📊 Base de Datos

### Tablas Principales

- `mundoletras_progreso`: Progreso de usuarios
- `mundoletras_scores`: Puntuaciones históricas
- `mundoletras_temas`: Catálogo de temas
- `mundoletras_niveles`: Configuraciones de niveles
- `mundoletras_boosters`: Boosters de usuarios
- `mundoletras_ranking_cache`: Cache de rankings

### Consultas Optimizadas

- Índices compuestos para ranking
- Cache de consultas frecuentes
- Procedimientos almacenados para operaciones complejas

## 🐛 Resolución de Problemas

### Errores Comunes

1. **Error de conexión DB**:
   - Verificar credenciales en `config.php`
   - Comprobar conectividad con MySQL

2. **CORS errors**:
   - Headers ya configurados en `config.php`
   - Verificar dominio en Hostalia

3. **Email no llega**:
   - Configurar SMTP en `config.php`
   - Revisar logs de PHP

4. **APK no instala**:
   - Habilitar "Fuentes desconocidas"
   - Verificar firma del APK

### Logs y Debug

```php
// Activar logs de error
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Log personalizado
Utils::logError("Mensaje de error", ['contexto' => $data]);
```

## 🚀 Próximas Funcionalidades

- [ ] **Modo multijugador** en tiempo real
- [ ] **Eventos semanales** con premios especiales
- [ ] **Sistema de logros** y badges
- [ ] **Modo sin conexión** completo
- [ ] **Más temas** y mecánicas
- [ ] **Tutorial interactivo**

## 📞 Soporte

Para problemas técnicos o consultas:

1. **Revisar logs** en `/var/log/php_errors.log`
2. **Verificar configuración** en `config.php`
3. **Probar APIs** individualmente
4. **Consultar documentación** de Hostalia

---

**¡Mundo Letras está listo para desafiar mentes en más de 1000 niveles de diversión! 🎯**
