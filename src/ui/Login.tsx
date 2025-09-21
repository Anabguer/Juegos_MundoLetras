import React, { useState } from 'react';
import { useUserStore } from '../core/store';

export default function Login() {
  const [mode, setMode] = useState<'login' | 'register' | 'verify'>('login');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    nombre: '',
    verificationCode: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login, register, verifyCode, loginGuest } = useUserStore();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    setError('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const success = await login(formData.email, formData.password);
      if (success) {
        window.location.hash = '#/map';
      } else {
        setError('Email o contraseña incorrectos');
      }
    } catch (err) {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      setLoading(false);
      return;
    }

    try {
      const success = await register(formData.email, formData.password, formData.nombre);
      if (success) {
        setMode('verify');
      } else {
        setError('Error en el registro. El email puede estar ya en uso.');
      }
    } catch (err) {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const success = await verifyCode(formData.verificationCode);
      if (success) {
        // Ahora hacer login automático
        const loginSuccess = await login(formData.email, formData.password);
        if (loginSuccess) {
          window.location.hash = '#/map';
        } else {
          setMode('login');
          setError('Cuenta verificada. Ahora puedes iniciar sesión.');
        }
      } else {
        setError('Código de verificación incorrecto');
      }
    } catch (err) {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = () => {
    loginGuest();
    window.location.hash = '#/map';
  };

  return (
    <div className="screen" style={{ alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      {loading && (
        <div className="loading-overlay">
          <div className="loading-content">
            <div className="spinner"></div>
            <p>Procesando...</p>
          </div>
        </div>
      )}

      <div className="card" style={{ maxWidth: '400px', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔤</h1>
          <h2 style={{ color: '#1e40af', marginBottom: '0.5rem' }}>Mundo Letras</h2>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
            {mode === 'login' && 'Inicia sesión para sincronizar tu progreso'}
            {mode === 'register' && 'Crea tu cuenta para jugar'}
            {mode === 'verify' && 'Revisa tu email y introduce el código'}
          </p>
        </div>

        {error && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '0.5rem',
            padding: '0.75rem',
            marginBottom: '1rem',
            color: '#dc2626',
            fontSize: '0.875rem'
          }}>
            {error}
          </div>
        )}

        {mode === 'login' && (
          <form onSubmit={handleLogin}>
            <div className="input-group" style={{ marginBottom: '1rem' }}>
              <label className="label">Email</label>
              <input
                type="email"
                name="email"
                className="input"
                value={formData.email}
                onChange={handleInputChange}
                required
                placeholder="tu@email.com"
              />
            </div>

            <div className="input-group" style={{ marginBottom: '1.5rem' }}>
              <label className="label">Contraseña</label>
              <input
                type="password"
                name="password"
                className="input"
                value={formData.password}
                onChange={handleInputChange}
                required
                placeholder="••••••••"
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary"
              style={{ width: '100%', marginBottom: '1rem' }}
              disabled={loading}
            >
              🔑 Iniciar Sesión
            </button>

            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ width: '100%' }}
                onClick={() => setMode('register')}
              >
                📝 Crear Cuenta
              </button>
            </div>
          </form>
        )}

        {mode === 'register' && (
          <form onSubmit={handleRegister}>
            <div className="input-group" style={{ marginBottom: '1rem' }}>
              <label className="label">Nombre</label>
              <input
                type="text"
                name="nombre"
                className="input"
                value={formData.nombre}
                onChange={handleInputChange}
                required
                placeholder="Tu nombre"
              />
            </div>

            <div className="input-group" style={{ marginBottom: '1rem' }}>
              <label className="label">Email</label>
              <input
                type="email"
                name="email"
                className="input"
                value={formData.email}
                onChange={handleInputChange}
                required
                placeholder="tu@email.com"
              />
            </div>

            <div className="input-group" style={{ marginBottom: '1.5rem' }}>
              <label className="label">Contraseña</label>
              <input
                type="password"
                name="password"
                className="input"
                value={formData.password}
                onChange={handleInputChange}
                required
                placeholder="••••••••"
                minLength={6}
              />
              <small style={{ color: '#64748b', fontSize: '0.8rem' }}>
                Mínimo 6 caracteres
              </small>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary"
              style={{ width: '100%', marginBottom: '1rem' }}
              disabled={loading}
            >
              📝 Crear Cuenta
            </button>

            <div style={{ textAlign: 'center' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ width: '100%' }}
                onClick={() => setMode('login')}
              >
                ← Volver al Login
              </button>
            </div>
          </form>
        )}

        {mode === 'verify' && (
          <form onSubmit={handleVerify}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📧</div>
              <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
                Hemos enviado un código de verificación a:
              </p>
              <p style={{ fontWeight: 'bold', color: '#1e40af' }}>
                {formData.email}
              </p>
            </div>

            <div className="input-group" style={{ marginBottom: '1.5rem' }}>
              <label className="label">Código de Verificación</label>
              <input
                type="text"
                name="verificationCode"
                className="input"
                value={formData.verificationCode}
                onChange={handleInputChange}
                required
                placeholder="123456"
                style={{ textAlign: 'center', fontSize: '1.2rem', letterSpacing: '0.2em' }}
                maxLength={6}
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary"
              style={{ width: '100%', marginBottom: '1rem' }}
              disabled={loading}
            >
              ✅ Verificar Código
            </button>

            <div style={{ textAlign: 'center' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ width: '100%' }}
                onClick={() => setMode('register')}
              >
                ← Cambiar Email
              </button>
            </div>
          </form>
        )}

        {/* Separador */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          margin: '1.5rem 0',
          color: '#64748b',
          fontSize: '0.875rem'
        }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }}></div>
          <span style={{ padding: '0 1rem' }}>o</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }}></div>
        </div>

        {/* Login como invitado */}
        <button
          onClick={handleGuestLogin}
          className="btn btn-secondary"
          style={{ width: '100%' }}
        >
          👤 Jugar como Invitado
        </button>

        <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.8rem', color: '#64748b' }}>
          <p>
            Como invitado tu progreso se guarda localmente.
            <br />
            Crea una cuenta para sincronizar entre dispositivos.
          </p>
        </div>
      </div>
    </div>
  );
}
