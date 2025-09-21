# 🚀 Instalación Mundo Letras en Hostalia

## 📁 Estructura Lista para Subir

Esta carpeta `sistema_apps_upload/` contiene **TODA** la estructura que debe ir en Hostalia.

```
sistema_apps_upload/                    ← Subir TODO esto a Hostalia
├── app_mundoletras.html               ← Aplicación principal
├── index.html                         ← Selector actualizado
├── router.html                        ← Router actualizado  
├── sistema_apps_api/
│   └── mundoletras/                   ← APIs del juego
│       ├── config.php
│       ├── auth.php
│       ├── progress.php
│       └── ranking.php
└── sql/
    ├── create_tables.sql              ← Script original
    └── create_tables_safe.sql         ← Script seguro (recomendado)
```

## 🔧 Proceso de Instalación

### 1. Base de Datos (PRIMERO)
```bash
mysql -h PMYSQL165.dns-servicio.com -u sistema_apps_user -p 9606966_sistema_apps_db < sql/create_tables_safe.sql
```

### 2. Subir Archivos (FTP)
**Conexión FTP:**
- **Host**: 82.194.68.83
- **Usuario**: sistema_apps_user  
- **Contraseña**: GestionUploadSistemaApps!

**Subir TODO el contenido de `sistema_apps_upload/` a la raíz del FTP**

### 3. URLs de Prueba

#### 🧪 Probar APIs:
```
https://colisan.com/sistema_apps_upload/sistema_apps_api/mundoletras/auth.php
```
**Respuesta esperada:**
```json
{
  "success": false,
  "message": "Acción no válida", 
  "timestamp": "2024-..."
}
```

#### 🌐 Probar Aplicación:
```
https://colisan.com/sistema_apps_upload/app_mundoletras.html
```
**Debe mostrar:** Pantalla de desarrollo con información del juego

#### 🔗 Probar Router:
```
https://colisan.com/sistema_apps_upload/router.html?app=mundoletras
```
**Debe redirigir:** A app_mundoletras.html

#### 🏠 Probar Selector:
```
https://colisan.com/sistema_apps_upload/
```
**Debe mostrar:** Selector con Mundo Letras incluido

## 🧪 Pruebas de API

### Registro de Usuario:
```bash
curl -X POST https://colisan.com/sistema_apps_upload/sistema_apps_api/mundoletras/auth.php \
-H "Content-Type: application/json" \
-d '{
  "action": "register",
  "email": "test@ejemplo.com", 
  "password": "123456",
  "nombre": "Usuario Prueba"
}'
```

### Login:
```bash
curl -X POST https://colisan.com/sistema_apps_upload/sistema_apps_api/mundoletras/auth.php \
-H "Content-Type: application/json" \
-d '{
  "action": "login",
  "email": "test@ejemplo.com",
  "password": "123456" 
}'
```

## 🔍 Verificación de Base de Datos

```sql
-- Ver tablas creadas
SHOW TABLES LIKE 'mundoletras_%';

-- Ver aplicación registrada
SELECT * FROM aplicaciones WHERE app_codigo = 'mundoletras';

-- Ver temas disponibles  
SELECT * FROM mundoletras_temas;
```

## ⚠️ Posibles Problemas

### Error 500 en APIs:
- Verificar permisos de archivos PHP (644)
- Revisar logs de error de PHP
- Comprobar sintaxis en archivos PHP

### Error de conexión DB:
- Verificar credenciales en config.php
- Probar conexión MySQL directa

### App no carga:
- Verificar que app_mundoletras.html se subió correctamente
- Revisar consola del navegador para errores

## ✅ Checklist de Instalación

- [ ] ✅ Base de datos: Ejecutar create_tables_safe.sql
- [ ] ✅ FTP: Subir todo sistema_apps_upload/ 
- [ ] ✅ API Test: Probar auth.php
- [ ] ✅ App Test: Probar app_mundoletras.html
- [ ] ✅ Router Test: Probar router.html?app=mundoletras
- [ ] ✅ Selector Test: Probar index.html
- [ ] ✅ Registro Test: Crear usuario de prueba
- [ ] ✅ Login Test: Iniciar sesión
- [ ] ✅ DB Check: Verificar datos en tablas

## 🎯 Estado Actual

**✅ Completado:**
- Base de datos y tablas
- APIs de autenticación completas
- Sistema de registro y verificación
- APIs de progreso y ranking
- Estructura multi-aplicación
- Archivos HTML de prueba

**🚧 Pendiente:**
- Integración de aplicación React compilada
- Generación de APK con Capacitor

---

**¡La infraestructura está lista! Solo falta integrar la aplicación React compilada.** 🎉
