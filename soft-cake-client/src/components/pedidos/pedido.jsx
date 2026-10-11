import { useState, useEffect, useRef } from "react";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { Tag } from "primereact/tag";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { ProgressSpinner } from "primereact/progressspinner";
import { useAuth } from "../context/useAuth";
import axios from "axios";
import { InputText } from "primereact/inputtext";

import AgregarPedido from "./agregar";
import DetallePedido from "./detallepedido";
import EditarPedido from "./editar";
import Ticket from "./ticket";

import { usePermisos } from "../context/permisoscontext";
import { PERMISOS, MODULOS } from "../constants/permisos";

function Pedidos() {
  const { usuario } = useAuth();

  const id_emisor = usuario?.id_emisor || null;

  const { tieneModulo, tienePermiso } = usePermisos();
  
  const accesoModulo = tieneModulo(MODULOS.PEDIDOS);

  const canAgregar = accesoModulo && tienePermiso(PERMISOS.AGREGAR);
  const canEditar = accesoModulo && tienePermiso(PERMISOS.EDITAR);
  const canEliminar = accesoModulo && tienePermiso(PERMISOS.ELIMINAR);    
  const canConfigurar = accesoModulo && tienePermiso(PERMISOS.CONFIGURAR)

  const [pedidos, setPedidos]       = useState([]);
  const [pagos, setPagos]           = useState([]);
  
  const [loading, setLoading]       = useState(false);
  const [dlgAgregar, setDlgAgregar] = useState(false);
  const [dlgEditar, setDlgEditar]   = useState(false);
  const [dlgDetalle, setDlgDetalle] = useState(false);
  const [pedidoSel, setPedidoSel]   = useState(null);

  const [pagina, setPagina]         = useState(1);
  const filasPorPagina = 10;
  const toast = useRef(null);

  const formatDate = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const [fechaInicio, setFechaInicio]     = useState(() => formatDate(new Date()));
  const [fechaFin, setFechaFin]           = useState(() => formatDate(new Date()));
  const [dlgTicket, setDlgTicket]         = useState(false);
  const [busqueda, setBusqueda]           = useState("");
  
  // Si no hay acceso al módulo
  if (!accesoModulo) {
    return (
      <div className="p-4">
          <h3>No tienes acceso a este módulo</h3>
          <p>Módulo requerido: PEDIDOS </p>
      </div>
    );
  }

  useEffect(() => {
    if (pedidoSel && dlgDetalle) {
      const updatedGroup = getGrupo(pedidoSel.id);
      if (JSON.stringify(updatedGroup) !== JSON.stringify(pedidoSel)) {
        setPedidoSel(updatedGroup);
      }
    }
  }, [pedidos, pagos, dlgDetalle, pedidoSel?.id]);


  const handleAbrirTicket = async (id) => {
    setDlgDetalle(false);
    const datos = await cargarPedidos();          
    if (datos) {
      setPedidoSel(getGrupoDesde(id, datos.pedidos, datos.pagos));
    }
    setDlgTicket(true);
  };

  useEffect(() => {
    if (id_emisor) cargarPedidos();
  }, [id_emisor]);

const cargarPedidos = async () => {
  setLoading(true);
  try {
    const res = await axios.get(
      `${import.meta.env.VITE_API_URL}pe/GET.php?id_emisor=${id_emisor}`
    );
    let nuevosPedidos = [];
    let nuevosPagos = [];

    if (Array.isArray(res.data)) {
      nuevosPedidos = res.data;
    } else {
      nuevosPedidos = Array.isArray(res.data.pedidos) ? res.data.pedidos : [];
      nuevosPagos   = Array.isArray(res.data.pagos)   ? res.data.pagos   : [];
    }

    setPedidos(nuevosPedidos);
    setPagos(nuevosPagos);

    // Retorna los datos frescos para quien los necesite
    return { pedidos: nuevosPedidos, pagos: nuevosPagos };
  } catch {
    toast.current?.show({ severity: "error", summary: "Error", detail: "Error al cargar pedidos", life: 3000 });
    return null;
  } finally {
    setLoading(false);
  }
};

const getGrupos = () => {
    const map = new Map();
    pedidos.forEach(row => {
      if (!map.has(row.id)) map.set(row.id, []);
      map.get(row.id).push(row);
    });
    return Array.from(map.values());
  };

  const getGrupo = (id) => {
    const items = pedidos.filter(p => p.id === id);
    if (items.length === 0) return null;
    const first = items[0]; // cualquier item sirve para datos comunes
    const pagosPed = pagos.filter(p => p.id_pedido === id);

    // Obtener recetas del pedido (puede venir desde el backend en first.recetas)
    const recetas = items
      .filter(i => i.tipo === 'R')
      .map(i => ({ id_prod: i.id_prod, cantidad: i.cantidad ?? 1 }));

    return {
      id,
      fecha_emision:     first.fecha_emision,
      fecha_entrega:     first.fecha_entrega,
      hora_entrega:      first.hora_entrega,
      destinatario:      first.destinatario,
      telefono_cliente:  first.telefono_cliente,
      origen:            first.origen,
      origenOtro:        first.origenOtro,
      url_img:           first.url_img,
      direccion_entrega: first.direccion_entrega,
      destino:           first.destino,
      importe_total:     items
        .filter(i => i.tipo !== "M")
        .reduce((acc, i) => acc + Number(i.importe ?? 0), 0),
      total_abonado:   Number(first.total_abonado ?? 0),
      saldo_pendiente: Number(first.saldo_pendiente ?? 0),
      pagos:           pagosPed,
      items,
      recetas,
    };
  };

  // getGrupo que acepta datos externos (para cuando el estado aún no se actualizó)
  const getGrupoDesde = (id, pedidosData, pagosData) => {
    const items = pedidos.filter(p => p.id === id);
    if (items.length === 0) return null;
    const first = items[0]; // cualquier item sirve para datos comunes
    const pagosPed = pagos.filter(p => p.id_pedido === id);

    // Obtener recetas del pedido (puede venir desde el backend en first.recetas)
    const recetas = items
      .filter(i => i.tipo === 'R')
      .map(i => ({ id_prod: i.id_prod, cantidad: i.cantidad ?? 1 }));

    return {
      id,
      fecha_emision:     first.fecha_emision,
      fecha_entrega:     first.fecha_entrega,
      hora_entrega:      first.hora_entrega,
      destinatario:      first.destinatario,
      telefono_cliente:  first.telefono_cliente,
      origen:            first.origen,
      origenOtro:        first.origenOtro,
      url_img:           first.url_img,
      direccion_entrega: first.direccion_entrega,
      destino:           first.destino,
      importe_total:     items
        .filter(i => i.tipo !== "M")
        .reduce((acc, i) => acc + Number(i.importe ?? 0), 0),
      total_abonado:   Number(first.total_abonado ?? 0),
      saldo_pendiente: Number(first.saldo_pendiente ?? 0),
      pagos:           pagosPed,
      items,
      recetas,
    };
  };

  const filtrarPorFecha = (data) => {
    if (!fechaInicio && !fechaFin) return data;
    return data.filter(items => {
      const fecha = items[0].fecha_emision;
      if (!fecha) return false;
      const f   = new Date(fecha);
      const ini = fechaInicio ? new Date(fechaInicio) : null;
      const fin = fechaFin    ? new Date(fechaFin)    : null;
      if (ini && f < ini) return false;
      if (fin && f > fin) return false;
      return true;
    });
  };

  const handleEditar = (id) => {

    setPedidoSel(getGrupo(id));
    setDlgEditar(true);
  };

  const handleDetalle = (id) => {
    setPedidoSel(getGrupo(id));
    setDlgDetalle(true);
  };

  const handleEliminar = (id) => {
    confirmDialog({
      message:         `¿Eliminar el pedido #${id}?`,
      header:          "Confirmar eliminación",
      icon:            "pi pi-exclamation-triangle",
      acceptClassName: "p-button-danger",
      acceptLabel:     "Eliminar",
      rejectLabel:     "Cancelar",
      accept: async () => {
        try {
          const res = await axios.delete(
            `${import.meta.env.VITE_API_URL}pe/DELETE.php`,
            { data: { id } }
          );
          if (res.data.success) {
            toast.current?.show({ severity: "success", summary: "Eliminado", detail: "Pedido eliminado", life: 3000 });
            cargarPedidos();
          }
        } catch {
          toast.current?.show({ severity: "error", summary: "Error", detail: "Error al eliminar", life: 3000 });
        }
      }
    });
  };


  const filtrarPorBusqueda = (data) => {
    if (!busqueda.trim()) return data;
    const term = busqueda.trim().toLowerCase();
    return data.filter(items => {
      const first = items[0];
      const campos = [
        first.id,
        first.destinatario,
        first.direccion_entrega,
        origenLabel(first.origen, first.origenOtro),
        ...items.map(i => i.descripcion)
      ];
      return campos.some(campo =>
        String(campo ?? "").toLowerCase().includes(term)
      );
    });
  };

  const origenLabel = (origen, origenOtro) => {
    const map = { P: "Punto de Venta", D: "Pedido Directo" };
    if (origen === 'O') {
      return origenOtro;
    }
    return map[origen] ?? origenOtro;
  };

  const tipoTag = (tipo) => {
    const map = {
      P: { label: "Producto",    color: "success" },
      C: { label: "Complemento", color: "info"    },
      M: { label: "Modificador", color: "warning" },
      R: { label: "Receta", color: "info" },

    };
    const t = map[tipo] ?? { label: tipo, color: null };
    return <Tag value={t.label} severity={t.color} />;
  };

  const grupos = filtrarPorBusqueda(filtrarPorFecha(getGrupos()));
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
      <ConfirmDialog />

    <div className="flex justify-content-between align-items-center mb-3">
      <h2 className="m-0">Pedidos</h2>

      <div className="flex gap-2">
        {canAgregar && (
          <Button
            label="Nuevo pedido"
            icon="pi pi-plus"
            onClick={() => setDlgAgregar(true)}
            style={{ background: "rgba(196,130,60,1)", border: "none" }}
          />
        )}
      </div>
    </div>

      {/* ── Filtro por fecha de entrega ── */}
      <div className="flex flex-wrap align-items-center gap-2 mb-3">
        <span className="text-sm text-500">F. Entrega:</span>
        <input
          type="date"
          value={fechaInicio}
          onChange={e => { setFechaInicio(e.target.value); setPagina(1); }}
          style={{ padding: "6px 10px", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "0.875rem" }}
        />
        <span className="text-500 text-sm">al</span>
        <input
          type="date"
          value={fechaFin}
          onChange={e => { setFechaFin(e.target.value); setPagina(1); }}
          style={{ padding: "6px 10px", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "0.875rem" }}
        />
        {(fechaInicio || fechaFin) && (
          <Button
            icon="pi pi-times"
            text
            size="small"
            tooltip="Limpiar filtro"
            onClick={() => { setFechaInicio(""); setFechaFin(""); setPagina(1); }}
          />
        )}
        <span className="text-500 text-sm">
          {grupos.length} pedido{grupos.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* ── Búsqueda general ── */}
      <div className="flex flex-wrap align-items-center gap-2 mb-3">
        <span className="pi pi-search text-500" />
        <InputText
          value={busqueda}
          onChange={e => { setBusqueda(e.target.value); setPagina(1); }}
          placeholder="Buscar por # pedido, destinatario, dirección, descripción..."
          style={{ width: "min(320px, 100%)" }}
        />
        {busqueda && (
          <Button
            icon="pi pi-times"
            text
            size="small"
            tooltip="Limpiar búsqueda"
            onClick={() => { setBusqueda(""); setPagina(1); }}
          />
        )}
      </div>

      {loading ? (
        <div className="flex justify-content-center p-5"><ProgressSpinner /></div>
      ) : pedidos.length === 0 ? (
        <div className="text-center p-5 text-color-secondary">No hay pedidos registrados</div>
      ) : grupos.length === 0 ? (
        <div className="text-center p-5 text-color-secondary">No hay pedidos en el rango de fechas seleccionado</div>
      ) : (
        <>
          <div style={{ overflowX: "auto", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ ...thStyle, width: 130 }}># </th>
                  <th style={thStyle}>F. EMISIÓN</th>
                  <th style={thStyle}>F. ENTREGA</th>
                  <th style={thStyle}>DESTINATARIO</th>
                  <th style={thStyle}>ORIGEN</th>
                  <th style={thStyle}>TIPO</th>
                  <th style={thStyle}>DESCRIPCIÓN</th>
                  <th style={thStyle}>IMPORTE</th>
                  <th style={thStyle}>ABONADO</th>
                  <th style={thStyle}>SALDO</th>
                  <th style={{ ...thStyle, width: 120 }}></th>
                </tr>
              </thead>
              <tbody>
                {gruposPagina.map((items) => {
                  const first = items[0];
                  const span  = items.length;
                  const saldo = Number(first.saldo_pendiente ?? 0);

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
                          <td rowSpan={span} style={tdGroup}>{item.destinatario}</td>
                          <td rowSpan={span} style={tdGroup}>{origenLabel(item.origen, item.origenOtro)}</td>
                        </>
                      )}
                      <td style={tdBase}>{tipoTag(item.tipo)}</td>
                      <td style={tdBase}>{item.descripcion}</td>
                      <td style={tdBase}>$ {Number(item.importe ?? 0).toFixed(2)}</td>
                      {i === 0 && (
                        <>
                          <td rowSpan={span} style={{ ...tdGroup, color: "green", fontWeight: "bold" }}>
                            $ {Number(first.total_abonado ?? 0).toFixed(2)}
                          </td>
                          <td rowSpan={span} style={{ ...tdGroup, fontWeight: "bold", color: saldo <= 0 ? "green" : "rgba(200,100,0,1)" }}>
                            {saldo <= 0 ? "✓ Liquidado" : `$ ${saldo.toFixed(2)}`}
                          </td>
                          <td rowSpan={span} style={{ ...tdGroup, width: 120 }}>
                            <div className="flex gap-1">
                              {canConfigurar && (
                                 <Button icon="pi pi-eye"    text rounded severity="info"    onClick={() => handleDetalle(item.id)} tooltip="Ver detalle" />
                              )}
                              {canEditar && (
                              <Button icon="pi pi-pencil" text rounded severity="warning" onClick={() => handleEditar(item.id)}  tooltip="Editar" />
                              )}
                              {canEliminar && (
                                <Button icon="pi pi-trash"  text rounded severity="danger"  onClick={() => handleEliminar(item.id)} tooltip="Eliminar" />
                              )}
                              
                            </div>
                          </td>
                        </>
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

      {canAgregar && (
        <Dialog visible={dlgAgregar} onHide={() => setDlgAgregar(false)}
          header="Nuevo pedido" style={{ width: "900px" }}
          modal draggable={false} resizable={false}>
          <AgregarPedido
            onSuccess={() => { setDlgAgregar(false); cargarPedidos(); }}
            onCancel={() => setDlgAgregar(false)} />
        </Dialog>
      )}

      {canEditar && (
        <Dialog visible={dlgEditar} onHide={() => setDlgEditar(false)}
          header="Editar pedido" style={{ width: "min(700px, 96vw)" }}
          modal draggable={false} resizable={false}>
          <EditarPedido
            pedido={pedidoSel}
            onSuccess={() => { setDlgEditar(false); cargarPedidos(); }}
            onCancel={() => setDlgEditar(false)} />
        </Dialog>
      )}


      {canConfigurar && (
        <Dialog visible={dlgDetalle} onHide={() => setDlgDetalle(false)}
          header={`Detalle pedido #${pedidoSel?.id ?? ""}`} style={{ width: "min(700px, 96vw)" }}
          modal draggable={false} resizable={false}>
          <DetallePedido
            pedido={pedidoSel}
            onPagoRegistrado={async () => { await cargarPedidos(); }}
            onAbrirTicket={() => handleAbrirTicket(pedidoSel?.id)}
          />
        </Dialog>        
      )}

      {canEliminar && (
        <Dialog visible={dlgTicket} onHide={() => setDlgTicket(false)}
          header={`Ticket pedido #${pedidoSel?.id ?? ""}`}
          style={{ width: "min(380px, 96vw)" }}
          modal draggable={false} resizable={false}>
          <Ticket
            pedido={pedidoSel}
            onCerrar={() => setDlgTicket(false)}
          />
        </Dialog>        
      )}

    </div>
  );
}

export default Pedidos;