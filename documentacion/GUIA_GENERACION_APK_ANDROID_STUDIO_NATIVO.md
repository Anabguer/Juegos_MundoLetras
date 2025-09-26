# Guía Completa: Generación de APK - Mundo Letras
## Proyecto Android Studio Nativo

---

## 📋 **RESUMEN DEL PROCESO**

Este documento describe el proceso completo para generar APKs de la aplicación **Mundo Letras** usando **Android Studio Nativo** (NO Capacitor/Cordova).

### **Archivos Generados:**
- **APK Debug**: `app-debug.apk`
- **APK Release**: `app_mundoletras-release.apk`
- **Keystore**: `mundoletras-release-key.keystore`

---

## 🗂️ **ESTRUCTURA DEL PROYECTO**

### **Ubicación del Proyecto:**
```
C:\SistemaApps\MundoLetras\
```

### **Archivos Principales:**
- **MainActivity**: `C:\SistemaApps\MundoLetras\app\src\main\java\com\colisan\mundoletras\MainActivity.kt`
- **AndroidManifest.xml**: `C:\SistemaApps\MundoLetras\app\src\main\AndroidManifest.xml`
- **build.gradle**: `C:\SistemaApps\MundoLetras\app\build.gradle`
- **Keystore**: `C:\SistemaApps\MundoLetras\mundoletras-release-key.keystore`

### **APKs Generadas:**
- **Debug**: `C:\SistemaApps\MundoLetras\app\build\outputs\apk\debug\app-debug.apk`
- **Release**: `C:\SistemaApps\MundoLetras\app\build\outputs\apk\debug\app_mundoletras-release.apk`

---

## 🔧 **CONFIGURACIÓN INICIAL**

### **1. MainActivity.kt**
```kotlin
package com.colisan.mundoletras;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.net.Uri;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.JavascriptInterface;

public class MainActivity extends Activity {
    private WebView webView;
    private ValueCallback<Uri[]> mFilePathCallback;
    private static final int FILECHOOSER_RESULTCODE = 1;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Crear WebView
        webView = new WebView(this);

        // Configurar WebView
        WebSettings webSettings = webView.getSettings();
        webSettings.setJavaScriptEnabled(true);
        webSettings.setDomStorageEnabled(true);
        webSettings.setAllowFileAccess(true);
        webSettings.setAllowContentAccess(true);
        webSettings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        webSettings.setLoadWithOverviewMode(true);
        webSettings.setUseWideViewPort(true);
        webSettings.setBuiltInZoomControls(false);
        webSettings.setDisplayZoomControls(false);
        webSettings.setCacheMode(WebSettings.LOAD_NO_CACHE); // IMPORTANTE: Forzar recarga
        webSettings.setSupportZoom(false);

        // Añadir JavaScript para comunicación
        webView.addJavascriptInterface(new Object() {
            @JavascriptInterface
            public void exitApp() {
                runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        finish();
                    }
                });
            }
        }, "Android");

        // Configurar cliente web
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                view.loadUrl(url);
                return true;
            }
        });

        // Configurar WebChromeClient para file inputs
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView webView, ValueCallback<Uri[]> filePathCallback, FileChooserParams fileChooserParams) {
                if (mFilePathCallback != null) {
                    mFilePathCallback.onReceiveValue(null);
                }
                mFilePathCallback = filePathCallback;

                Intent intent = new Intent(Intent.ACTION_GET_CONTENT);
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                intent.setType("*/*");

                try {
                    startActivityForResult(Intent.createChooser(intent, "Seleccionar archivo"), FILECHOOSER_RESULTCODE);
                    return true;
                } catch (ActivityNotFoundException e) {
                    mFilePathCallback = null;
                    return false;
                }
            }
        });

        // Cargar aplicación web
        webView.loadUrl("https://colisan.com/sistema_apps_upload/app_mundoletras.html");

        // Establecer como contenido principal
        setContentView(webView);
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);

        if (requestCode == FILECHOOSER_RESULTCODE) {
            if (mFilePathCallback != null) {
                Uri[] results = null;
                if (resultCode == Activity.RESULT_OK && data != null) {
                    String dataString = data.getDataString();
                    if (dataString != null) {
                        results = new Uri[]{Uri.parse(dataString)};
                    }
                }
                mFilePathCallback.onReceiveValue(results);
                mFilePathCallback = null;
            }
        }
    }
}
```

### **2. build.gradle (app level)**
```kotlin
plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
}

android {
    namespace = "com.colisan.mundoletras.app"
    compileSdk = 36

    defaultConfig {
        applicationId = "com.colisan.mundoletras.app"
        minSdk = 21
        targetSdk = 36
        versionCode = 1
        versionName = "1.0"
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
            setProperty("archivesBaseName", "app_mundoletras")
        }
    }
    
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_1_8
        targetCompatibility = JavaVersion.VERSION_1_8
    }
    
    kotlinOptions {
        jvmTarget = "1.8"
    }
}

dependencies {
    implementation(libs.androidx.core.ktx)
    implementation("androidx.appcompat:appcompat:1.6.1")
    implementation("com.google.android.material:material:1.9.0")
    implementation("androidx.constraintlayout:constraintlayout:2.1.4")
    testImplementation(libs.junit)
    androidTestImplementation(libs.androidx.junit)
    androidTestImplementation(libs.androidx.espresso.core)
}
```

### **3. AndroidManifest.xml**
```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools">

    <!-- Permisos para acceso a archivos -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />

    <application
        android:allowBackup="true"
        android:dataExtractionRules="@xml/data_extraction_rules"
        android:fullBackupContent="@xml/backup_rules"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.MundoLetras"
        android:usesCleartextTraffic="true">
        
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:label="@string/app_name"
            android:theme="@style/Theme.MundoLetras">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
```

---

## 🎨 **CAMBIO DE ICONOS**

### **Método 1: Android Studio Image Asset (RECOMENDADO)**

1. **Abrir Image Asset:**
   - Click derecho en carpeta `app` → **New** → **Image Asset**

2. **Configurar icono:**
   - **Asset Type**: `Launcher Icons (Adaptive and Legacy)`
   - **Name**: `ic_launcher`
   - **Foreground Layer**:
     - **Source Asset**: `Image`
     - **Path**: `tema_apps_api\mundoletras\img\Logo.png`
     - **Resize**: `100%`
   - **Background Layer**:
     - **Color**: `#1e3a8a` (azul del juego)

3. **Generar iconos:**
   - **Next** → **Finish**

### **Método 2: Reemplazo manual**

**Ubicaciones de iconos:**
```
C:\SistemaApps\MundoLetras\app\src\main\res\
├── mipmap-hdpi\ic_launcher.png (72x72px)
├── mipmap-mdpi\ic_launcher.png (48x48px)
├── mipmap-xhdpi\ic_launcher.png (96x96px)
├── mipmap-xxhdpi\ic_launcher.png (144x144px)
└── mipmap-xxxhdpi\ic_launcher.png (192x192px)
```

---

## 🔑 **CREACIÓN DE KEYSTORE**

### **Paso 1: Abrir Android Studio**
1. **Abrir** proyecto: `C:\SistemaApps\MundoLetras\`

### **Paso 2: Generar APK Firmada**
1. **Build** → **Generate Signed Bundle / APK**
2. **Selecciona** "APK" → **Next**
3. **Create new...** (crear nuevo keystore)

### **Paso 3: Configurar Keystore**
- **Key store path**: `C:\SistemaApps\MundoLetras\mundoletras-release-key.keystore`
- **Password**: (elegir contraseña segura)
- **Key alias**: `mundoletras`
- **Key password**: (misma contraseña)
- **Validity**: `25` años
- **Certificate**:
  - **First and Last Name**: Anabel Guerrero
  - **Organizational Unit**: (vacío)
  - **Organization**: (vacío)
  - **City or Locality**: Montmeló
  - **State or Province**: Barcelons
  - **Country Code**: `ES`

### **Paso 4: Generar APK**
1. **Selecciona** el keystore creado
2. **Build Variants**: `release`
3. **Destination Folder**: `C:\SistemaApps\MundoLetras\app\build\outputs\apk\debug`
4. **Create**

---

## 🚀 **GENERACIÓN DE APKs**

### **APK DEBUG**

1. **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
2. **Ubicación**: `C:\SistemaApps\MundoLetras\app\build\outputs\apk\debug\app-debug.apk`

### **APK RELEASE (FIRMADA)**

1. **Build** → **Generate Signed Bundle / APK**
2. **Selecciona** "APK" → **Next**
3. **Usa** keystore existente: `mundoletras-release-key.keystore`
4. **Build Variants**: `release`
5. **Destination Folder**: `C:\SistemaApps\MundoLetras\app\build\outputs\apk\debug`
6. **Create**
7. **Ubicación**: `C:\SistemaApps\MundoLetras\app\build\outputs\apk\debug\app_mundoletras-release.apk`

---

## ⚠️ **PROBLEMAS COMUNES Y SOLUCIONES**

### **1. Error de sintaxis en game.js**
- **Problema**: `Uncaught SyntaxError: Unexpected token 'else'`
- **Solución**: Verificar que el archivo en Hostalia esté actualizado
- **Prevención**: Usar `setCacheMode(WebSettings.LOAD_NO_CACHE)` en MainActivity

### **2. Error de compatibilidad de API**
- **Problema**: `Dependency requires compileSdk 36`
- **Solución**: Cambiar `compileSdk = 36` y `targetSdk = 36` en build.gradle

### **3. Error de keystore**
- **Problema**: `Unresolved reference 'archivesBaseName'`
- **Solución**: Usar `setProperty("archivesBaseName", "app_mundoletras")`

### **4. Caché de WebView**
- **Problema**: APK carga versión antigua del JavaScript
- **Solución**: `webSettings.setCacheMode(WebSettings.LOAD_NO_CACHE)`

---

## 📱 **INSTALACIÓN Y PRUEBAS**

### **1. Instalar APK**
- **Desinstalar** APK anterior
- **Instalar** nueva APK
- **Probar** funcionalidades

### **2. Verificar funcionalidades**
- ✅ **Botón "Jugar como Invitado"**
- ✅ **Botón "Salir"** (modal personalizado)
- ✅ **Icono personalizado**
- ✅ **Carga de niveles desde JSON**
- ✅ **Sistema de pistas**
- ✅ **Ranking**

---

## 🔄 **ACTUALIZACIONES FUTURAS**

### **Para actualizar la aplicación:**

1. **Modificar** archivos en `PARA_HOSTALIA/sistema_apps_upload/sistema_apps_api/mundoletras/`
2. **Subir** cambios a Hostalia
3. **Sync Project** en Android Studio
4. **Generar** nueva APK
5. **Instalar** y probar

### **Archivos importantes a mantener:**
- **Keystore**: `mundoletras-release-key.keystore` (¡NO PERDER!)
- **Contraseña del keystore** (¡NO PERDER!)
- **MainActivity.kt** (configuración WebView)

---

## 📝 **NOTAS IMPORTANTES**

1. **Proyecto Android Studio Nativo** (NO Capacitor/Cordova)
2. **WebView** carga desde `https://colisan.com/sistema_apps_upload/app_mundoletras.html`
3. **JavaScript Interface** para comunicación nativa
4. **Cache deshabilitado** para forzar recarga de archivos
5. **APK firmada** para distribución
6. **Iconos personalizados** con logo de Mundo Letras

---

## 🎯 **RESULTADO FINAL**

- **APK Debug**: `app-debug.apk` (para desarrollo)
- **APK Release**: `app_mundoletras-release.apk` (para distribución)
- **Keystore**: `mundoletras-release-key.keystore` (para firmar)
- **Icono**: Logo personalizado de Mundo Letras
- **Funcionalidad**: Completa con modal de salida personalizado

---

*Documento generado el: 26/09/2025*
*Proyecto: Mundo Letras - Android Studio Nativo*
