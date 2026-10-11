import { useState, useEffect, useRef } from "react";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Calendar } from "primereact/calendar";
import { InputMask } from "primereact/inputmask";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { classNames } from "primereact/utils";
import { Checkbox } from "primereact/checkbox";
import { useAuth } from "../context/useAuth";
import axios from "axios";

import Categorias from "../carta/categorias";
import Subcategorias from "../carta/subcategorias";
import Complementos from "../carta/complementos";
import Modificadores from "../carta/modificadores";
import Recetas from "./recetas";   

let _uid = 0;
const ITEM_VACIO = () => ({
  _uid:          ++_uid,
  id_prod:       null,
  descripcion:   "",
  importeBase:   null,
  precioDesc:    null,   // AJUSTE: paridad con Agregar
  usaDescuento:  false,  // AJUSTE: paridad con Agregar
  importe:       null,
  complementos:  [],
  modificadores: [],
  
});

// AJUSTE: paridad con Agregar — diferenciar errores de negocio del SP
const ERRORES_NEGOCIO = [
  "Stock insuficiente",
  "No existe receta para el producto",
];

function EditarPedido({ pedido, onSuccess, onCancel }) {
  const { usuario } = useAuth();
  const id_emisor   = usuario?.id_emisor || null;
  const id_usuario = usuario?.id_usuario || null;

  const [formData, setFormData]   = useState(null);
  const [productos, setProductos] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading]     = useState(false);

  const [dlgCarta, setDlgCarta]   = useState(null);
  const [stack, setStack]         = useState([]);
  const [todasLasSubcategorias, setTodasLasSubcategorias] = useState([]);
  const toast = useRef(null);

  const accent       = "rgba(196,130,60,1)";
  const accentBg     = "rgba(196,130,60,0.07)";
  const accentBorder = "rgba(196,130,60,0.25)";

  useEffect(() => {
    if (!pedido) return;

    const parseLocalDate = (fecha) => fecha ? new Date(`${fecha}T00:00:00`) : null;

    setFormData({
      fecha_emision:     parseLocalDate(pedido.fecha_emision),
      fecha_entrega:     parseLocalDate(pedido.fecha_entrega),
      destinatario:      pedido.destinatario      ?? "",
      direccion_entrega: pedido.direccion_entrega ?? "",
      hora_entrega:      pedido.hora_entrega      ?? "",
      telefono_cliente:  pedido.telefono_cliente  ?? "",
      origen:            pedido.origen            ?? "P",
      origenOtro:        pedido.origenOtro        ?? "",
      destino:           pedido.destino           ?? "P",
      url_img:           pedido.url_img           ?? null,
      recetas:           pedido.recetas           ?? [], 
    });

    const items  = pedido.items ?? [];
    const grupos = [];
    let   grupo  = null;

    items.forEach(item => {
      if (item.tipo === "P") {
        // AJUSTE: recuperar precio de descuento y si estaba aplicado, si tu API los manda
        const precioDesc   = item.precio_desc != null ? Number(item.precio_desc) : null;
        const usaDescuento = !!item.usa_descuento;
        grupo = {
          _uid:          ++_uid,
          id_prod:       item.id_prod,
          descripcion:   item.descripcion,
          importeBase:   Number(item.importe ?? 0),
          precioDesc,
          usaDescuento,
          importe:       Number(item.importe ?? 0),
          complementos:  [],
          modificadores: []
        };
        grupos.push(grupo);
      } else if (grupo && item.tipo === "C") {
        grupo.complementos.push({ value: item.id_prod, label: item.descripcion, importe: item.importe });
        grupo.importe += Number(item.importe ?? 0);
      } else if (grupo && item.tipo === "M") {
        grupo.modificadores.push({ value: item.id_prod, label: item.descripcion });
      }
    });

    setProductos(grupos.length > 0 ? grupos : [ITEM_VACIO()]);
  }, [pedido]);

  const abrirCarta  = (uid) => { setStack([]); setTodasLasSubcategorias([]); setDlgCarta(uid); };
  const cerrarCarta = ()    => { setDlgCarta(null); setStack([]); setTodasLasSubcategorias([]); };
  const handleSelectCategoria = (id, label) => { setTodasLasSubcategorias([]); setStack([{ id_categoria: id, label }]); };

  const handleSelectProducto = (producto) => {
    const base = Number(producto.precio);
    const desc = producto.precio_desc != null ? Number(producto.precio_desc) : null; // AJUSTE
    setProductos(prev => prev.map(p =>
      p._uid === dlgCarta
        ? {
            ...p,
            id_prod:      producto.id_prod_carta,
            descripcion:  producto.producto,
            importeBase:  base,
            precioDesc:   desc,         // AJUSTE
            usaDescuento: false,        // AJUSTE: resetear al cambiar de producto
            importe:      base,
            complementos: [],
            modificadores: []
          }
        : p
    ));
    cerrarCarta();
  };

  // AJUSTE: paridad con Agregar
  const handleToggleDescuento = (uid, checked) => {
    setProductos(prev => prev.map(p => {
      if (p._uid !== uid) return p;
      const totalComps = p.complementos.reduce((acc, c) => acc + Number(c.importe ?? 0), 0);
      const base = checked && p.precioDesc != null ? Number(p.precioDesc) : Number(p.importeBase ?? 0);
      return { ...p, usaDescuento: checked, importe: base + totalComps };
    }));
  };

  const handleComplementosChange = (uid, comps) => {
    setProductos(prev => prev.map(p => {
      if (p._uid !== uid) return p;
      const totalComps = comps.reduce((acc, c) => acc + Number(c.importe ?? 0), 0);
      // AJUSTE: respetar el descuento al recalcular con complementos
      const base = p.usaDescuento && p.precioDesc != null ? Number(p.precioDesc) : Number(p.importeBase ?? 0);
      return { ...p, complementos: comps, importe: base + totalComps };
    }));
  };

  const handleModificadoresChange = (uid, mods) => {
    setProductos(prev => prev.map(p => p._uid === uid ? { ...p, modificadores: mods } : p));
  };

  const handleRemove = (uid) => setProductos(prev => prev.filter(p => p._uid !== uid));

  const limpiarVacios = () => {
    setProductos(prev => {
      const conProducto = prev.filter(p => p.id_prod !== null);
      return conProducto.length > 0 ? conProducto : [ITEM_VACIO()];
    });
  };

  const vacios       = productos.filter(p => p.id_prod === null).length;
  const importeTotal = productos.reduce((acc, p) => acc + Number(p.importe ?? 0), 0);

  const isValid = () =>
    formData?.fecha_emision &&
    formData?.fecha_entrega &&
    (
      formData.destino === 'S'
        ? formData.recetas.length > 0
        : formData.destinatario &&
          formData.direccion_entrega &&
          productos.length > 0 &&
          productos.every(p => p.id_prod && p.importe)
    );

  // AJUSTE: paridad con Agregar
  const handleErrorResponse = (msg) => {
    const esErrorNegocio = ERRORES_NEGOCIO.some(err => msg.includes(err));
    toast.current?.show({
      severity: esErrorNegocio ? "warn" : "error",
      summary:  esErrorNegocio ? "⚠️ Aviso" : "❌ Error",
      detail:   msg,
      life: 5000
    });
  };

  const handleActualizar = async () => {
    setSubmitted(true);

    if (!isValid()) {
      toast.current?.show({ severity: "warn", summary: "Validación", detail: "Complete todos los campos requeridos", life: 3000 });
      return;
    }

    try {
      setLoading(true);
      const toDate = (d) => d instanceof Date ? d.toLocaleDateString("en-CA") : d;

      const items = productos
        .filter(p => p.id_prod !== null) // AJUSTE: filtro defensivo, paridad con Agregar
        .flatMap(p => {
          const usaDescuento = p.usaDescuento && p.precioDesc != null;
          const importeP     = usaDescuento ? Number(p.precioDesc) : Number(p.importeBase); // AJUSTE: respeta descuento
          return [
            { id_prod: p.id_prod, tipo: "P", importe: importeP },
            ...p.complementos.map(c  => ({ id_prod: c.value, tipo: "C", importe: Number(c.importe) })),
            ...p.modificadores.map(m => ({ id_prod: m.value, tipo: "M", importe: 0 })),
          ];
        });

        const esSurtimiento = formData.destino === 'S';

      const res = await axios.put(`${import.meta.env.VITE_API_URL}pe/UPDATE.php`, {
        id:                pedido.id,
        fecha_emision:     toDate(formData.fecha_emision),
        fecha_entrega:     toDate(formData.fecha_entrega),
        destinatario:      formData.destinatario,
        direccion_entrega: formData.direccion_entrega,
        // AJUSTE: campos que faltaban en el payload
        origen:            formData.origen,
        origenOtro:        formData.origenOtro || '',
        hora_entrega:      formData.hora_entrega || '',
        telefono_cliente:  formData.telefono_cliente || '',
        url_img:           formData.url_img || null,
        destino:           formData.destino,
        id_emisor,
        id_usuario,
        items:             esSurtimiento ? [] : items,          
        recetas:           esSurtimiento ? formData.recetas : [], 
      });

      // AJUSTE: usar handleErrorResponse en vez de throw genérico
      if (res.data?.success) {
        toast.current?.show({ severity: "success", summary: "Actualizado", detail: res.data.message || "Pedido actualizado ✅", life: 2000 });
        setTimeout(onSuccess, 500);
      } else {
        const msg = res.data?.error || "Error desconocido";
        handleErrorResponse(msg);
      }
    } catch (e) {
      let errorMsg = "Error de red al actualizar el pedido";
      if (e.response) {
        errorMsg = e.response.data?.error || `Error ${e.response.status}`;
      } else if (e.request) {
        errorMsg = "No se recibió respuesta del servidor";
      }
      toast.current?.show({ severity: "error", summary: "❌ Error", detail: errorMsg, life: 5000 });
    } finally {
      setLoading(false);
    }
  };

  if (!formData) return null;

  const nivelActual = stack.length;
  const actual      = stack[stack.length - 1] || null;
  const fieldClass  = (key) => classNames("w-full", { "p-invalid": submitted && !formData[key] });

  return (
    <div className="p-fluid">
      <Toast ref={toast} />

      {/* Info general */}
      <div style={{ borderRadius: 10, border: `1px solid ${accentBorder}`, overflow: "hidden", marginBottom: "1rem" }}>
        <div className="flex align-items-center gap-2 px-3 py-2" style={{ background: accent }}>
          <i className="pi pi-info-circle" style={{ color: "#fff", fontSize: "0.9rem" }} />
          <span className="font-bold text-sm" style={{ color: "#fff" }}>Información del pedido</span>
        </div>
        <div className="grid p-3 pb-1">

          {/* Origen */}
          <div className="col-12 field">
            <label className="font-bold block mb-1 text-sm">Origen <span style={{ color: accent }}>*</span></label>
            <div className="flex gap-4">
              {[{ id: "origen_pv", value: "P", label: "Punto de Venta" },
                { id: "origen_o", value: "O", label: "Otro" }].map(opt => (
                <div key={opt.value} className="flex align-items-center gap-2">
                  <Checkbox inputId={opt.id} value={opt.value}
                    onChange={e => setFormData(p => ({ ...p, origen: e.value, origenOtro: "" }))}
                    checked={formData.origen === opt.value} />
                  <label htmlFor={opt.id}>{opt.label}</label>
                </div>
              ))}
            </div>

            {formData.origen === "O" && (
              <InputText
                className="mt-2 w-full"
                placeholder="Especifica el origen..."
                value={formData.origenOtro || ""}
                onChange={e => setFormData(p => ({ ...p, origenOtro: e.target.value }))}
              />
            )}
          </div>

          {/* Destino */}
          <div className="col-12 field">
            <label className="font-bold block mb-1 text-sm">Destino <span style={{ color: accent }}>*</span></label>
            <div className="flex gap-4">
              {[{ id: "destino_pv", value: "P", label: "Punto de Venta" },
                { id: "destino_pd", value: "E", label: "Envio Domicilio"  },
                { id: "destino_s",  value: "S", label: "Surtimiento / Abastecimiento" }].map(opt => (
                <div key={opt.value} className="flex align-items-center gap-2">
                  <Checkbox inputId={opt.id} value={opt.value}
                    onChange={e => setFormData(p => ({ ...p, destino: e.value }))}
                    checked={formData.destino === opt.value} />
                  <label htmlFor={opt.id}>{opt.label}</label>
                </div>
              ))}
            </div>
          </div>

          {/* F. Emision */}
          <div className="col-4 field">
            <label className="font-bold block mb-1 text-sm">Fecha de emisión <span style={{ color: accent }}>*</span></label>
              <Calendar
                value={formData.fecha_emision}
                onChange={e => setFormData(p => ({ ...p, fecha_emision: e.value }))}
                dateFormat="dd/mm/yy"
                showIcon
                icon={() => <i className="pi pi-calendar" />}
                className="w-full"                    // ← solo para el ancho
                invalid={submitted && !formData.fecha_emision}   // ← validación visual
                disabled
              />
          </div>

          {/* F. Entrega */}
          <div className="col-4 field">
            <label className="font-bold block mb-1 text-sm">Fecha de Entrega <span style={{ color: accent }}>*</span></label>
            <Calendar
              value={formData.fecha_entrega}
              onChange={e => setFormData(p => ({ ...p, fecha_entrega: e.value }))}
              dateFormat="dd/mm/yy"
              showIcon
              icon={() => <i className="pi pi-calendar" />}
              className="w-full"                    // ← solo para el ancho
              invalid={submitted && !formData.fecha_entrega}   // ← validación visual
            />            
          </div>


          {/* H. Entrega */}
          <div className="col-4 field">
            <label className="font-bold block mb-1 text-sm">Hora de entrega <span style={{ color: accent }}>*</span></label>
            <InputMask
              value={formData.hora_entrega}
              onChange={e => setFormData(p => ({ ...p, hora_entrega: e.value }))}
              mask="99:99"
              placeholder="HH:MM"
              slotChar="HH:MM"
              autoComplete="off"
              className={fieldClass("hora_entrega")}
            />
          </div>

          {formData.destino !== 'S' && (
            <>
            {/* Destinatario */}
            <div className="col-12 md:col-6 field">
              <label className="font-bold block mb-1 text-sm">Destinatario <span style={{ color: accent }}>*</span></label>
              <InputText value={formData.destinatario} placeholder="Nombre del destinatario"
                onChange={e => setFormData(p => ({ ...p, destinatario: e.target.value }))}
                className={fieldClass("destinatario")} />
            </div>

            {/* Telefono cliente */}
            <div className="col-12 md:col-6 field">
              <label className="font-bold block mb-1 text-sm">Telefono  <span style={{ color: accent }}>*</span></label>
              <InputText value={formData.telefono_cliente} placeholder="Telefono de contacto"
                onChange={e => setFormData(p => ({ ...p, telefono_cliente: e.target.value }))}
                className={fieldClass("telefono_cliente")} />
            </div>

            {/* Direccion de Entrega */}
            <div className="col-12 field">
              <label className="font-bold block mb-1 text-sm">Dirección de entrega <span style={{ color: accent }}>*</span></label>
              <InputText value={formData.direccion_entrega} placeholder="Dirección completa"
                onChange={e => setFormData(p => ({ ...p, direccion_entrega: e.target.value }))}
                className={fieldClass("direccion_entrega")} />
            </div>
            </>
          )}

          {/* Imagen */}
          {formData.destino !== 'S' && (
          <div className="col-12 field">
            <label className="font-bold block mb-1 text-sm">Imagen del pedido</label>
            <div
              className="flex flex-column align-items-center justify-content-center gap-2"
              style={{
                border: `2px dashed ${accentBorder}`,
                borderRadius: 8,
                padding: "1rem",
                background: accentBg,
                cursor: "pointer",
                position: "relative",
              }}
              onClick={() => document.getElementById("input-img-pedido").click()}
            >
              {formData.url_img ? (
                <>
                  <img
                    src={formData.url_img}
                    alt="preview"
                    style={{ maxHeight: 160, maxWidth: "100%", borderRadius: 6, objectFit: "contain" }}
                  />
                  <Button
                    icon="pi pi-times"
                    label="Quitar imagen"
                    text
                    severity="danger"
                    size="small"
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      setFormData(p => ({ ...p, url_img: null, _imgFile: null }));
                    }}
                  />
                </>
              ) : (
                <>
                  <i className="pi pi-image" style={{ fontSize: "2rem", color: accent, opacity: 0.6 }} />
                  <span className="text-sm text-500">Haz clic para seleccionar una imagen</span>
                  <span className="text-xs text-400">JPG, PNG, WEBP</span>
                </>
              )}
              <input
                id="input-img-pedido"
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = ev => setFormData(p => ({ ...p, url_img: ev.target.result, _imgFile: file }));
                  reader.readAsDataURL(file);
                  e.target.value = "";
                }}
              />
            </div>
          </div>
          )}

        </div>
      </div>

      {/* Productos — solo si NO es Surtimiento */}
      {formData.destino !== 'S' && (
        <>
          {productos.map((prod, index) => {
            const totalComps = prod.complementos.reduce((acc, c) => acc + Number(c.importe ?? 0), 0);
            const estaVacio  = prod.id_prod === null;
            return (
              <div key={prod._uid} style={{
                borderRadius: 10,
                border: `1px solid ${submitted && !prod.id_prod ? "#e24c4c" : accentBorder}`,
                overflow: "hidden", marginBottom: "1rem"
              }}>
                <div className="flex align-items-center justify-content-between px-3 py-2" style={{ background: accent }}>
                  <div className="flex align-items-center gap-2">
                    <i className="pi pi-box" style={{ color: "#fff", fontSize: "0.9rem" }} />
                    <span className="font-bold text-sm" style={{ color: "#fff" }}>
                      Producto {index + 1} <span style={{ color: "rgba(255,255,255,0.7)" }}>*</span>
                    </span>
                    {estaVacio && (
                      <span style={{ background: "rgba(255,255,255,0.2)", color: "#fff",
                        fontSize: "0.7rem", borderRadius: 4, padding: "1px 6px" }}>Sin producto</span>
                    )}
                  </div>
                  <Button icon="pi pi-trash" text rounded
                    style={{ color: productos.length === 1 && !estaVacio ? "rgba(255,255,255,0.3)" : "#fff", width: "1.8rem", height: "1.8rem" }}
                    onClick={() => handleRemove(prod._uid)}
                    disabled={productos.length === 1 && !estaVacio}
                    type="button"
                    tooltip={productos.length === 1 && !estaVacio ? "Debe haber al menos un producto" : "Eliminar producto"}
                    tooltipOptions={{ position: "left" }}
                  />
                </div>

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
                        <span className="text-sm" style={{ color: submitted && !prod.id_prod ? "#e24c4c" : "#888" }}>
                          {submitted && !prod.id_prod ? "Selecciona un producto" : "Ningún producto seleccionado"}
                        </span>
                      </>
                    )}
                  </div>

                  <div className="flex align-items-center gap-2">
                    {prod.id_prod && prod.precioDesc != null && (
                      <label className="flex align-items-center gap-1" style={{ cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          checked={!!prod.usaDescuento}
                          onChange={(e) => handleToggleDescuento(prod._uid, e.target.checked)}
                          style={{ accentColor: accent, cursor: "pointer" }}
                        />
                        <span className="text-xs" style={{ color: accent }}>
                          precio descuento
                        </span>
                      </label>
                    )}
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
                    <div style={{ borderBottom: `1px solid ${accentBorder}` }}>
                      <div className="flex align-items-center gap-2 px-3 py-2"
                        style={{ background: "rgba(14,165,233,0.06)", borderBottom: "1px solid rgba(14,165,233,0.15)" }}>
                        <i className="pi pi-plus-circle" style={{ color: "#0ea5e9", fontSize: "0.8rem" }} />
                        <span className="text-xs font-bold uppercase" style={{ color: "#0ea5e9", letterSpacing: "0.06em" }}>Complementos</span>
                      </div>
                      <div className="px-2 py-2">
                        <Complementos id_prod_carta={prod.id_prod}
                          onSeleccionChange={comps => handleComplementosChange(prod._uid, comps)} />
                      </div>
                    </div>

                    <div style={{ borderBottom: `1px solid ${accentBorder}` }}>
                      <div className="flex align-items-center gap-2 px-3 py-2"
                        style={{ background: "rgba(234,179,8,0.06)", borderBottom: "1px solid rgba(234,179,8,0.2)" }}>
                        <i className="pi pi-sliders-h" style={{ color: "#ca8a04", fontSize: "0.8rem" }} />
                        <span className="text-xs font-bold uppercase" style={{ color: "#ca8a04", letterSpacing: "0.06em" }}>Modificadores</span>
                      </div>
                      <div className="px-2 py-2">
                        <Modificadores id_prod_carta={prod.id_prod}
                          onSeleccionChange={mods => handleModificadoresChange(prod._uid, mods)} />
                      </div>
                    </div>

                    <div className="flex align-items-center justify-content-between px-3 py-2" style={{ background: accentBg }}>
                      <span className="text-xs text-500 flex flex-column gap-1">
                        <span>
                          Producto:{" "}
                          {prod.usaDescuento && prod.precioDesc != null ? (
                            <>
                              <s style={{ opacity: 0.5 }}>$ {Number(prod.importeBase).toFixed(2)}</s>{" "}
                              <b style={{ color: accent }}>$ {Number(prod.precioDesc).toFixed(2)}</b>
                            </>
                          ) : (
                            <b>$ {Number(prod.importeBase ?? 0).toFixed(2)}</b>
                          )}
                        </span>
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

          {/* Barra de acciones sobre productos */}
          <div className="flex gap-2 mb-3">
            <Button label="Agregar otro producto" icon="pi pi-plus" outlined
              style={{ borderColor: accent, color: accent, flex: 1 }}
              onClick={() => setProductos(prev => [...prev, ITEM_VACIO()])} type="button" />
            {vacios > 0 && (
              <Button label={`Quitar ${vacios} vacío${vacios > 1 ? "s" : ""}`} icon="pi pi-filter-slash"
                outlined severity="danger" onClick={limpiarVacios} type="button"
                tooltip="Eliminar productos sin seleccionar" tooltipOptions={{ position: "top" }} />
            )}
          </div>
        </>
      )}

      {/* Total general */}
      {formData.destino !== 'S' && productos.length > 1 && (
        <div className="flex justify-content-end align-items-center gap-2 mb-3 px-3 py-2"
          style={{ background: accentBg, borderRadius: 8, border: `1px solid ${accentBorder}` }}>
          <span className="text-sm text-500 font-bold">TOTAL DEL PEDIDO</span>
          <span className="font-bold" style={{ color: accent, fontSize: "1.2rem" }}>
            $ {importeTotal.toFixed(2)}
          </span>
        </div>
      )}

      {/* Recetas — solo si es Surtimiento */}
      {formData.destino === 'S' && (
        <div className="col-12 field">
          <label className="font-bold block mb-1 text-sm">
            Subrecetas <span style={{ color: accent }}>*</span>
          </label>
          <Recetas
            value={formData.recetas}
            onChange={(val) => setFormData(p => ({ ...p, recetas: val }))}
          />
          {submitted && formData.recetas.length === 0 && (
            <small className="p-error">Selecciona al menos una subreceta</small>
          )}
        </div>
      )}

      <div className="flex gap-2 justify-content-end mt-2">
        <Button label="Cancelar" icon="pi pi-times" outlined severity="secondary" onClick={onCancel} type="button" />
        <Button label="Actualizar" icon="pi pi-check" style={{ background: accent, border: "none" }}
          loading={loading} onClick={handleActualizar} type="button" />
      </div>

      <Dialog visible={dlgCarta !== null} onHide={cerrarCarta}
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

export default EditarPedido;