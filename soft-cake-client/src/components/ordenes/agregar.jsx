import React, { useState, useRef, useEffect } from "react";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
import { classNames } from "primereact/utils";
import { Calendar } from "primereact/calendar";
import axios from "axios";
import { useAuth } from "../context/useAuth";

const toLocalStr = (date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const ITEM_VACIO = { id_ins_gral: null, cantidad: 1 };

function Agregar({ onSuccess, onCancel }) {
  const { usuario } = useAuth();
  const id_emisor = usuario?.id_emisor || null;

  const [formData, setFormData] = useState({
    fecha_emision:  toLocalStr(),
    fecha_entrega:  "",
    id_emisor:      id_emisor,
    items:          [{ ...ITEM_VACIO }],
  });

  const [loading, setLoading]     = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [insumos, setInsumos]     = useState([]);
  const toast = useRef(null);

  const API_URL = `${import.meta.env.VITE_API_URL}ord_ins/INSERT.php`;

  useEffect(() => {
    if (id_emisor) setFormData(prev => ({ ...prev, id_emisor }));
  }, [id_emisor]);

  useEffect(() => {
    if (!id_emisor) return;
    const cargar = async () => {
      try {
        setLoading(true);
        const [resIns, resMet] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URL}ins_gral/GET.php?id_emisor=${id_emisor}`),
        ]);
        if (Array.isArray(resIns.data))
          setInsumos(resIns.data.map(m => ({ label: m.descripcion, value: m.id })));
      } catch {
        toast.current?.show({ severity: "error", summary: "Error", detail: "Error al cargar catálogos", life: 3000 });
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, [id_emisor]);

  const updateItem = (index, field, value) =>
    setFormData(prev => {
      const items = [...prev.items];
      items[index] = { ...items[index], [field]: value };
      return { ...prev, items };
    });

  const agregarItem = () =>
    setFormData(prev => ({ ...prev, items: [...prev.items, { ...ITEM_VACIO }] }));

  const quitarItem = (index) =>
    setFormData(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));

  const isFormValid = () =>
    formData.fecha_entrega &&
    formData.id_emisor &&
    formData.items.every(item => item.id_ins_gral && item.cantidad > 0);

  const handleSubmit = async () => {
    setSubmitted(true);
    if (!isFormValid()) {
      toast.current?.show({ severity: "warn", summary: "Validación", detail: "Complete todos los campos requeridos", life: 3000 });
      return;
    }
    try {
      setLoading(true);
      const payload = {
        fecha_emision:  formData.fecha_emision,
        fecha_entrega:  formData.fecha_entrega,
        id_emisor:      formData.id_emisor,
        items: formData.items.map(({ id_ins_gral, cantidad }) => ({ id_ins_gral, cantidad })),
      };
      const res = await axios.post(API_URL, payload, { headers: { "Content-Type": "application/json" } });
      if (res.data.success) {
        toast.current?.show({ severity: "success", summary: "Éxito", detail: "Orden agregada correctamente ✅", life: 3000 });
        if (onSuccess) onSuccess();
      } else {
        toast.current?.show({ severity: "error", summary: "Error", detail: res.data.error || "Error desconocido", life: 3000 });
      }
    } catch {
      toast.current?.show({ severity: "error", summary: "Error", detail: "Error de red al agregar", life: 3000 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-fluid">
      <Toast ref={toast} />

      <div className="grid">

        {/* Fecha Emisión (solo lectura) */}
        <div className="col-12 md:col-6">
          <div className="field">
            <label className="font-bold block">F. Emisión</label>
            <InputText
              value={formData.fecha_emision}
              readOnly
              className="w-full"
              style={{ background: "#f3f4f6", color: "#6b7280" }}
            />
          </div>
        </div>

        {/* Fecha Entrega */}
        <div className="col-12 md:col-6">
          <div className="field">
            <label htmlFor="fecha_entrega" className="font-bold block">
              F. Entrega <span className="text-red-500">*</span>
            </label>
            <Calendar
              id="fecha_entrega"
              value={formData.fecha_entrega ? new Date(formData.fecha_entrega + "T00:00:00") : null}
              onChange={(e) => {
                const str = e.value ? toLocalStr(e.value) : "";
                setFormData(prev => ({ ...prev, fecha_entrega: str }));
              }}
              dateFormat="dd/mm/yy"
              placeholder="Seleccione fecha"
              className={classNames("w-full", { "p-invalid": submitted && !formData.fecha_entrega })}
              showIcon
              minDate={new Date()}
            />
            {submitted && !formData.fecha_entrega && (
              <small className="p-error">La fecha de entrega es requerida</small>
            )}
          </div>
        </div>
      </div>

      {/* ── Items ── */}
      <div className="mt-2 mb-2">
        <div className="flex justify-content-between align-items-center mb-2">
          <Button
            label="Agregar insumo"
            icon="pi pi-plus"
            size="small"
            onClick={agregarItem}
            style={{ background: "rgba(196,130,60,1)", border: "none" }}
          />
        </div>

        {formData.items.map((item, index) => (
          <div key={index} className="grid align-items-end mb-2"
            style={{ background: index % 2 === 0 ? "#fdf8f3" : "#fff", borderRadius: 6, padding: "8px 4px" }}>

            {/* Insumo */}
            <div className="col-12 md:col-8">
              <div className="field mb-0">
                <label className="font-bold block text-sm">Insumo *</label>
                <Dropdown
                  value={item.id_ins_gral}
                  options={insumos}
                  onChange={(e) => updateItem(index, "id_ins_gral", e.value)}
                  placeholder="Seleccione insumo"
                  className={classNames("w-full", { "p-invalid": submitted && !item.id_ins_gral })}
                  disabled={loading}
                  filter
                  showClear
                />
                {submitted && !item.id_ins_gral && (
                  <small className="p-error">Requerido</small>
                )}
              </div>
            </div>

            {/* Cantidad */}
            <div className="col-10 md:col-3">
              <div className="field mb-0">
                <label className="font-bold block text-sm">Cantidad *</label>
                <InputNumber
                  value={item.cantidad}
                  onValueChange={(e) => updateItem(index, "cantidad", e.value)}
                  min={1}
                  className={classNames("w-full", { "p-invalid": submitted && !(item.cantidad > 0) })}
                />
                {submitted && !(item.cantidad > 0) && (
                  <small className="p-error">Requerido</small>
                )}
              </div>
            </div>

            {/* Quitar */}
            <div className="col-2 md:col-1 flex align-items-center justify-content-center">
              <Button
                icon="pi pi-trash"
                rounded text severity="danger"
                onClick={() => quitarItem(index)}
                disabled={formData.items.length === 1}
                tooltip="Quitar"
              />
            </div>

          </div>
        ))}
      </div>

      {/* Botones */}
      <div className="flex justify-content-end mt-4 gap-2">
        {onCancel && (
          <Button label="Cancelar" icon="pi pi-times" className="p-button-secondary" onClick={onCancel} disabled={loading} />
        )}
        <Button
          label={loading ? "Guardando..." : "Agregar"}
          icon="pi pi-check"
          className="p-button-success"
          onClick={handleSubmit}
          disabled={loading}
        />
      </div>
    </div>
  );
}

export default Agregar;