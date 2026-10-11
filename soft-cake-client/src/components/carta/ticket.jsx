import { useRef } from "react";
import { Button } from "primereact/button";

function Ticket({ orden, items, descuentos = {}, cantidades = {}, onCerrar, metodoPago }) {
    const ticketRef = useRef(null);

  const grupos = items.reduce((acc, item) => {
    const g = item._grupo;
    if (!acc[g]) acc[g] = [];
    acc[g].push(item);
    return acc;
  }, {});

  const getImporte = (item) => {
    if (item.tipo !== "P") return Number(item.importe);
    const usaDescuento = descuentos[item._grupo] && item.precio_desc != null;
    return usaDescuento ? Number(item.precio_desc) : Number(item.importe);
  };

  const total = Object.entries(grupos).reduce((acc, [grupoId, grupoItems]) => {
    const cantidad = cantidades[grupoId] ?? 1;
    const subtotal = grupoItems.reduce((s, i) => s + getImporte(i), 0);
    return acc + subtotal * cantidad;
  }, 0);

  const handleImprimir = () => {
    const contenido = ticketRef.current.innerHTML;
    const ventana = window.open("", "_blank", "width=400,height=600");
    ventana.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <title>Ticket</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Courier New', monospace;
              font-size: 12px;
              width: 80mm;
              padding: 4mm;
              color: #000;
            }
            .centro    { text-align: center; }
            .derecha   { text-align: right; }
            .bold      { font-weight: bold; }
            .separador { border-top: 1px dashed #000; margin: 4px 0; }
            .row       { display: flex; justify-content: space-between; }
            .indent    { padding-left: 8px; }
            .sm        { font-size: 10px; }
            .lg        { font-size: 14px; }
            .xl        { font-size: 16px; }
            @media print {
              body { width: 80mm; }
              @page { margin: 0; size: 80mm auto; }
            }
          </style>
        </head>
        <body>
          ${contenido}
          <script>
            window.onload = () => { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    ventana.document.close();
  };

  const fecha = new Date();
  const fechaStr = fecha.toLocaleDateString("es-MX", {
    day: "2-digit", month: "2-digit", year: "numeric"
  });
  const horaStr = fecha.toLocaleTimeString("es-MX", {
    hour: "2-digit", minute: "2-digit"
  });

  return (
    <div className="flex flex-column gap-3">

      {/* Vista previa del ticket */}
      <div
        ref={ticketRef}
        style={{
          fontFamily: "'Courier New', monospace",
          fontSize: "12px",
          width: "100%",
          maxWidth: "80mm",
          margin: "0 auto",
          padding: "8px",
          background: "#fff",
          color: "#000",
          border: "1px dashed #ccc"
        }}
      >
        {/* Encabezado */}
        <div style={{ textAlign: "center", marginBottom: "6px" }}>
          <div style={{ fontWeight: "bold", fontSize: "14px" }}>★ ORDEN ★</div>
          <div style={{ fontSize: "10px" }}>{fechaStr} {horaStr}</div>
          <div style={{ fontWeight: "bold", fontSize: "13px", marginTop: "4px" }}>
            # {orden?.id_orden ?? "----------"}
          </div>
        </div>

        <div style={{ borderTop: "1px dashed #000", margin: "4px 0" }} />

        {/* Productos */}
        {Object.entries(grupos).map(([grupoId, grupoItems]) => {
          const producto   = grupoItems.find(i => i.tipo === "P");
          const comps      = grupoItems.filter(i => i.tipo === "C");
          const mods       = grupoItems.filter(i => i.tipo === "M");
          const cantidad   = cantidades[grupoId] ?? 1;
          const totalGrupo = grupoItems.reduce((acc, i) => acc + getImporte(i), 0) * cantidad;


          return (
            <div key={grupoId} style={{ marginBottom: "6px" }}>

              {/* Producto */}
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold" }}>
                <span>{cantidad > 1 ? `${cantidad}x ` : ""}{producto?._label}</span>
                <span>$ {getImporte(producto).toFixed(2)}</span>
              </div>

              {/* Complementos */}
              {comps.map(c => (
                <div key={c.id}
                  style={{ display: "flex", justifyContent: "space-between", paddingLeft: "8px", fontSize: "11px" }}>
                  <span>+ {c._label}</span>
                  {c.importe > 0 && <span>$ {Number(c.importe).toFixed(2)}</span>}
                </div>
              ))}

              {/* Modificadores */}
              {mods.length > 0 && (
                <div style={{ paddingLeft: "8px", fontSize: "11px", color: "#444" }}>
                  {mods.map(m => `• ${m._label}`).join("  ")}
                </div>
              )}

              {/* Subtotal grupo si tiene complementos */}
              {(comps.length > 0 || cantidad > 1) && (
                <div style={{ display: "flex", justifyContent: "space-between", paddingLeft: "8px", fontSize: "11px", borderTop: "1px dotted #ccc", marginTop: "2px" }}>
                  <span>{cantidad > 1 ? `Subtotal (x${cantidad})` : "Subtotal"}</span>
                  <span>$ {totalGrupo.toFixed(2)}</span>
                </div>
              )}
            </div>
          );
        })}

        <div style={{ borderTop: "1px dashed #000", margin: "4px 0" }} />

        {/* Método de pago */}
        {metodoPago && (
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "4px" }}>
            <span>Método de pago</span>
            <span>{metodoPago}</span>
          </div>
        )}
        
        {/* Total */}
        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", fontSize: "14px" }}>
          <span>TOTAL</span>
          <span>$ {total.toFixed(2)}</span>
        </div>

        <div style={{ borderTop: "1px dashed #000", margin: "6px 0" }} />

        <div style={{ textAlign: "center", fontSize: "10px" }}>
          ¡Gracias por su preferencia!
        </div>
      </div>

      {/* Botones */}
      <div className="flex gap-2">
        <Button
          label="Cerrar"
          icon="pi pi-times"
          outlined
          severity="secondary"
          className="flex-1"
          onClick={onCerrar}
        />
        <Button
          label="Imprimir"
          icon="pi pi-print"
          className="flex-1"
          style={{ background: "rgba(196,130,60,1)", border: "none" }}
          onClick={handleImprimir}
        />
      </div>

    </div>
  );
}

export default Ticket;