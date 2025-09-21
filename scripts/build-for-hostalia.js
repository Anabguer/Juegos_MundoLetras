#!/usr/bin/env node

/**
 * Script para compilar y preparar la aplicación para Hostalia
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Iniciando compilación para Hostalia...\n');

// 1. Compilar aplicación React
console.log('📦 Compilando aplicación React...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Compilación completada\n');
} catch (error) {
  console.error('❌ Error en la compilación:', error.message);
  process.exit(1);
}

// 2. Crear directorio de salida
const outputDir = path.join(__dirname, '../PARA_HOSTALIA_BUILD');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// 3. Copiar archivos estáticos
console.log('📁 Copiando archivos...');

// Copiar archivos de dist
const distDir = path.join(__dirname, '../dist');
const assetsDir = path.join(outputDir, 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// Copiar assets
if (fs.existsSync(path.join(distDir, 'assets'))) {
  execSync(`cp -r ${path.join(distDir, 'assets')}/* ${assetsDir}/`);
}

// 4. Generar app_mundoletras.html con archivos integrados
console.log('🔧 Integrando archivos en app_mundoletras.html...');

const indexHtml = fs.readFileSync(path.join(distDir, 'index.html'), 'utf8');

// Leer archivos CSS y JS
const cssFiles = fs.readdirSync(assetsDir).filter(f => f.endsWith('.css'));
const jsFiles = fs.readdirSync(assetsDir).filter(f => f.endsWith('.js'));

let inlinedHtml = indexHtml;

// Integrar CSS
cssFiles.forEach(cssFile => {
  const cssContent = fs.readFileSync(path.join(assetsDir, cssFile), 'utf8');
  inlinedHtml = inlinedHtml.replace(
    `<link rel="stylesheet" crossorigin href="/assets/${cssFile}">`,
    `<style>${cssContent}</style>`
  );
});

// Integrar JS
jsFiles.forEach(jsFile => {
  const jsContent = fs.readFileSync(path.join(assetsDir, jsFile), 'utf8');
  inlinedHtml = inlinedHtml.replace(
    `<script type="module" crossorigin src="/assets/${jsFile}"></script>`,
    `<script type="module">${jsContent}</script>`
  );
});

// Actualizar configuración para Hostalia
inlinedHtml = inlinedHtml.replace(
  '<title>Mundo Letras</title>',
  `<title>Mundo Letras - Sopa de Letras</title>
  <script>
    // Configuración para Hostalia
    window.HOSTALIA_CONFIG = {
      API_BASE_URL: 'https://colisan.com/sistema_apps_upload/sistema_apps_api/mundoletras/',
      WEB_BASE_URL: 'https://colisan.com/sistema_apps_upload/',
      APP_CODIGO: 'mundoletras'
    };
  </script>`
);

// Escribir archivo final
fs.writeFileSync(path.join(outputDir, 'app_mundoletras.html'), inlinedHtml);

// 5. Copiar archivos de PARA_HOSTALIA
console.log('📋 Copiando archivos de configuración...');

const sourceDir = path.join(__dirname, '../PARA_HOSTALIA');
const filesToCopy = [
  'index.html',
  'router.html',
  'README.md'
];

filesToCopy.forEach(file => {
  const sourcePath = path.join(sourceDir, file);
  const destPath = path.join(outputDir, file);
  if (fs.existsSync(sourcePath)) {
    fs.copyFileSync(sourcePath, destPath);
  }
});

// Copiar carpetas
const foldersToCopy = ['sistema_apps_api', 'sql'];
foldersToCopy.forEach(folder => {
  const sourcePath = path.join(sourceDir, folder);
  const destPath = path.join(outputDir, folder);
  if (fs.existsSync(sourcePath)) {
    execSync(`cp -r "${sourcePath}" "${destPath}"`);
  }
});

// 6. Generar información de build
const buildInfo = {
  version: '1.0.0',
  buildDate: new Date().toISOString(),
  buildNumber: Date.now(),
  gitCommit: process.env.GIT_COMMIT || 'unknown',
  environment: 'production'
};

fs.writeFileSync(
  path.join(outputDir, 'build-info.json'),
  JSON.stringify(buildInfo, null, 2)
);

// 7. Crear archivo de instrucciones
const instructions = `
# 📁 Archivos listos para subir a Hostalia

## 🚀 Instrucciones de instalación:

### 1. Base de datos
\`\`\`bash
mysql -h PMYSQL165.dns-servicio.com -u sistema_apps_user -p 9606966_sistema_apps_db < sql/create_tables.sql
\`\`\`

### 2. Subir archivos via FTP
- **Host**: 82.194.68.83
- **Usuario**: sistema_apps_user
- **Contraseña**: GestionUploadSistemaApps!

### 3. Estructura de archivos:
\`\`\`
sistema_apps_upload/
├── app_mundoletras.html          ← Aplicación principal
├── index.html                    ← Selector actualizado  
├── router.html                   ← Router actualizado
└── sistema_apps_api/
    └── mundoletras/              ← APIs del juego
        ├── config.php
        ├── auth.php
        ├── progress.php
        └── ranking.php
\`\`\`

### 4. URLs de prueba:
- **Selector**: https://colisan.com/sistema_apps_upload/
- **Router**: https://colisan.com/sistema_apps_upload/router.html?app=mundoletras
- **App**: https://colisan.com/sistema_apps_upload/app_mundoletras.html

## ✅ Build completado: ${buildInfo.buildDate}
`;

fs.writeFileSync(path.join(outputDir, 'INSTRUCCIONES.md'), instructions);

console.log('\n🎉 ¡Compilación completada!');
console.log(`📁 Archivos generados en: ${outputDir}`);
console.log('\n📋 Próximos pasos:');
console.log('1. Ejecutar SQL en la base de datos de Hostalia');
console.log('2. Subir archivos via FTP');
console.log('3. Probar las URLs de la aplicación');
console.log('\n🔗 Ver INSTRUCCIONES.md para detalles completos');
