import { useState, useRef } from "react";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Calendar } from "primereact/calendar";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { classNames } from "primereact/utils";
import { useAuth } from "../context/useAuth";
import { Checkbox } from "primereact/checkbox";
import axios from "axios";

import Categorias from "../carta/categorias";
import Subcategorias from "../carta/subcategorias";
import Complementos from "../carta/complementos";
import Modificadores from "../carta/modificadores";

let _uid = 0;
const ITEM_VACIO = () => ({
  _uid:          ++_uid,
  id_prod:       null,
  descripcion:   "",
  complementos:  [],
  modificadores: []
});

const FORM_INICIAL = {
  fecha_emision:     new Date(),
  fecha_entrega:     null,
  destinatario:      "",
  direccion_entrega: "",
  origen: "P",
  destino: "P"
};

function AgregarOrden({ onSuccess, onCancel }) {
  const { usuario } = useAuth();
  const id_emisor   = usuario?.id_emisor || null;

  const [formData, setFormData]   = useState(FORM_INICIAL);
  const [productos, setProductos] = useState([ITEM_VACIO()]);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading]     = useState(false);

  const [dlgCarta, setDlgCarta]   = useState(null);
  const [stack, setStack]         = useState([]);
  const [todasLasSubcategorias, setTodasLasSubcategorias] = useState([]);
  const toast = useRef(null);

  const accent       = "rgba(196,130,60,1)";
  const accentBg     = "rgba(196,130,60,0.07)";
  const accentBorder = "rgba(196,130,60,0.25)";

  const nivelActual = stack.length;
  const actual      = stack[stack.length - 1] || null;

  const abrirCarta = (uid) => {
    setStack([]);
    setTodasLasSubcategorias([]);
    setDlgCarta(uid);
  };

  const cerrarCarta = () => {
    setDlgCarta(null);
    setStack([]);
    setTodasLasSubcategorias([]);
  };

  const handleSelectCategoria = (id, label) => {
    setTodasLasSubcategorias([]);
    setStack([{ id_categoria: id, label }]);
  };

  const handleSelectProducto = (producto) => {
    const base = Number(producto.precio);
    setProductos(prev => prev.map(p =>
      p._uid === dlgCarta
        ? { ...p, id_prod: producto.id_prod_carta, descripcion: producto.producto, importeBase: base, importe: base, complementos: [], modificadores: [] }
        : p
    ));
    cerrarCarta();
  };

  const handleComplementosChange = (uid, comps) => {
    setProductos(prev => prev.map(p => {
      if (p._uid !== uid) return p;
      const totalComps = comps.reduce((acc, c) => acc + Number(c.importe ?? 0), 0);
      return { ...p, complementos: comps, importe: Number(p.importeBase ?? 0) + totalComps };
    }));
  };

  const handleModificadoresChange = (uid, mods) => {
    setProductos(prev => prev.map(p => p._uid === uid ? { ...p, modificadores: mods } : p));
  };

  const handleRemove = (uid) => {
    setProductos(prev => prev.filter(p => p._uid !== uid));
  };

  // ✅ Elimina todos los productos sin id_prod asignado
  const limpiarVacios = () => {
    setProductos(prev => {
      const conProducto = prev.filter(p => p.id_prod !== null);
      // Si todos están vacíos, dejar al menos uno
      return conProducto.length > 0 ? conProducto : [ITEM_VACIO()];
    });
  };

  const importeTotal = productos.reduce((acc, p) => acc + Number(p.importe ?? 0), 0);
  const vacios       = productos.filter(p => p.id_prod === null).length;

  const isValid = () =>
    formData.fecha_emision && formData.fecha_entrega &&
    formData.destinatario  && formData.direccion_entrega &&
    productos.length > 0   && productos.every(p => p.id_prod && p.importe);

  const handleGuardar = async () => {
    setSubmitted(true);
    if (!isValid()) {
      toast.current?.show({ severity: "warn", summary: "Validación", detail: "Complete todos los campos requeridos", life: 3000 });
      return;
    }
    try {
      setLoading(true);
      const toDate = (d) => d instanceof Date ? d.toLocaleDateString("en-CA") : d;
      const items = productos.flatMap(p => [
        { id_prod: p.id_prod, tipo: "P", importe: p.importeBase },
        ...p.complementos.map(c  => ({ id_prod: c.value, tipo: "C", importe: Number(c.importe) })),
        ...p.modificadores.map(m => ({ id_prod: m.value, tipo: "M", importe: 0 }))
      ]);
      const res = await axios.post(`${import.meta.env.VITE_API_URL}prod/INSERT.php`, {
        fecha_emision:     toDate(formData.fecha_emision),
        fecha_entrega:     toDate(formData.fecha_entrega),
        origen: formData.origen,
        destino: formData.destino,
        id_emisor,
        items
      });
      if (res.data.success) {
        toast.current?.show({ severity: "success", summary: "Guardado", detail: "Pedido creado ✅", life: 2000 });
        setTimeout(onSuccess, 500);
      } else throw new Error(res.data.error);
    } catch (e) {
      toast.current?.show({ severity: "error", summary: "Error", detail: e.message ?? "Error de red", life: 3000 });
    } finally {
      setLoading(false);
    }
  };

  const fieldClass = (key) => classNames("w-full", { "p-invalid": submitted && !formData[key] });

  return (
    <div className="p-fluid">
      <Toast ref={toast} />

      {/* ── Info general ── */}
      <div style={{ borderRadius: 10, border: `1px solid ${accentBorder}`, overflow: "hidden", marginBottom: "1rem" }}>
        <div className="flex align-items-center gap-2 px-3 py-2" style={{ background: accent }}>
          <i className="pi pi-info-circle" style={{ color: "#fff", fontSize: "0.9rem" }} />
          <span className="font-bold text-sm" style={{ color: "#fff" }}>Información del pedido</span>
        </div>
        <div className="grid p-3 pb-1">
        
        <div className="col-12 field">
          <label className="font-bold block mb-1 text-sm">
            Origen <span style={{ color: accent }}>*</span>
          </label>
          <div className="flex gap-4">
            <div className="flex align-items-center gap-2">
              <Checkbox
                inputId="origen_pv"
                value="P"
                onChange={e => setFormData(p => ({ ...p, origen: e.value }))}
                checked={formData.origen === "P"}
              />
              <label htmlFor="origen_pv">Punto de Venta</label>
            </div>
            <div className="flex align-items-center gap-2">
              <Checkbox
                inputId="origen_pd"
                value="D"
                onChange={e => setFormData(p => ({ ...p, origen: e.value }))}
                checked={formData.origen === "D"}
              />
              <label htmlFor="origen_pd">Pedido Directo</label>
            </div>
          </div>
        </div>

        <div className="col-12 field">
          <label className="font-bold block mb-1 text-sm">
            Destino <span style={{ color: accent }}>*</span>
          </label>
          <div className="flex gap-4">
            <div className="flex align-items-center gap-2">
              <Checkbox
                inputId="destino_pv"
                value="P"
                onChange={e => setFormData(p => ({ ...p, destino: e.value }))}
                checked={formData.destino === "P"}
              />
              <label htmlFor="destino_pv">Punto de Venta</label>
            </div>
            <div className="flex align-items-center gap-2">
              <Checkbox
                inputId="destino_pd"
                value="D"
                onChange={e => setFormData(p => ({ ...p, destino: e.value }))}
                checked={formData.destino === "D"}
              />
              <label htmlFor="destino_pd">Venta Directo</label>
            </div>
            <div className="flex align-items-center gap-2">
              <Checkbox
                inputId="destino_s"
                value="S"
                onChange={e => setFormData(p => ({ ...p, destino: e.value }))}
                checked={formData.destino === "S"}
              />
              <label htmlFor="destino_pd">Surtimiento / Abastecimiento</label>
            </div>
          </div>
        </div>

          <div className="col-12 md:col-6 field">
            <label className="font-bold block mb-1 text-sm">Fecha de emisión <span style={{ color: accent }}>*</span></label>
            <Calendar value={formData.fecha_emision} onChange={e => setFormData(p => ({ ...p, fecha_emision: e.value }))}
              dateFormat="dd/mm/yy" showIcon className={fieldClass("fecha_emision")} />
          </div>
          <div className="col-12 md:col-6 field">
            <label className="font-bold block mb-1 text-sm">Fecha de entrega <span style={{ color: accent }}>*</span></label>
            <Calendar value={formData.fecha_entrega} onChange={e => setFormData(p => ({ ...p, fecha_entrega: e.value }))}
              dateFormat="dd/mm/yy" showIcon className={fieldClass("fecha_entrega")} />
          </div>
          <div className="col-12 md:col-6 field">
            <label className="font-bold block mb-1 text-sm">Destinatario <span style={{ color: accent }}>*</span></label>
            <InputText value={formData.destinatario} placeholder="Nombre del destinatario"
              onChange={e => setFormData(p => ({ ...p, destinatario: e.target.value }))}
              className={fieldClass("destinatario")} />
          </div>
          <div className="col-12 md:col-6 field">
            <label className="font-bold block mb-1 text-sm">Dirección de entrega <span style={{ color: accent }}>*</span></label>
            <InputText value={formData.direccion_entrega} placeholder="Dirección completa"
              onChange={e => setFormData(p => ({ ...p, direccion_entrega: e.target.value }))}
              className={fieldClass("direccion_entrega")} />
          </div>
        </div>
      </div>

      {/* ── Productos ── */}
      {productos.map((prod, index) => {
        const totalComps = prod.complementos.reduce((acc, c) => acc + Number(c.importe ?? 0), 0);
        const estaVacio  = prod.id_prod === null;

        return (
          <div key={prod._uid} style={{
            borderRadius: 10,
            border: `1px solid ${submitted && !prod.id_prod ? "#e24c4c" : accentBorder}`,
            overflow: "hidden",
            marginBottom: "1rem"
          }}>
            {/* Header producto */}
            <div className="flex align-items-center justify-content-between px-3 py-2" style={{ background: accent }}>
              <div className="flex align-items-center gap-2">
                <i className="pi pi-box" style={{ color: "#fff", fontSize: "0.9rem" }} />
                <span className="font-bold text-sm" style={{ color: "#fff" }}>
                  Producto {index + 1} <span style={{ color: "rgba(255,255,255,0.7)" }}>*</span>
                </span>
                {/* ✅ Badge "vacío" para identificarlos fácilmente */}
                {estaVacio && (
                  <span style={{
                    background: "rgba(255,255,255,0.2)", color: "#fff",
                    fontSize: "0.7rem", borderRadius: 4, padding: "1px 6px"
                  }}>
                    Sin producto
                  </span>
                )}
              </div>

              <div className="flex align-items-center gap-1">
                {/* ✅ Botón eliminar — siempre visible */}
                <Button
                  icon="pi pi-trash"
                  text rounded
                  style={{
                    color: productos.length === 1 && !estaVacio
                      ? "rgba(255,255,255,0.3)"
                      : "#fff",
                    width: "1.8rem", height: "1.8rem"
                  }}
                  onClick={() => handleRemove(prod._uid)}
                  // Solo deshabilitar si es el ÚNICO producto Y tiene contenido
                  disabled={productos.length === 1 && !estaVacio}
                  type="button"
                  tooltip={
                    productos.length === 1 && !estaVacio
                      ? "Debe haber al menos un producto"
                      : "Eliminar producto"
                  }
                  tooltipOptions={{ position: "left" }}
                />
              </div>
            </div>

            {/* Selector */}
            <div className="flex align-items-center justify-content-between gap-2 px-3 py-3"
              style={{ background: accentBg, borderBottom: `1px solid ${accentBorder}` }}>
              <div className="flex align-items-center gap-2 flex-1">
                {prod.id_prod ? (
                  <>
                    <i className="pi pi-check-circle" style={{ color: "green", fontSize: "1rem" }} />
                    <div>
                      <div className="font-bold">{prod.descripcion}</div>
                      <div className="text-xs text-500">Producto principal</div>
                    </div>
                  </>
                ) : (
                  <>
                    <i className="pi pi-exclamation-circle"
                      style={{ color: submitted ? "#e24c4c" : "#aaa", fontSize: "1rem" }} />
                    <span className="text-sm"
                      style={{ color: submitted && !prod.id_prod ? "#e24c4c" : "#888" }}>
                      {submitted && !prod.id_prod ? "Selecciona un producto" : "Ningún producto seleccionado"}
                    </span>
                  </>
                )}
              </div>
              <div className="flex align-items-center gap-2">
                {prod.id_prod && (
                  <span className="font-bold" style={{ color: accent, fontSize: "1rem" }}>
                    $ {Number(prod.importe ?? 0).toFixed(2)}
                  </span>
                )}
                <Button icon="pi pi-search" label={prod.id_prod ? "Cambiar" : "Seleccionar"}
                  style={{ background: accent, border: "none", fontSize: "0.85rem" }}
                  onClick={() => abrirCarta(prod._uid)} type="button" size="small" />
              </div>
            </div>

            {prod.id_prod && (
              <>
                {/* Complementos */}
                <div style={{ borderBottom: `1px solid ${accentBorder}` }}>
                  <div className="flex align-items-center gap-2 px-3 py-2"
                    style={{ background: "rgba(14,165,233,0.06)", borderBottom: "1px solid rgba(14,165,233,0.15)" }}>
                    <i className="pi pi-plus-circle" style={{ color: "#0ea5e9", fontSize: "0.8rem" }} />
                    <span className="text-xs font-bold uppercase" style={{ color: "#0ea5e9", letterSpacing: "0.06em" }}>Complementos</span>
                  </div>
                  <div className="px-2 py-2">
                    <Complementos
                      id_prod_carta={prod.id_prod}
                      onSeleccionChange={(comps) => handleComplementosChange(prod._uid, comps)}
                    />
                  </div>
                </div>

                {/* Modificadores */}
                <div style={{ borderBottom: `1px solid ${accentBorder}` }}>
                  <div className="flex align-items-center gap-2 px-3 py-2"
                    style={{ background: "rgba(234,179,8,0.06)", borderBottom: "1px solid rgba(234,179,8,0.2)" }}>
                    <i className="pi pi-sliders-h" style={{ color: "#ca8a04", fontSize: "0.8rem" }} />
                    <span className="text-xs font-bold uppercase" style={{ color: "#ca8a04", letterSpacing: "0.06em" }}>Modificadores</span>
                  </div>
                  <div className="px-2 py-2">
                    <Modificadores
                      id_prod_carta={prod.id_prod}
                      onSeleccionChange={(mods) => handleModificadoresChange(prod._uid, mods)}
                    />
                  </div>
                </div>

                {/* Importe */}
                <div className="flex align-items-center justify-content-between px-3 py-2"
                  style={{ background: accentBg }}>
                  <span className="text-xs text-500 flex flex-column gap-1">
                    <span>Producto: <b>$ {Number(prod.importeBase ?? 0).toFixed(2)}</b></span>
                    <span>Complementos: <b style={{ color: "#0ea5e9" }}>+ $ {totalComps.toFixed(2)}</b></span>
                  </span>
                  <span className="font-bold" style={{ color: accent, fontSize: "1.1rem" }}>
                    Total: $ {Number(prod.importe ?? 0).toFixed(2)}
                  </span>
                </div>
              </>
            )}
          </div>
        );
      })}

      {/* ── Barra de acciones sobre productos ── */}
      <div className="flex gap-2 mb-3">
        {/* Agregar producto */}
        <Button
          label="Agregar otro producto"
          icon="pi pi-plus"
          outlined
          style={{ borderColor: accent, color: accent, flex: 1 }}
          onClick={() => setProductos(prev => [...prev, ITEM_VACIO()])}
          type="button"
        />

        {/* ✅ Limpiar vacíos — solo aparece si hay al menos uno vacío */}
        {vacios > 0 && (
          <Button
            label={`Quitar ${vacios} vacío${vacios > 1 ? 's' : ''}`}
            icon="pi pi-filter-slash"
            outlined
            severity="danger"
            onClick={limpiarVacios}
            type="button"
            tooltip="Eliminar productos sin seleccionar"
            tooltipOptions={{ position: "top" }}
          />
        )}
      </div>

      {/* Total general */}
      {productos.length > 1 && (
        <div className="flex justify-content-end align-items-center gap-2 mb-3 px-3 py-2"
          style={{ background: accentBg, borderRadius: 8, border: `1px solid ${accentBorder}` }}>
          <span className="text-sm text-500 font-bold">TOTAL DEL PEDIDO</span>
          <span className="font-bold" style={{ color: accent, fontSize: "1.2rem" }}>
            $ {importeTotal.toFixed(2)}
          </span>
        </div>
      )}

      {/* Acciones */}
      <div className="flex gap-2 justify-content-end mt-2">
        <Button label="Cancelar" icon="pi pi-times" outlined severity="secondary" onClick={onCancel} type="button" />
        <Button label="Guardar" icon="pi pi-check" style={{ background: accent, border: "none" }}
          loading={loading} onClick={handleGuardar} type="button" />
      </div>

      {/* Dialog carta */}
      <Dialog visible={dlgCarta !== null}
        onHide={cerrarCarta}
        header="Seleccionar producto"
        style={{ width: "min(700px, 96vw)", height: "600px" }}
        modal draggable={false} resizable={false}>
        <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
          {nivelActual > 0 && (
            <div className="flex align-items-center gap-2 px-2 pt-2">
              <Button icon="pi pi-arrow-left" text rounded onClick={() => setStack(p => p.slice(0, -1))} />
              <span className="text-sm text-500">
                {stack.map((s, i) => <span key={i}>{i > 0 && <span className="mx-1">›</span>}{s.label}</span>)}
              </span>
            </div>
          )}
          {nivelActual === 0
            ? <Categorias onSelect={handleSelectCategoria} />
            : <Subcategorias id_categoria={actual.id_categoria} todasLasSubcategorias={todasLasSubcategorias}
                onDataLoaded={setTodasLasSubcategorias} onSelect={handleSelectProducto} />
          }
        </div>
      </Dialog>
    </div>
  );
}

export default AgregarOrden;