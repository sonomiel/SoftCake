import { useAuth } from './context/useAuth';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Inicio.css';

function Inicio() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  const hora = new Date().getHours();
  const saludo =
    hora < 12 ? 'Buenos días' :
    hora < 19 ? 'Buenas tardes' :
                'Buenas noches';

  const tarjetas = [
    { icon: 'pi-cart-arrow-down',        label: 'Insumos',            desc: 'Gestiona tu inventario',    color: '#c4823c', ruta: '/insumos' },
    { icon: 'pi-arrow-right-arrow-left', label: 'Entradas y Salidas', desc: 'Registra movimientos',      color: '#a86830', ruta: '/entradas-salidas' },
    { icon: 'pi-building',               label: 'Almacenes',          desc: 'Administra ubicaciones',    color: '#8c5a28', ruta: '/catalogos/almacenes' },
    { icon: 'pi-briefcase',              label: 'Proveedores',        desc: 'Directorio de proveedores', color: '#c4823c', ruta: '/catalogos/proveedores' },
  ];

  return (
    <div className="inicio-wrapper">

      {/* Saludo */}
      <div className="inicio-fade" style={{ animationDelay: '0ms' }}>
        <p className="inicio-eyebrow">{saludo}</p>
        <h1 className="inicio-title">{usuario?.username || 'Bienvenido'}</h1>
        <p className="inicio-subtitle">Aquí tienes un resumen rápido de tu sistema.</p>
      </div>

      <div className="inicio-divider inicio-fade" style={{ animationDelay: '150ms' }} />

      {/* Acceso rápido */}
      <div className="inicio-fade" style={{ animationDelay: '200ms' }}>
        <p className="inicio-section-label">Acceso rápido</p>
        <div className="inicio-cards-grid">
          {tarjetas.map((t, i) => (
            <div
              key={i}
              className="inicio-card inicio-fade"
              style={{ animationDelay: `${250 + i * 60}ms` }}
              onClick={() => navigate(t.ruta)}
            >
              <div className="inicio-icon-wrap" style={{ background: `${t.color}18` }}>
                <i className={`pi ${t.icon}`} style={{ color: t.color, fontSize: '1.2rem' }} />
              </div>
              <div>
                <div className="inicio-card-label">{t.label}</div>
                <div className="inicio-card-desc">{t.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="inicio-fade" style={{ animationDelay: '550ms', marginTop: '2rem' }}>
        <p className="inicio-section-label">Sistema</p>
        <div className="inicio-stats-grid">
          {[
            { label: 'Versión',         value: '1.0.0' },
            { label: 'Módulos activos', value: '4' },
            { label: 'Emisor',          value: usuario?.id_emisor ?? '—' },
          ].map((s, i) => (
            <div key={i} className="inicio-stat">
              <span className="inicio-stat-label">{s.label}</span>
              <span className="inicio-stat-value">{s.value}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

export default Inicio;