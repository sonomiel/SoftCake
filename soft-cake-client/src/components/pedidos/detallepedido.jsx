import { useState, useEffect, useRef } from "react";
import { Button } from "primereact/button";
import { InputNumber } from "primereact/inputnumber";
import { Dropdown } from "primereact/dropdown";
import { Toast } from "primereact/toast";
import { TabView, TabPanel } from "primereact/tabview";
import { useAuth } from "../context/useAuth";
import axios from "axios";
import Ticket from "./ticket";

function DetallePedido({ pedido, onPagoRegistrado, onAbrirTicket }) {
  const { usuario } = useAuth();
  const id_emisor   = usuario?.id_emisor || null;
  const id_usuario = usuario?.id || null;

  const [metodosPago, setMetodosPago]     = useState([]);
  const [id_metodo_pago, setIdMetodoPago] = useState(null);
  const [importe, setImporte]             = useState(null);
  const [guardando, setGuardando]         = useState(false);
  const toast = useRef(null);

  useEffect(() => {
    if (!id_emisor) return;
    axios.get(`${import.meta.env.VITE_API_URL}catalogos/mp/GET.php?id_emisor=${id_emisor}`)
      .then(res => { if (Array.isArray(res.data)) setMetodosPago(res.data); })
      .catch(() => {});
  }, [id_emisor]);

  if (!pedido) return null;

  // Reconstruir grupos P + C + M
  const grupos = [];
  let grupoActual = null;
  (pedido.items ?? []).forEach(item => {
    if (item.tipo === "P") {
      grupoActual = { prod: item, comps: [], mods: [] };
      grupos.push(grupoActual);
    } else if (grupoActual && item.tipo === "C") {
      grupoActual.comps.push(item);
    } else if (grupoActual && item.tipo === "M") {
      grupoActual.mods.push(item);
    }
  });

  const primerProd     = pedido.items?.find(i => i.tipo === "P");
  const totalAbonado   = Number(primerProd?.total_abonado   ?? 0);
  const saldoPendiente = Number(primerProd?.saldo_pendiente ?? 0);
  const listaPagos     = pedido.pagos ?? [];

  const accent       = "rgba(196,130,60,1)";
  const accentBg     = "rgba(196,130,60,0.07)";
  const accentBorder = "rgba(196,130,60,0.25)";

  const handleAbonar = async () => {
    if (!importe || !id_metodo_pago) {
      toast.current?.show({ severity: "warn", summary: "Validación", detail: "Ingresa importe y método de pago", life: 3000 });
      return;
    }
    if (importe > saldoPendiente) {
      toast.current?.show({ severity: "warn", summary: "Validación", detail: "El abono supera el saldo pendiente", life: 3000 });
      return;
    }
    try {
      setGuardando(true);
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}pe/INSERT_PAGO.php`,
        {
          id_pedido: pedido.id,
          id_metodo_pago,
          importe,
          fecha: new Date().toLocaleDateString("en-CA"), // ← YYYY-MM-DD formato MySQL
          id_emisor,
          id_usuario
        }
      );
      if (res.data.success) {
        toast.current?.show({ severity: "success", summary: "Abono registrado", detail: `$ ${importe.toFixed(2)} registrado`, life: 3000 });
        setImporte(null);
        setIdMetodoPago(null);
       // await onPagoRegistrado?.();
        onAbrirTicket?.(pedido.id);
      } else throw new Error(res.data.error);
    } catch (e) {
      toast.current?.show({ severity: "error", summary: "Error", detail: e.message ?? "Error de red", life: 3000 });
    } finally {
      setGuardando(false);
    }
  };

  const campos = [
    { label: "#",                 valor: pedido.id,                icon: "pi pi-hashtag"       },
    { label: "Fecha de emisión",  valor: pedido.fecha_emision,     icon: "pi pi-calendar"      },
    { label: "Fecha de entrega",  valor: pedido.fecha_entrega,     icon: "pi pi-calendar-plus" },
    { label: "Destinatario",      valor: pedido.destinatario,      icon: "pi pi-user"          },
    { label: "Dirección entrega", valor: pedido.direccion_entrega, icon: "pi pi-map-marker"    },
  ];

  return (
    <div className="flex flex-column gap-2">
      <Toast ref={toast} />

      <TabView>
        {/* ── Tab Detalle ── */}
        <TabPanel header="Detalle" leftIcon="pi pi-list mr-2">
          <div className="flex flex-column gap-3 pt-2">

            {/* Info general */}
            <div style={{ borderRadius: 10, border: `1px solid ${accentBorder}`, overflow: "hidden" }}>
              {campos.map(({ label, valor, icon }, idx) => (
                <div key={label} className="flex align-items-center gap-2 px-3 py-2"
                  style={{
                    background: idx % 2 === 0 ? "#fff" : accentBg,
                    borderBottom: idx < campos.length - 1 ? `1px solid ${accentBorder}` : "none"
                  }}>
                  <i className={icon} style={{ color: accent, fontSize: "0.85rem", width: 16 }} />
                  <span className="text-500 text-sm" style={{ minWidth: 130 }}>{label}</span>
                  <span className="text-sm font-medium ml-auto text-right" style={{ maxWidth: 260 }}>
                    {valor ?? "—"}
                  </span>
                </div>
              ))}
            </div>

            {/* Grupos de productos */}
            {grupos.map((g, gi) => (
              <div key={gi} style={{ borderRadius: 10, border: `1px solid ${accentBorder}`, overflow: "hidden" }}>
                <div className="flex align-items-center gap-2 px-3 py-2" style={{ background: accent }}>
                  <i className="pi pi-box" style={{ color: "#fff", fontSize: "0.9rem" }} />
                  <span className="font-bold text-sm" style={{ color: "#fff" }}>
                    {grupos.length > 1 ? `Producto ${gi + 1}` : "Producto"}
                  </span>
                </div>

                <div className="flex align-items-center justify-content-between px-3 py-3"
                  style={{ background: accentBg, borderBottom: `1px solid ${accentBorder}` }}>
                  <span className="font-bold">{g.prod.descripcion}</span>
                  <span className="font-bold" style={{ color: accent }}>$ {Number(g.prod.importe).toFixed(2)}</span>
                </div>

                {g.comps.length > 0 && (
                  <div style={{ borderBottom: `1px solid ${accentBorder}` }}>
                    <div className="flex align-items-center gap-2 px-3 py-2"
                      style={{ background: "rgba(14,165,233,0.06)", borderBottom: "1px solid rgba(14,165,233,0.15)" }}>
                      <i className="pi pi-plus-circle" style={{ color: "#0ea5e9", fontSize: "0.8rem" }} />
                      <span className="text-xs font-bold uppercase" style={{ color: "#0ea5e9", letterSpacing: "0.06em" }}>Complementos</span>
                    </div>
                    {g.comps.map((c, ci) => (
                      <div key={ci} className="flex align-items-center justify-content-between px-3 py-2"
                        style={{ background: ci % 2 === 0 ? "#fff" : "rgba(14,165,233,0.03)", borderBottom: ci < g.comps.length - 1 ? "1px solid #f0f0f0" : "none" }}>
                        <div className="flex align-items-center gap-2">
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#0ea5e9", display: "inline-block" }} />
                          <span className="text-sm">{c.descripcion}</span>
                        </div>
                        {Number(c.importe) > 0
                          ? <span className="text-sm font-bold" style={{ color: "#0ea5e9" }}>+$ {Number(c.importe).toFixed(2)}</span>
                          : <span className="text-xs text-400">Incluido</span>
                        }
                      </div>
                    ))}
                  </div>
                )}

                {g.mods.length > 0 && (
                  <div style={{ borderBottom: `1px solid ${accentBorder}` }}>
                    <div className="flex align-items-center gap-2 px-3 py-2"
                      style={{ background: "rgba(234,179,8,0.06)", borderBottom: "1px solid rgba(234,179,8,0.2)" }}>
                      <i className="pi pi-sliders-h" style={{ color: "#ca8a04", fontSize: "0.8rem" }} />
                      <span className="text-xs font-bold uppercase" style={{ color: "#ca8a04", letterSpacing: "0.06em" }}>Modificadores</span>
                    </div>
                    <div className="flex flex-wrap gap-2 px-3 py-2">
                      {g.mods.map((m, mi) => (
                        <span key={mi} className="flex align-items-center gap-1 px-2 py-1 border-round-lg text-xs font-medium"
                          style={{ background: "rgba(234,179,8,0.1)", border: "1px solid rgba(234,179,8,0.3)", color: "#92400e" }}>
                          <i className="pi pi-check" style={{ fontSize: "0.65rem" }} />
                          {m.descripcion}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex align-items-center justify-content-between px-3 py-2"
                  style={{ background: accentBg, borderTop: `1px solid ${accentBorder}` }}>
                  <span className="text-sm text-500">
                    {grupos.length > 1 ? `Subtotal producto ${gi + 1}` : "Total del pedido"}
                  </span>
                  <span className="font-bold" style={{ color: accent }}>
                    $ {(Number(g.prod.importe) + g.comps.reduce((a, c) => a + Number(c.importe ?? 0), 0)).toFixed(2)}
                  </span>
                </div>
              </div>
            ))}

            {/* Total general si hay más de un producto */}
            {grupos.length > 1 && (
              <div className="flex align-items-center justify-content-between px-3 py-2"
                style={{ borderRadius: 10, background: accentBg, border: `2px solid ${accentBorder}` }}>
                <span className="font-bold text-sm">TOTAL DEL PEDIDO</span>
                <span className="font-bold" style={{ color: accent, fontSize: "1.1rem" }}>
                  $ {Number(pedido.importe_total).toFixed(2)}
                </span>
              </div>
            )}

            {/* Estado de pagos */}
            <div style={{ borderRadius: 10, border: "1px solid #e5e7eb", overflow: "hidden" }}>
              <div className="flex align-items-center gap-2 px-3 py-2"
                style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                <i className="pi pi-wallet" style={{ color: "#6b7280", fontSize: "0.85rem" }} />
                <span className="text-xs font-bold uppercase text-500" style={{ letterSpacing: "0.06em" }}>Estado de pagos</span>
              </div>

              <div className="flex align-items-center justify-content-between px-3 py-2"
                style={{ borderBottom: "1px solid #f0f0f0" }}>
                <span className="text-sm text-500">Total del pedido</span>
                <span className="text-sm font-bold">$ {Number(pedido.importe_total).toFixed(2)}</span>
              </div>

              {/* Lista de abonos */}
              {listaPagos.length > 0 && (
                <div style={{ borderBottom: "1px solid #f0f0f0" }}>
                  <div className="flex align-items-center gap-2 px-3 py-2"
                    style={{ background: "rgba(34,197,94,0.04)", borderBottom: "1px solid #f0f0f0" }}>
                    <i className="pi pi-list" style={{ color: "green", fontSize: "0.8rem" }} />
                    <span className="text-xs font-bold uppercase" style={{ color: "green", letterSpacing: "0.06em" }}>
                      Abonos registrados
                    </span>
                  </div>
                  {listaPagos.map((p, i) => (
                    <div key={i} className="flex align-items-center justify-content-between px-3 py-2"
                      style={{
                        borderBottom: i < listaPagos.length - 1 ? "1px solid #f0f0f0" : "none",
                        background: i % 2 === 0 ? "#fff" : "rgba(34,197,94,0.02)"
                      }}>
                      <div className="flex align-items-center gap-2">
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "green", display: "inline-block" }} />
                        <span className="text-sm text-500">
                          {p.fecha ? new Date(p.fecha).toLocaleDateString("es-MX") : "—"} — {p.metodo_pago ?? "—"}
                        </span>
                      </div>
                      <span className="text-sm font-bold" style={{ color: "green" }}>
                        $ {Number(p.importe).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex align-items-center justify-content-between px-3 py-2"
                style={{ borderBottom: "1px solid #f0f0f0" }}>
                <span className="text-sm text-500">Total abonado</span>
                <span className="text-sm font-bold" style={{ color: "green" }}>$ {totalAbonado.toFixed(2)}</span>
              </div>

              <div className="flex align-items-center justify-content-between px-3 py-2"
                style={{ background: saldoPendiente <= 0 ? "rgba(34,197,94,0.06)" : "rgba(200,100,0,0.05)" }}>
                <span className="text-sm font-bold">Saldo pendiente</span>
                <span className="font-bold" style={{ color: saldoPendiente <= 0 ? "green" : "rgba(200,100,0,1)", fontSize: "1rem" }}>
                  {saldoPendiente <= 0
                    ? <><i className="pi pi-check-circle mr-1" />Liquidado</>
                    : `$ ${saldoPendiente.toFixed(2)}`
                  }
                </span>
              </div>
            </div>

            {/* Registrar abono */}
            {saldoPendiente > 0 && (
              <div style={{ borderRadius: 10, border: `1px dashed ${accentBorder}`, overflow: "hidden" }}>
                <div className="flex align-items-center gap-2 px-3 py-2"
                  style={{ background: accentBg, borderBottom: `1px solid ${accentBorder}` }}>
                  <i className="pi pi-plus" style={{ color: accent, fontSize: "0.85rem" }} />
                  <span className="text-sm font-bold" style={{ color: accent }}>Registrar abono</span>
                </div>
                <div className="flex gap-2 px-3 py-3">
                  <Dropdown value={id_metodo_pago} options={metodosPago}
                    optionLabel="metodo_pago" optionValue="id"
                    onChange={e => setIdMetodoPago(e.value)}
                    placeholder="Método de pago" className="flex-1" />
                  <InputNumber value={importe} onValueChange={e => setImporte(e.value)}
                    mode="currency" currency="MXN" locale="es-MX"
                    min={0} max={saldoPendiente} placeholder="Importe" className="flex-1" />
                  <Button icon="pi pi-check"
                    style={{ background: accent, border: "none" }}
                    loading={guardando} onClick={handleAbonar} tooltip="Registrar abono" />
                </div>
              </div>
            )}
          </div>
        </TabPanel>

        {/* ── Tab Ticket ── */}
        <TabPanel header="Ticket" leftIcon="pi pi-print mr-2">
          <div className="pt-3 flex justify-content-center">
            <Button
              label="Ver ticket completo"
              icon="pi pi-print"
              style={{ background: "rgba(196,130,60,1)", border: "none" }}
              onClick={() => onAbrirTicket?.()}
            />
          </div>
        </TabPanel>
      </TabView>
    </div>
  );
}

export default DetallePedido;