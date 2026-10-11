import { useState, useEffect, useRef } from "react";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { Tag } from "primereact/tag";
import { Card } from "primereact/card";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { ProgressSpinner } from "primereact/progressspinner";
import { useAuth } from "../../context/useAuth";
import axios from "axios";
import { usePermisos } from "../../context/permisoscontext";
import { MODULOS } from "../../constants/permisos";

function Produciendo() {
  const { usuario } = useAuth();
  
  const id_emisor = usuario?.id_emisor || null;
  const id_usuario = usuario?.id_usuario || null;

  const { tieneModulo } = usePermisos();

  const accesoModulo = tieneModulo(MODULOS.PEDIDOS);

  const [pedidos,        setPedidos]        = useState([]);
  const [loading,        setLoading]        = useState(false);
  const [pagina,         setPagina]         = useState(1);
  const [showAsignar,    setShowAsignar]    = useState(false);
  const [pedidoSelected, setPedidoSelected] = useState(null);

  // ── Empleados ─────────────────────────────────────────────
  const [empleados,       setEmpleados]       = useState([]);
  const [loadingEmp,      setLoadingEmp]      = useState(false);
  const [empleadoSel,     setEmpleadoSel]     = useState(null);
  const [loadingAsignar,  setLoadingAsignar]  = useState(false);

  const toast          = useRef(null);
  const filasPorPagina = 10;

  // ✅ Hooks antes del return condicional
  useEffect(() => {
    if (id_emisor) {
      cargarPedidos();
      cargarEmpleados();
    }
  }, [id_emisor]);

  if (!accesoModulo) {
    return (
      <div className="p-4">
        <Card className="shadow-3 text-center">
          <h3>No tienes acceso a este módulo</h3>
          <p>Módulo requerido: PEDIDOS</p>
        </Card>
      </div>
    );
  }

  const cargarPedidos = async () => {
    setLoading(true);
    try {
      const res  = await axios.get(
        `${import.meta.env.VITE_API_URL}pe/GET_PE.php?id_emisor=${id_emisor}`
      );
      const todos = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data.pedidos) ? res.data.pedidos : [];
      setPedidos(todos.filter(p => p.estatus === 2));
    } catch {
      toast.current?.show({ severity: "error", summary: "Error",
        detail: "Error al cargar pedidos", life: 3000 });
    } finally {
      setLoading(false);
    }
  };

  const cargarEmpleados = async () => {
    setLoadingEmp(true);
    try {
      const res     = await axios.get(`${import.meta.env.VITE_API_URL}catalogos/us/GET.php`);
      const opciones = res.data
        .filter(u => u.id_emisor === id_emisor)
        .map(u => ({ label: u.username, value: u.id }));
      setEmpleados(opciones);
    } catch {
      toast.current?.show({ severity: "error", summary: "Error",
        detail: "Error al cargar empleados", life: 3000 });
    } finally {
      setLoadingEmp(false);
    }
  };

// Los cambios son solo en el modal y en handleAsignar:

const handleAsignar = async () => {
    setLoadingAsignar(true);
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}pe/ESTATUS.php`,
        { 
          id:          pedidoSelected.id, 
          id_usuario: id_usuario, 
          estatus:     3 
        },
        { headers: { "Content-Type": "application/json" } }
      );
      if (res.data.success) {
        toast.current?.show({ severity: "success", summary: "Listo",
          detail: `Pedido #${pedidoSelected.id} actualizado ✅`, life: 3000 });
        cerrarModal();
        cargarPedidos();
      } else {
        toast.current?.show({ severity: "error", summary: "Error",
          detail: res.data.error || "Error al actualizar", life: 3000 });
      }
    } catch {
      toast.current?.show({ severity: "error", summary: "Error",
        detail: "Error de red", life: 3000 });
    } finally {
      setLoadingAsignar(false);
    }
  };

  const cerrarModal = () => {
    setShowAsignar(false);
    setPedidoSelected(null);
    setEmpleadoSel(null);
  };

  const getGrupos = () => {
    const map = new Map();
    pedidos.forEach(row => {
      if (!map.has(row.id)) map.set(row.id, []);
      map.get(row.id).push(row);
    });
    return Array.from(map.values());
  };

  const tipoTag = (tipo) => {
    const map = {
      P: { label: "Producto",    color: "success" },
      C: { label: "Complemento", color: "info"    },
      M: { label: "Modificador", color: "warning" }
    };
    const t = map[tipo] ?? { label: tipo, color: null };
    return <Tag value={t.label} severity={t.color} />;
  };

  const grupos       = getGrupos();
  const totalPaginas = Math.ceil(grupos.length / filasPorPagina);
  const gruposPagina = grupos.slice((pagina - 1) * filasPorPagina, pagina * filasPorPagina);

  const thStyle = {
    background: "#2d1a0e", color: "#fff", padding: "10px 12px",
    textAlign: "left", fontSize: "0.78rem", fontWeight: 600,
    letterSpacing: "0.05em", borderBottom: "2px solid #4a2e1a", whiteSpace: "nowrap"
  };
  const tdBase  = { padding: "10px 12px", fontSize: "0.875rem", borderBottom: "1px solid #e5e7eb", verticalAlign: "middle" };
  const tdGroup = { ...tdBase, verticalAlign: "middle", borderRight: "1px solid #e5e7eb" };

  return (
    <div className="p-3">
      <Toast ref={toast} />

      {loading ? (
        <div className="flex justify-content-center p-5"><ProgressSpinner /></div>
      ) : pedidos.length === 0 ? (
        <div className="text-center p-5 text-color-secondary">No hay pedidos registrados</div>
      ) : grupos.length === 0 ? (
        <div className="text-center p-5 text-color-secondary">No hay pedidos en el rango seleccionado</div>
      ) : (
        <>
          <div style={{ overflowX: "auto", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ ...thStyle, width: 130 }}># ORDEN</th>
                  <th style={thStyle}>F. EMISIÓN</th>
                  <th style={thStyle}>F. ENTREGA</th>
                  <th style={thStyle}>PRODUCIENDO</th>
                  <th style={thStyle}>ORIGEN</th>
                  <th style={thStyle}>DESTINO</th>
                  <th style={thStyle}>TIPO</th>
                  <th style={thStyle}>DESCRIPCIÓN</th>
                  
                  <th style={{ ...thStyle, width: 80, textAlign: "center" }}></th>
                </tr>
              </thead>
              <tbody>
                {gruposPagina.map((items) => {
                  const first = items[0];
                  const span  = items.length;

                  let grupoColor = -1;
                  const coloresPorItem = items.map(item => {
                    if (item.tipo === "P") grupoColor++;
                    return grupoColor;
                  });

                  return items.map((item, i) => (
                    <tr key={`${item.id}-${item.id_prod}-${i}`}
                      style={{ background: coloresPorItem[i] % 2 === 0 ? "#fff" : "#fdf8f3" }}>
                      {i === 0 && (
                        <>
                          <td rowSpan={span} style={{ ...tdGroup, fontWeight: "bold" }}>{item.id}</td>
                          <td rowSpan={span} style={tdGroup}>{item.fecha_emision}</td>
                          <td rowSpan={span} style={tdGroup}>{item.fecha_entrega}</td>
                          <td rowSpan={span} style={tdGroup}>{item.username}</td>
                          <td rowSpan={span} style={tdGroup}>{item.origen}</td>
                          <td rowSpan={span} style={tdGroup}>{item.destino}</td>
                        </>
                      )}
                      <td style={tdBase}>{tipoTag(item.tipo)}</td>
                      <td style={tdBase}>{item.descripcion}</td>

                      {i === 0 && (
                        <td rowSpan={span} style={{ ...tdGroup, textAlign: "center" }}>
                          <Button
                            icon="pi pi-chevron-right"
                            rounded
                            style={{ background: "#22c55e", border: "none", color: "#fff" }}
                            tooltip="Terminar pedido"
                            tooltipOptions={{ position: "left" }}
                            onClick={() => { setPedidoSelected(first); setShowAsignar(true); }}
                          />
                        </td>
                      )}
                    </tr>
                  ));
                })}
              </tbody>
            </table>
          </div>

          {totalPaginas > 1 && (
            <div className="flex justify-content-center align-items-center gap-2 mt-3">
              <Button icon="pi pi-angle-double-left"  text onClick={() => setPagina(1)}            disabled={pagina === 1} />
              <Button icon="pi pi-angle-left"         text onClick={() => setPagina(p => p - 1)}   disabled={pagina === 1} />
              {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(p => (
                <Button key={p} label={String(p)} text={pagina !== p} onClick={() => setPagina(p)}
                  style={pagina === p ? { background: "rgba(196,130,60,1)", color: "#fff", border: "none" } : {}} />
              ))}
              <Button icon="pi pi-angle-right"        text onClick={() => setPagina(p => p + 1)}   disabled={pagina === totalPaginas} />
              <Button icon="pi pi-angle-double-right" text onClick={() => setPagina(totalPaginas)} disabled={pagina === totalPaginas} />
            </div>
          )}
        </>
      )}

      {/* Modal asignación */}
        <Dialog
        header={`Produciendo Pedido #${pedidoSelected?.id ?? ''}`}
        visible={showAsignar}
        onHide={cerrarModal}
        style={{ width: "95vw", maxWidth: "480px" }}
        breakpoints={{ "640px": "100vw" }}
        modal draggable={false} resizable={false}
        >
        {pedidoSelected && (
            <div className="p-fluid">
            <div className="mb-3 flex gap-4">
                <div>
                <span className="font-bold text-sm text-500">Pedido</span>
                <p className="mt-1 font-bold">#{pedidoSelected.id}</p>
                </div>
                <div>
                <span className="font-bold text-sm text-500">F. Entrega</span>
                <p className="mt-1">{pedidoSelected.fecha_entrega ?? '—'}</p>
                </div>
            </div>

            {/* ✅ Label con username en lugar del Dropdown */}
            <div className="field">
                <label className="font-bold block mb-1 text-sm text-500">Preparado por</label>
                <div className="flex align-items-center gap-2 p-3 border-round surface-100">
                <i className="pi pi-user text-primary" />
                <span className="font-bold">
                    {pedidoSelected.username ?? '—'}
                </span>
                </div>
            </div>

            <div className="flex justify-content-end gap-2 mt-4">
                <Button label="Cancelar" icon="pi pi-times"
                className="p-button-secondary" onClick={cerrarModal}
                disabled={loadingAsignar} />
                <Button
                label="Confirmar"
                icon="pi pi-check"
                style={{ background: "#22c55e", border: "none" }}
                onClick={handleAsignar}
                loading={loadingAsignar}
                />
            </div>
            </div>
        )}
        </Dialog>
    </div>
  );
}

export default Produciendo;