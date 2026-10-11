import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/useAuth';
import './login.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [alert, setAlert] = useState(null); // { type: 'err' | 'warn', message: string }

  const { login, loading, error, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const mensajeEstado = location.state?.mensaje || null;

  useEffect(() => {
    if (mensajeEstado) {
      setAlert({ type: 'warn', message: mensajeEstado });
      window.history.replaceState({}, document.title);
    }
  }, [mensajeEstado]);

useEffect(() => {
    if (error) {
      setAlert({ type: 'err', message: error });
      const t = setTimeout(() => {
        clearError();
        setAlert(null);
      }, 5000);
      return () => clearTimeout(t);
    }
  }, [error]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlert(null);
    clearError();
    const result = await login(username, password);
    if (result.success) {
      navigate('/');
    } else if (result.error) {
      setAlert({ type: 'err', message: result.error });
    }
  };

  const handleForgotPassword = () => {
  };

  return (
    <div className="login-page">
      {/* Panel decorativo izquierdo */}
      <div className="login-deco">
        <div className="deco-circle" />
        <div className="deco-circle" />
        <div className="deco-circle" />
        <div className="deco-content">
          <span className="deco-icon">🍰</span>
          <div className="deco-title">
            Sistema<br />de Venta
          </div>
          <div className="deco-divider" />
          <div className="deco-subtitle">Gestión &amp; Control</div>
        </div>
      </div>

      {/* Panel formulario derecho */}
      <div className="login-form-panel">
        <div className="form-wrapper">
          <div className="form-eyebrow">Bienvenido</div>
          <h1 className="form-title">
            Iniciar<br />Sesión
          </h1>
          <p className="form-tagline">Ingresa tus credenciales para continuar</p>

          {/* Alerta */}
          {alert && (
            <div className={`alert-${alert.type === 'err' ? 'error' : 'expired'}`}>
              <i className={`pi ${alert.type === 'err' ? 'pi-times-circle' : 'pi-exclamation-triangle'}`} />
              {alert.message}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Usuario */}
            <div className="field">
              <label htmlFor="username">Usuario</label>
              <div className="input-wrapper">
                <i className="pi pi-user" />
                <input
                  id="username"
                  type="text"
                  placeholder="Ingresa tu usuario"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            {/* Contraseña */}
            <div className="field">
              <label htmlFor="password">Contraseña</label>
              <div className="input-wrapper">
                <i className="pi pi-lock" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Ingresa tu contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  <i className={`pi ${showPassword ? 'pi-eye-slash' : 'pi-eye'}`} />
                </button>
              </div>
            </div>

            {/* Olvidé contraseña 
            <div style={{ textAlign: 'right', marginBottom: '1.25rem' }}>
              <button
                type="button"
                onClick={handleForgotPassword}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  color: '#c4823c',
                  fontFamily: "'Jost', sans-serif",
                  textDecoration: 'underline',
                  padding: 0,
                }}
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
        */}
            {/* Botón submit */}
            <button
              type="submit"
              className="btn-login"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner" />
                  Verificando...
                </>
              ) : (
                'Ingresar al sistema'
              )}
            </button>
          </form>

          <div className="form-footer">
            Sistema Pastelero © {new Date().getFullYear()}
            {/* 
            <div style={{ fontSize: '0.65rem', marginTop: '0.35rem' }}>
              Versión 2.0 | Todos los derechos reservados
            </div>
            */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
