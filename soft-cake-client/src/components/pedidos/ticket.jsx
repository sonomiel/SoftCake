import { useRef } from "react";
import { Button } from "primereact/button";

function Ticket({ pedido, onCerrar }) {
  const ticketRef = useRef(null);

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
  const totalAbonado   = Number(primerProd?.total_abonado   ?? pedido.total_abonado   ?? 0);
  const saldoPendiente = Number(primerProd?.saldo_pendiente ?? pedido.saldo_pendiente ?? 0);
  const importeTotal   = Number(pedido.importe_total ?? grupos.reduce((acc, g) => {
    return acc + Number(g.prod.importe ?? 0) + g.comps.reduce((a, c) => a + Number(c.importe ?? 0), 0);
  }, 0));
  const listaPagos = pedido.pagos ?? [];

  const handleImprimir = () => {
    const contenido = ticketRef.current.innerHTML;
    const ventana   = window.open("", "_blank", "width=400,height=700");
    ventana.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <title>Ticket #${pedido.id}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Courier New', Courier, monospace;
              font-size: 12px;
              width: 80mm;
              padding: 6mm 4mm;
              color: #000;
            }
             @media print {
              body { width: 80mm; }
              @page { margin: 0; size: 80mm auto; }
            }
          </style>
        </head>
        <body>${contenido}</body>
      </html>
    `);
    ventana.document.close();
    ventana.focus();
    setTimeout(() => { ventana.print(); ventana.close(); }, 300);
  };

  const estiloTicket = {
    fontFamily: "'Courier New', Courier, monospace",
    fontSize:   "11px",
    width:      "100%",
    maxWidth:   "300px",
    margin:     "0 auto",
    color:      "#111",
    lineHeight: "1.6"
  };

  const Sep  = () => <hr style={{ border: "none", borderTop: "1px dashed #aaa", margin: "6px 0" }} />;
  const Sep2 = () => <hr style={{ border: "none", borderTop: "2px solid #555", margin: "6px 0" }} />;
  const Fila = ({ label, valor, bold, color }) => (
    <div style={{ display: "flex", justifyContent: "space-between", margin: "2px 0" }}>
      <span style={{ fontWeight: bold ? "bold" : "normal" }}>{label}</span>
      <span style={{ fontWeight: bold ? "bold" : "normal", color: color ?? "inherit" }}>{valor}</span>
    </div>
  );

  return (
    <div>
      <div ref={ticketRef} style={estiloTicket}>

        {/* Encabezado */}
        <div style={{ textAlign: "center", marginBottom: 6 }}>
          <div style={{ fontWeight: "bold", fontSize: 15, letterSpacing: 1 }}>🎂 PEDIDO</div>
          <div style={{ fontSize: 10, color: "#555" }}>Pedido</div>
        </div>

        <Sep2 />

        <Fila label="Folio:"   valor={pedido.id} bold />
        <Fila label="Emisión:" valor={pedido.fecha_emision} />
        <Fila label="Entrega:" valor={pedido.fecha_entrega} bold />
        <Fila label="Impresión:" valor={new Date().toLocaleDateString("es-MX", {
          day: "2-digit", month: "2-digit", year: "numeric",
          hour: "2-digit", minute: "2-digit"
        })} />
        <Sep />

        <div style={{ marginBottom: 4 }}>
          <div style={{ fontWeight: "bold", fontSize: 10, textTransform: "uppercase", color: "#555", marginBottom: 2 }}>Para:</div>
          <div style={{ fontWeight: "bold" }}>{pedido.destinatario}</div>
          <div style={{ fontSize: 10, color: "#444", marginTop: 2 }}>{pedido.direccion_entrega}</div>
        </div>

        <Sep />

        {/* Productos */}
        <div style={{ marginBottom: 4 }}>
          <div style={{ fontWeight: "bold", fontSize: 10, textTransform: "uppercase", color: "#555", marginBottom: 4 }}>
            Productos ({grupos.length}):
          </div>
          {grupos.map((g, gi) => {
            const subtotalComps = g.comps.reduce((a, c) => a + Number(c.importe ?? 0), 0);
            const subtotal      = Number(g.prod.importe ?? 0) + subtotalComps;
            return (
              <div key={gi} style={{ marginBottom: 6 }}>
                {grupos.length > 1 && (
                  <div style={{ fontSize: 9, color: "#888", marginBottom: 2 }}>
                    ── Producto {gi + 1} ──────────────
                  </div>
                )}
                <Fila label={g.prod.descripcion} valor={`$ ${Number(g.prod.importe).toFixed(2)}`} bold />
                {g.comps.map((c, ci) => (
                  <div key={ci} style={{ display: "flex", justifyContent: "space-between", paddingLeft: 8, color: "#333", fontSize: 10, margin: "1px 0" }}>
                    <span>+ {c.descripcion}</span>
                    {Number(c.importe) > 0
                      ? <span>+$ {Number(c.importe).toFixed(2)}</span>
                      : <span style={{ color: "#999" }}>incl.</span>
                    }
                  </div>
                ))}
                {g.mods.length > 0 && (
                  <div style={{ paddingLeft: 8, marginTop: 2 }}>
                    {g.mods.map((m, mi) => (
                      <span key={mi} style={{ display: "inline-block", padding: "0 4px", border: "1px solid #999", borderRadius: 3, fontSize: 9, marginRight: 3, marginTop: 2 }}>
                        {m.descripcion}
                      </span>
                    ))}
                  </div>
                )}
                {(g.comps.length > 0 || grupos.length > 1) && (
                  <div style={{ display: "flex", justifyContent: "space-between", paddingLeft: 8, fontSize: 10, color: "#555", marginTop: 3, borderTop: "1px dotted #ccc", paddingTop: 2 }}>
                    <span>Subtotal</span>
                    <span>$ {subtotal.toFixed(2)}</span>
                  </div>
                )}
                {gi < grupos.length - 1 && <Sep />}
              </div>
            );
          })}
        </div>

        <Sep2 />

        {/* Total */}
        <Fila label="TOTAL" valor={`$ ${importeTotal.toFixed(2)}`} bold />

        {/* Abonos detallados */}
        {listaPagos.length > 0 && (
          <>
            <Sep />
            <div style={{ marginBottom: 4 }}>
              <div style={{ fontWeight: "bold", fontSize: 10, textTransform: "uppercase", color: "#555", marginBottom: 3 }}>
                Abonos:
              </div>
              {listaPagos.map((p, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 10, margin: "2px 0" }}>
                  <span style={{ color: "#444" }}>
                    {p.fecha ? new Date(p.fecha).toLocaleDateString("es-MX") : "—"} · {p.metodo_pago ?? "—"}
                  </span>
                  <span style={{ color: "green" }}>$ {Number(p.importe).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </>
        )}

        <Sep />

        <Fila label="Total abonado"  valor={`$ ${totalAbonado.toFixed(2)}`} color="green" />
        <Fila
          label="Saldo pendiente"
          valor={saldoPendiente <= 0 ? "✓ LIQUIDADO" : `$ ${saldoPendiente.toFixed(2)}`}
          bold
          color={saldoPendiente <= 0 ? "green" : "#c85000"}
        />

        <Sep />

        <div style={{ textAlign: "center", fontSize: 9, color: "#888", marginTop: 4 }}>
          Gracias por tu pedido ♥
        </div>
      </div>

      <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center", marginTop: 16 }}>
        <Button
          label="Imprimir"
          icon="pi pi-print"
          style={{ background: "rgba(196,130,60,1)", border: "none" }}
          onClick={handleImprimir}
        />
        {onCerrar && (
          <Button
            label="Cerrar"
            icon="pi pi-times"
            outlined
            severity="secondary"
            onClick={onCerrar}
          />
        )}
      </div>
    </div>
  );
}

export default Ticket;