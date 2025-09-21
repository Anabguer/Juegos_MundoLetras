import React, { useEffect, useState } from 'react';
import { useUserStore } from './core/store';
import Login from './ui/Login';
import Mapa from './ui/Mapa';
import Juego from './ui/Juego';

type Route = 'login' | 'map' | 'game' | 'ranking' | 'settings' | 'profile';

function App() {
  const [currentRoute, setCurrentRoute] = useState<Route>('login');
  const { isAuthenticated, loginGuest } = useUserStore();

  // Router simple basado en hash
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1) || '/';
      
      switch (hash) {
        case '/':
        case '/login':
          setCurrentRoute('login');
          break;
        case '/map':
          setCurrentRoute('map');
          break;
        case '/game':
          setCurrentRoute('game');
          break;
        case '/ranking':
          setCurrentRoute('ranking');
          break;
        case '/settings':
          setCurrentRoute('settings');
          break;
        case '/profile':
          setCurrentRoute('profile');
          break;
        default:
          if (hash.startsWith('/level/')) {
            setCurrentRoute('game');
          } else {
            setCurrentRoute('map');
          }
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  // Auto-login como invitado si hay progreso guardado
  useEffect(() => {
    if (!isAuthenticated) {
      const savedProgress = localStorage.getItem('mundoletras_progress');
      if (savedProgress) {
        loginGuest();
        setCurrentRoute('map');
        window.location.hash = '#/map';
      }
    }
  }, [isAuthenticated, loginGuest]);

  // Proteger rutas que requieren autenticación
  if (!isAuthenticated && currentRoute !== 'login') {
    return <Login />;
  }

  // Renderizar componente según la ruta
  switch (currentRoute) {
    case 'login':
      return <Login />;
    
    case 'map':
      return <Mapa />;
    
    case 'game':
      return <Juego />;
    
    case 'ranking':
      return <RankingScreen />;
    
    case 'settings':
      return <SettingsScreen />;
    
    case 'profile':
      return <ProfileScreen />;
    
    default:
      return <Mapa />;
  }
}

// Pantalla de Ranking (placeholder)
function RankingScreen() {
  return (
    <div className="screen">
      <header style={{ padding: '1rem', textAlign: 'center', backgroundColor: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e40af', margin: 0 }}>
          🏆 Ranking Global
        </h1>
      </header>

      <main style={{ flex: 1, padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '4rem', marginBottom: '2rem' }}>🚧</div>
        <h2 style={{ marginBottom: '1rem', color: '#64748b' }}>Próximamente</h2>
        <p style={{ color: '#64748b', marginBottom: '2rem' }}>
          El ranking global estará disponible en la próxima actualización.
        </p>
        
        <button 
          className="btn btn-primary"
          onClick={() => window.location.hash = '#/map'}
        >
          🗺️ Volver al Mapa
        </button>
      </main>
    </div>
  );
}

// Pantalla de Ajustes (placeholder)
function SettingsScreen() {
  const [settings, setSettings] = useState({
    sound: true,
    vibration: true,
    theme: 'light',
    difficulty: 'normal'
  });

  const handleSettingChange = (key: string, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorage.setItem('mundoletras_settings', JSON.stringify(newSettings));
  };

  return (
    <div className="screen">
      <header style={{ padding: '1rem', textAlign: 'center', backgroundColor: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e40af', margin: 0 }}>
          ⚙️ Ajustes
        </h1>
      </header>

      <main style={{ flex: 1, padding: '2rem' }}>
        <div className="card" style={{ maxWidth: '500px', margin: '0 auto' }}>
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>Audio y Vibración</h3>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span>🔊 Sonidos</span>
              <button
                className={`btn btn-sm ${settings.sound ? 'btn-success' : 'btn-secondary'}`}
                onClick={() => handleSettingChange('sound', !settings.sound)}
              >
                {settings.sound ? 'ON' : 'OFF'}
              </button>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span>📳 Vibración</span>
              <button
                className={`btn btn-sm ${settings.vibration ? 'btn-success' : 'btn-secondary'}`}
                onClick={() => handleSettingChange('vibration', !settings.vibration)}
              >
                {settings.vibration ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>Apariencia</h3>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span>🎨 Tema</span>
              <select 
                className="input"
                style={{ width: 'auto', minWidth: '120px' }}
                value={settings.theme}
                onChange={(e) => handleSettingChange('theme', e.target.value)}
              >
                <option value="light">Claro</option>
                <option value="dark">Oscuro</option>
                <option value="auto">Automático</option>
              </select>
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <button 
              className="btn btn-primary"
              onClick={() => window.location.hash = '#/map'}
            >
              🗺️ Volver al Mapa
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

// Pantalla de Perfil (placeholder)
function ProfileScreen() {
  const { user, progress, isGuest, logout } = useUserStore();

  const handleLogout = () => {
    logout();
    window.location.hash = '#/login';
  };

  return (
    <div className="screen">
      <header style={{ padding: '1rem', textAlign: 'center', backgroundColor: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e40af', margin: 0 }}>
          👤 Mi Perfil
        </h1>
      </header>

      <main style={{ flex: 1, padding: '2rem' }}>
        <div className="card" style={{ maxWidth: '500px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>
              {isGuest ? '👤' : '👨‍💼'}
            </div>
            
            <h2 style={{ marginBottom: '0.5rem' }}>
              {isGuest ? 'Jugador Invitado' : user?.nombre}
            </h2>
            
            {!isGuest && user?.email && (
              <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
                {user.email}
              </p>
            )}
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>Estadísticas</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '0.5rem' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e40af' }}>
                  {progress?.nivel_max || 1}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  Nivel Máximo
                </div>
              </div>
              
              <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '0.5rem' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ea580c' }}>
                  {progress?.monedas || 0}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  Monedas
                </div>
              </div>
            </div>
          </div>

          {isGuest && (
            <div style={{ 
              backgroundColor: '#fef3c7', 
              border: '1px solid #f59e0b',
              borderRadius: '0.5rem',
              padding: '1rem',
              marginBottom: '2rem',
              textAlign: 'center'
            }}>
              <h4 style={{ color: '#92400e', marginBottom: '0.5rem' }}>
                ⚠️ Cuenta de Invitado
              </h4>
              <p style={{ color: '#92400e', fontSize: '0.85rem', marginBottom: '1rem' }}>
                Tu progreso solo se guarda en este dispositivo. Crea una cuenta para sincronizar entre dispositivos.
              </p>
              <button 
                className="btn btn-primary btn-sm"
                onClick={() => window.location.hash = '#/login'}
              >
                📝 Crear Cuenta
              </button>
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button 
              className="btn btn-secondary"
              onClick={() => window.location.hash = '#/map'}
            >
              🗺️ Volver al Mapa
            </button>
            
            <button 
              className="btn btn-danger"
              onClick={handleLogout}
            >
              🚪 {isGuest ? 'Salir' : 'Cerrar Sesión'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
