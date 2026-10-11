import { useRef, useState, useEffect } from "react";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
import { useAuth } from "../context/useAuth";
import axios from "axios";
import { Dialog } from "primereact/dialog";
import Ticket from "./ticket";

function Orden({ items, onEliminar, onLimpiar, onOrdenEnviada }) {
  const { usuario } = useAuth();
  const id_emisor  = usuario?.id_emisor || null;
  const id_usuario = usuario?.id || null;

  const [loading, setLoading]             = useState(false);

  const [ticketData, setTicketData]       = useState(null);
  const [ticketVisible, setTicketVisible] = useState(false);

  const [metodosPago, setMetodosPago]     = useState([]);
  // Reemplaza id_metodo_pago único por un arreglo de pagos (split de pago)
  const [pagos, setPagos] = useState([{ id_metodo_pago: null, importe: null }]);

  const [descuentos, setDescuentos]       = useState({});
  const [cantidades, setCantidades] = useState({});

  const toast = useRef(null);

  const grupos = items.reduce((acc, item) => {
    const g = item._grupo;
    if (!acc[g]) acc[g] = [];
    acc[g].push(item);
    return acc;
  }, {});

  // Total general respetando descuentos por grupo
  const total = Object.entries(grupos).reduce((acc, [grupoId, grupoItems]) => {
    const producto     = grupoItems.find(i => i.tipo === "P");
    const usaDescuento = descuentos[grupoId] && producto?.precio_desc != null;
    const importeP     = usaDescuento ? Number(producto.precio_desc) : Number(producto?.importe ?? 0);
    const importeExtra = grupoItems.filter(i => i.tipo !== "P").reduce((s, i) => s + Number(i.importe), 0);
    const cantidad     = cantidades[grupoId] ?? 1;
    return acc + (importeP + importeExtra) * cantidad;
  }, 0);

  // Suma capturada en los pagos y lo que falta/sobra por cubrir
  const totalPagado = pagos.reduce((acc, p) => acc + (Number(p.importe) || 0), 0);
  const restante = Number((total - totalPagado).toFixed(2));
  const esMultipago = pagos.length > 1;

  useEffect(() => {
    if (!id_emisor) return;
    axios
      .get(`${import.meta.env.VITE_API_URL}catalogos/mp/GET.php?id_emisor=${id_emisor}`)
      .then(res => { if (Array.isArray(res.data)) setMetodosPago(res.data); })
      .catch(() => {
        toast.current?.show({ severity: "error", summary: "Error", detail: "Error al cargar métodos de pago", life: 3000 });
      });
  }, [id_emisor]);

  // Cuando cambia el total (se agregan/quitan productos) y solo hay un método
  // de pago, mantenlo sincronizado automáticamente para no obligar a recapturar.
  useEffect(() => {
    if (pagos.length === 1) {
      setPagos([{ ...pagos[0], importe: total > 0 ? total : null }]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total]);

  const agregarPago = () => {
    setPagos(prev => [...prev, { id_metodo_pago: null, importe: restante > 0 ? restante : null }]);
  };

  const eliminarPago = (idx) => {
    setPagos(prev => prev.filter((_, i) => i !== idx));
  };

  const actualizarPago = (idx, campo, valor) => {
    setPagos(prev => prev.map((p, i) => (i === idx ? { ...p, [campo]: valor } : p)));
  };

  const limpiarPagos = () => {
    setPagos([{ id_metodo_pago: null, importe: total > 0 ? total : null }]);
  };

  const handleEnviar = async () => {
    if (items.length === 0) {
      toast.current?.show({ severity: "warn", summary: "Orden vacía", detail: "Agrega al menos un producto", life: 3000 });
      return;
    }
    if (pagos.some(p => !p.id_metodo_pago || !p.importe || Number(p.importe) <= 0)) {
      toast.current?.show({ severity: "warn", summary: "Pagos incompletos", detail: "Selecciona el método y monto de cada pago", life: 3000 });
      return;
    }
    if (restante !== 0) {
      toast.current?.show({
        severity: "warn",
        summary: "Pago incompleto",
        detail: restante > 0
          ? `Falta cubrir $${restante.toFixed(2)}`
          : `Te excediste por $${Math.abs(restante).toFixed(2)}`,
        life: 3500,
      });
      return;
    }

    try {
      setLoading(true);
      const payload = {
        fecha_emision: new Date().toLocaleDateString("en-CA"),
        id_emisor,
        id_usuario,
        items: items.flatMap(i => {
          const grupoId      = i._grupo;
          const producto     = grupos[grupoId]?.find(g => g.tipo === "P");
          const usaDescuento = descuentos[grupoId] && i.tipo === "P" && producto?.precio_desc != null;
          const cantidad     = cantidades[grupoId] ?? 1;

          // Repite este objeto `cantidad` veces en el array
          return Array.from({ length: cantidad }, () => ({
            id_prod: i.id_prod,
            importe: usaDescuento ? producto.precio_desc : i.importe,
            tipo:    i.tipo,
          }));
        }),
        pagos: pagos.map(p => ({
          id_metodo_pago: p.id_metodo_pago,
          importe: Number(p.importe),
        })),
      };
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}ord/INSERT.php`,
        payload,
        { headers: { "Content-Type": "application/json" } }
      );
      if (res.data.success) {
        setTicketData({ id_orden: res.data.id_orden });
        setTicketVisible(true);
      } else {
        toast.current?.show({ severity: "error", summary: "Error", detail: res.data.error ?? "Error desconocido", life: 3000 });
      }
    } catch (error) {
      const mensaje = error.response?.data?.error ?? "Error de red";
      toast.current?.show({ severity: "error", summary: "Error", detail: mensaje, life: 3000 });
    } finally {
      setLoading(false);
    }
  };

  // Etiquetas de pago para el ticket: arreglo de { metodo_pago, importe }
  const pagosLabel = pagos.map(p => ({
    metodo_pago: metodosPago.find(m => m.id === p.id_metodo_pago)?.metodo_pago ?? null,
    importe: Number(p.importe) || 0,
  }));

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Toast ref={toast} />

      {/* Header */}
      <div className="flex align-items-center justify-content-between px-3 py-2"
        style={{ borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
        <div className="flex align-items-center gap-2">
          <i className="pi pi-shopping-cart text-xl" style={{ color: "rgba(196,130,60,1)" }} />
          <span className="font-bold">Orden</span>
          {items.filter(i => i.tipo === "P").length > 0 && (
            <span className="border-circle flex align-items-center justify-content-center text-xs font-bold text-white"
              style={{ background: "rgba(196,130,60,1)", width: "1.4rem", height: "1.4rem" }}>
              {items.filter(i => i.tipo === "P").length}
            </span>
          )}
        </div>
        {items.length > 0 && (
          <Button icon="pi pi-trash" text rounded severity="danger" tooltip="Limpiar orden" onClick={onLimpiar} />
        )}
      </div>

      {/* Lista agrupada */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0.5rem" }}>
        {Object.keys(grupos).length === 0 ? (
          <div className="flex flex-column align-items-center justify-content-center gap-2"
            style={{ height: "100%", opacity: 0.4 }}>
            <i className="pi pi-shopping-cart text-4xl" />
            <span className="text-sm">Sin productos</span>
          </div>
        ) : (
          Object.entries(grupos).map(([grupoId, grupoItems]) => {
            const producto     = grupoItems.find(i => i.tipo === "P");
            const comps        = grupoItems.filter(i => i.tipo === "C");
            const mods         = grupoItems.filter(i => i.tipo === "M");
            const usaDescuento = descuentos[grupoId] && producto?.precio_desc != null;
            const importeP     = usaDescuento ? Number(producto.precio_desc) : Number(producto?.importe ?? 0);
            const cantidad = cantidades[grupoId] ?? 1;
            const totalGrupo = (importeP + grupoItems
              .filter(i => i.tipo !== "P")
              .reduce((acc, i) => acc + Number(i.importe), 0)) * cantidad;

            return (
              <div key={grupoId}
                className="p-2 mb-2 border-round"
                style={{ background: "rgba(196,130,60,0.06)", border: "1px solid rgba(196,130,60,0.15)" }}>

                {/* P — Producto */}
                <div className="flex justify-content-between align-items-start">
                  <div className="flex flex-column gap-1" style={{ flex: 1 }}>
                    <span className="font-bold text-sm">{producto?._label}</span>

                    <div className="flex align-items-center gap-2">
                      <span className="text-xs" style={{ color: "rgba(196,130,60,0.7)" }}>
                        $ {importeP.toFixed(2)}
                      </span>
                      {producto?.precio_desc != null && (
                        <label className="flex align-items-center gap-1" style={{ cursor: "pointer" }}>
                          <input
                            type="checkbox"
                            checked={!!descuentos[grupoId]}
                            onChange={(e) =>
                              setDescuentos(prev => ({ ...prev, [grupoId]: e.target.checked }))
                            }
                            style={{ accentColor: "rgba(196,130,60,0.9)", cursor: "pointer" }}
                          />
                          <span className="text-xs" style={{ color: "rgba(196,130,60,0.6)" }}>
                            precio descuento
                          </span>
                        </label>
                      )}
                    </div>
                  </div>

                {/* Controles cantidad + eliminar */}
                <div className="flex align-items-center gap-1">
                  <Button
                    icon="pi pi-minus"
                    text rounded
                    style={{ width: "1.6rem", height: "1.6rem" }}
                    onClick={() => {
                      const cant = cantidades[grupoId] ?? 1;
                      if (cant <= 1) {
                        // eliminar grupo completo
                        grupoItems.forEach(i => onEliminar(i.id));
                        setDescuentos(prev => { const n = { ...prev }; delete n[grupoId]; return n; });
                        setCantidades(prev => { const n = { ...prev }; delete n[grupoId]; return n; });
                      } else {
                        setCantidades(prev => ({ ...prev, [grupoId]: cant - 1 }));
                      }
                    }}
                  />
                  <span className="text-sm font-bold" style={{ minWidth: "1rem", textAlign: "center" }}>
                    {cantidades[grupoId] ?? 1}
                  </span>
                  <Button
                    icon="pi pi-plus"
                    text rounded
                    style={{ width: "1.6rem", height: "1.6rem", color: "rgba(196,130,60,1)" }}
                    onClick={() =>
                      setCantidades(prev => ({ ...prev, [grupoId]: (prev[grupoId] ?? 1) + 1 }))
                    }
                  />
                </div>
                </div>

                {/* C — Complementos */}
                {comps.length > 0 && (
                  <div className="mt-2 pl-2"
                    style={{ borderLeft: "2px solid rgba(196,130,60,0.3)" }}>
                    <span className="text-xs font-bold text-500 uppercase">Complementos</span>
                    {comps.map(c => (
                      <div key={c.id} className="flex justify-content-between text-xs text-500 mt-1">
                        <span>+ {c._label}</span>
                        {c.importe > 0 && <span>+$ {Number(c.importe).toFixed(2)}</span>}
                      </div>
                    ))}
                  </div>
                )}

                {/* M — Modificadores */}
                {mods.length > 0 && (
                  <div className="mt-2 pl-2"
                    style={{ borderLeft: "2px solid rgba(100,100,100,0.2)" }}>
                    <span className="text-xs font-bold text-500 uppercase">Modificadores</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {mods.map(m => (
                        <span key={m.id}
                          className="text-xs px-2 py-1 border-round"
                          style={{ background: "rgba(0,0,0,0.06)" }}>
                          {m._label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Total grupo */}
                <div className="flex justify-content-end mt-2 pt-2"
                  style={{ borderTop: "1px solid rgba(196,130,60,0.15)" }}>
                  <span className="text-sm font-bold" style={{ color: "rgba(196,130,60,1)" }}>
                    $ {totalGrupo.toFixed(2)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div style={{ borderTop: "1px solid rgba(0,0,0,0.08)", padding: "0.75rem" }}>

        {/* Pagos */}
        <div className="mb-3">
          <div className="flex justify-content-between align-items-center mb-2">
            <span className="text-sm font-bold" style={{ opacity: 0.7 }}>
              {esMultipago ? "Métodos de pago" : "Método de pago"}
            </span>
            {!esMultipago && (
              <Button
                label="Dividir pago"
                icon="pi pi-share-alt"
                text
                size="small"
                onClick={agregarPago}
              />
            )}
          </div>

          {pagos.map((pago, idx) => (
            <div key={idx} className="flex align-items-center gap-2 mb-2">
              <Dropdown
                value={pago.id_metodo_pago}
                options={metodosPago}
                optionLabel="metodo_pago"
                optionValue="id"
                onChange={e => actualizarPago(idx, "id_metodo_pago", e.value)}
                placeholder="Método de pago"
                className="flex-1"
              />
              <InputNumber
                value={pago.importe}
                onValueChange={e => actualizarPago(idx, "importe", e.value)}
                mode="currency"
                currency="MXN"
                locale="es-MX"
                placeholder="$ 0.00"
                style={{ width: "8.5rem" }}
                inputClassName="w-full"
              />
              {esMultipago && (
                <Button
                  icon="pi pi-times"
                  text rounded
                  severity="danger"
                  style={{ width: "1.8rem", height: "1.8rem" }}
                  onClick={() => eliminarPago(idx)}
                />
              )}
            </div>
          ))}

          {esMultipago && (
            <div className="flex justify-content-between align-items-center">
              <Button
                label="Agregar método"
                icon="pi pi-plus"
                text
                size="small"
                onClick={agregarPago}
              />
              <Button
                label="Un solo pago"
                text
                size="small"
                severity="secondary"
                onClick={limpiarPagos}
              />
            </div>
          )}
        </div>

        <div className="flex justify-content-between align-items-center mb-1">
          <span className="font-bold">Total</span>
          <span className="font-bold text-lg" style={{ color: "rgba(196,130,60,1)" }}>
            $ {total.toFixed(2)}
          </span>
        </div>

        {esMultipago && (
          <div className="flex justify-content-between align-items-center mb-3">
            <span
              className="text-sm"
              style={{ color: restante === 0 ? "rgba(34,150,80,1)" : "rgba(196,60,60,1)" }}
            >
              {restante === 0
                ? "Pago cuadrado ✓"
                : restante > 0
                ? `Falta $${restante.toFixed(2)}`
                : `Excedente $${Math.abs(restante).toFixed(2)}`}
            </span>
          </div>
        )}

        {!esMultipago && <div className="mb-3" />}

        <Button
          label="Enviar orden"
          icon="pi pi-send"
          className="w-full"
          style={{ background: "rgba(196,130,60,1)", border: "none" }}
          loading={loading}
          disabled={items.length === 0}
          onClick={handleEnviar}
        />
      </div>

      {/* Dialog ticket */}
      <Dialog
        visible={ticketVisible}
        onHide={() => setTicketVisible(false)}
        header="Ticket de orden"
        style={{ width: "min(380px, 96vw)" }}
        modal
        draggable={false}
        resizable={false}
      >
        <Ticket
          orden={ticketData}
          items={items}
          pagos={pagosLabel}
          descuentos={descuentos}
          cantidades={cantidades}
          onCerrar={() => {
            setTicketVisible(false);
            onOrdenEnviada?.();
          }}
        />
      </Dialog>
    </div>
  );
}

export default Orden;