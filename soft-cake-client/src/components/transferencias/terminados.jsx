import { useState, useEffect, useRef } from "react";
import { Toast }           from "primereact/toast";
import { Tag }             from "primereact/tag";
import { Card }            from "primereact/card";
import { ProgressSpinner } from "primereact/progressspinner";
import { useAuth }         from "../context/useAuth";
import axios               from "axios";
import { usePermisos }     from "../context/permisoscontext";
import { MODULOS }         from "../constants/permisos";

// ── Destino meta ─────────────────────────────────────────────────────────────
const DESTINO_META = {
  P: { label: "Punto de venta", bg: "#3B82F6" },
  D: { label: "Pedido Directo", bg: "#10B981" },
  S: { label: "Abastecimiento", bg: "#F59E0B" },
};

const FILTROS = [
  { label: "Todos", value: "" },
  { label: "P · Punto de venta", value: "P" },
  { label: "D · Pedido Directo", value: "D" },
  { label: "S · Abastecimiento", value: "S" },
];

// ── Estilos ───────────────────────────────────────────────────────────────────
const TH = {
  background: "#1e1b4b", color: "#e0e7ff",
  padding: "9px 12px", textAlign: "left",
  fontSize: "0.72rem", fontWeight: 700,
  letterSpacing: "0.07em", borderBottom: "2px solid #312e81",
  whiteSpace: "nowrap",
};
const TH_C = { ...TH, textAlign: "center", width: 44 };
const TD   = { padding: "9px 12px", fontSize: "0.85rem", borderBottom: "1px solid #e5e7eb", verticalAlign: "middle" };
const TD_G = { ...TD, borderRight: "1px solid #e5e7eb" };

/**
 * Props:
 *   selectedIds   : string[]          — ids actualmente seleccionados (controlado desde el padre)
 *   onSelChange   : (ids: string[]) => void — callback cuando cambia la selección
 *   submitted     : boolean           — para mostrar error de validación
 */
function Terminado({ selectedIds = [], onSelChange, submitted = false }) {
  const { usuario }     = useAuth();
  const id_emisor       = usuario?.id_emisor || null;
  const { tieneModulo } = usePermisos();
  const accesoModulo    = tieneModulo(MODULOS.PEDIDOS);

  const [pedidos,  setPedidos]  = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [filtro,   setFiltro]   = useState("");
  const [pagina,   setPagina]   = useState(1);

  const toast          = useRef(null);
  const filasPorPagina = 10;
  const selSet         = new Set(selectedIds);

  useEffect(() => {
    if (id_emisor) cargarPedidos();
  }, [id_emisor]);

  // Resetear página al cambiar filtro
  useEffect(() => { setPagina(1); }, [filtro]);

  if (!accesoModulo) {
    return (
      <Card className="shadow-3 text-center p-4">
        <h3>No tienes acceso a este módulo</h3>
        <p>Módulo requerido: PEDIDOS</p>
      </Card>
    );
  }

  // ── Carga ────────────────────────────────────────────────────────────────
  const cargarPedidos = async () => {
    setLoading(true);
    try {
      const res  = await axios.get(
        `${import.meta.env.VITE_API_URL}pe/GET_PE.php?id_emisor=${id_emisor}`
      );
      const todos = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data.pedidos) ? res.data.pedidos : [];

      // Agrupar por id, solo estatus === 3
      const map = new Map();
      todos.filter(r => r.estatus === 3).forEach(r => {
        if (!map.has(r.id)) {
          map.set(r.id, {
            id:             r.id,
            fecha_emision:  r.fecha_emision,
            fecha_entrega:  r.fecha_entrega,
            destino:        r.destino || "",
            origen:         r.origen  || "",
            items:          [],
          });
        }
        map.get(r.id).items.push({ tipo: r.tipo, descripcion: r.descripcion });
      });

      setPedidos(Array.from(map.values()));
    } catch {
      toast.current?.show({ severity: "error", summary: "Error",
        detail: "Error al cargar pedidos", life: 3000 });
    } finally {
      setLoading(false);
    }
  };

  // ── Filtrado + paginación ─────────────────────────────────────────────────
  const filtrados    = filtro ? pedidos.filter(p => p.destino === filtro) : pedidos;
  const totalPags    = Math.ceil(filtrados.length / filasPorPagina);
  const pagActual    = filtrados.slice((pagina - 1) * filasPorPagina, pagina * filasPorPagina);
  const todosSel     = pagActual.length > 0 && pagActual.every(p => selSet.has(p.id));

  // ── Handlers de selección ─────────────────────────────────────────────────
  const toggle = (id) => {
    const next = selSet.has(id)
      ? selectedIds.filter(i => i !== id)
      : [...selectedIds, id];
    onSelChange?.(next);
  };

  const toggleTodos = () => {
    if (todosSel) {
      const visibles = new Set(pagActual.map(p => p.id));
      onSelChange?.(selectedIds.filter(i => !visibles.has(i)));
    } else {
      const faltantes = pagActual.filter(p => !selSet.has(p.id)).map(p => p.id);
      onSelChange?.([...selectedIds, ...faltantes]);
    }
  };

  // ── Helpers visuales ──────────────────────────────────────────────────────
  const destinoBadge = (d) => {
    const m = DESTINO_META[d];
    if (!m) return <span style={{ color: "#9CA3AF", fontSize: "0.78rem" }}>—</span>;
    return (
      <span style={{
        background: m.bg, color: "#fff",
        borderRadius: 5, padding: "2px 9px",
        fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.05em",
        cursor: "default",
      }} title={m.label}>{d}</span>
    );
  };

  const tipoTag = (tipo) => {
    const map = {
      P: { label: "Producto",    color: "success" },
      C: { label: "Complemento", color: "info"    },
      M: { label: "Modificador", color: "warning" },
    };
    const t = map[tipo] ?? { label: tipo, color: null };
    return <Tag value={t.label} severity={t.color} style={{ fontSize: "0.7rem" }} />;
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div>
      <Toast ref={toast} />

      {/* Cabecera: contador + filtros */}
      <div className="flex align-items-center justify-content-between flex-wrap gap-2 mb-2">
        <span className="font-bold text-sm">
          Pedidos terminados <span className="text-red-500">*</span>
          {selectedIds.length > 0 && (
            <span className="ml-2 font-normal text-color-secondary">
              ({selectedIds.length} seleccionado{selectedIds.length !== 1 ? "s" : ""})
            </span>
          )}
        </span>

        <div className="flex gap-1 flex-wrap">
          {FILTROS.map(f => (
            <button
              key={f.value}
              onClick={() => setFiltro(f.value)}
              style={{
                padding: "4px 12px", borderRadius: 20,
                border: "1.5px solid",
                borderColor: filtro === f.value ? "#6366F1" : "#D1D5DB",
                background:  filtro === f.value ? "#6366F1" : "transparent",
                color:       filtro === f.value ? "#fff"    : "#374151",
                fontSize: "0.78rem", fontWeight: 600, cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Contenedor tabla */}
      <div style={{
        border: submitted && selectedIds.length === 0 ? "1px solid #ef4444" : "1px solid #e5e7eb",
        borderRadius: 8, maxHeight: 340, overflowY: "auto",
      }}>
        {loading ? (
          <div className="flex justify-content-center p-4">
            <ProgressSpinner style={{ width: 40, height: 40 }} />
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ position: "sticky", top: 0, zIndex: 2 }}>
              <tr>
                <th style={TH_C}>
                  <input
                    type="checkbox"
                    checked={todosSel}
                    onChange={toggleTodos}
                    disabled={pagActual.length === 0}
                    title="Seleccionar página actual"
                    style={{ cursor: "pointer" }}
                  />
                </th>
                <th style={TH}># ORDEN</th>
                <th style={TH}>F. EMISIÓN</th>
                <th style={TH}>F. ENTREGA</th>
                <th style={TH}>ORIGEN</th>
                <th style={TH}>PRODUCTOS</th>
                <th style={{ ...TH, textAlign: "center" }}>DESTINO</th>
              </tr>
            </thead>
            <tbody>
              {pagActual.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: 24, textAlign: "center", color: "#9CA3AF" }}>
                    {pedidos.length === 0
                      ? "No hay pedidos terminados disponibles"
                      : "No hay pedidos con ese destino"}
                  </td>
                </tr>
              ) : (
                pagActual.map((p, idx) => {
                  const checked = selSet.has(p.id);
                  return (
                    <tr
                      key={p.id}
                      onClick={() => toggle(p.id)}
                      style={{
                        background: checked
                          ? "#EFF6FF"
                          : idx % 2 === 0 ? "#fff" : "#fafafa",
                        cursor: "pointer",
                        transition: "background 0.12s",
                      }}
                    >
                      {/* Checkbox */}
                      <td style={{ ...TD, textAlign: "center" }}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggle(p.id)}
                          onClick={e => e.stopPropagation()}
                          style={{ cursor: "pointer" }}
                        />
                      </td>

                      {/* # Orden */}
                      <td style={{ ...TD_G, fontWeight: 700, color: "#1e1b4b" }}>
                        #{p.id}
                      </td>

                      {/* Fechas */}
                      <td style={TD_G}>{p.fecha_emision}</td>
                      <td style={TD_G}>{p.fecha_entrega}</td>

                      {/* Origen */}
                      <td style={TD_G}>
                        <span style={{ fontSize: "0.82rem", color: "#6B7280" }}>{p.origen}</span>
                      </td>

                      {/* Productos: lista de chips tipo+descripcion */}
                      <td style={TD_G}>
                        <div className="flex flex-column gap-1">
                          {p.items.map((it, j) => (
                            <div key={j} className="flex align-items-center gap-1">
                              {tipoTag(it.tipo)}
                              <span style={{ fontSize: "0.82rem" }}>{it.descripcion}</span>
                            </div>
                          ))}
                        </div>
                      </td>

                      {/* Destino badge */}
                      <td style={{ ...TD, textAlign: "center" }}>
                        {destinoBadge(p.destino)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>

      {submitted && selectedIds.length === 0 && (
        <small className="p-error">Seleccione al menos un pedido</small>
      )}

      {/* Paginación */}
      {totalPags > 1 && (
        <div className="flex justify-content-center align-items-center gap-1 mt-2">
          <button onClick={() => setPagina(1)}          disabled={pagina === 1}          style={btnPag}>«</button>
          <button onClick={() => setPagina(p => p - 1)} disabled={pagina === 1}          style={btnPag}>‹</button>
          {Array.from({ length: totalPags }, (_, i) => i + 1).map(n => (
            <button key={n} onClick={() => setPagina(n)}
              style={{ ...btnPag, background: pagina === n ? "#6366F1" : "transparent",
                color: pagina === n ? "#fff" : "#374151", borderColor: pagina === n ? "#6366F1" : "#D1D5DB" }}>
              {n}
            </button>
          ))}
          <button onClick={() => setPagina(p => p + 1)} disabled={pagina === totalPags} style={btnPag}>›</button>
          <button onClick={() => setPagina(totalPags)}  disabled={pagina === totalPags} style={btnPag}>»</button>
        </div>
      )}
    </div>
  );
}

const btnPag = {
  padding: "4px 10px", borderRadius: 6, border: "1px solid #D1D5DB",
  background: "transparent", cursor: "pointer", fontSize: "0.82rem",
  color: "#374151", transition: "all 0.12s",
};

export default Terminado;