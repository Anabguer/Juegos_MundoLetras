import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Importar Capacitor para funcionalidad móvil
import { Capacitor } from '@capacitor/core'
import { StatusBar } from '@capacitor/status-bar'
import { SplashScreen } from '@capacitor/splash-screen'

// Configurar la app cuando esté lista
const initializeApp = async () => {
  // Configurar status bar en móvil
  if (Capacitor.isNativePlatform()) {
    await StatusBar.setBackgroundColor({ color: '#1e3a8a' });
    await StatusBar.setStyle({ style: 'dark' });
    
    // Ocultar splash screen después de un momento
    setTimeout(async () => {
      await SplashScreen.hide();
    }, 2000);
  }

  // Prevenir zoom en iOS
  document.addEventListener('gesturestart', function (e) {
    e.preventDefault();
  });

  // Configurar viewport para móvil
  const viewport = document.querySelector('meta[name=viewport]');
  if (!viewport) {
    const meta = document.createElement('meta');
    meta.name = 'viewport';
    meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
    document.head.appendChild(meta);
  }

  // Renderizar la aplicación
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
};

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}
