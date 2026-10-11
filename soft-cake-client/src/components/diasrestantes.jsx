import { useAuth } from './context/useAuth';

const VigenciaUsuario = () => {
    const { usuario } = useAuth();
    const dias = usuario?.dias_restantes;

    // Solo mostrar si es menor a 15 días
    if (dias === null || dias === undefined || dias >= 15) return null;

    const getEstilo = () => {
        if (dias <= 3)  return { bg: 'rgba(239,68,68,0.15)',  border: '#ef4444', color: '#ef4444', icon: 'pi-exclamation-triangle' };
        if (dias <= 7)  return { bg: 'rgba(251,146,60,0.15)', border: '#fb923c', color: '#fb923c', icon: 'pi-clock' };
        return              { bg: 'rgba(196,130,60,0.15)',  border: '#c4823c', color: '#c4823c', icon: 'pi-info-circle' };
    };

    const { bg, border, color, icon } = getEstilo();

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: bg,
            border: `1px solid ${border}`,
            borderRadius: '6px',
            padding: '0.4rem 0.7rem',
            marginTop: '0.5rem',
        }}>
            <i className={`pi ${icon}`} style={{ color, fontSize: '0.8rem' }} />
            <span style={{ color, fontSize: '0.75rem', fontWeight: 500 }}>
                {dias === 0
                    ? 'Tu cuenta expira hoy'
                    : `Tu cuenta expira en ${dias} día${dias === 1 ? '' : 's'}`
                }
            </span>
        </div>
    );
};

export default VigenciaUsuario;