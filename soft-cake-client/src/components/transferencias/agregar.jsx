import React, { useState, useRef, useEffect } from "react";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { Dropdown } from "primereact/dropdown";
import { classNames } from "primereact/utils";
import axios from "axios";
import { useAuth } from "../context/useAuth";
import Terminado from "./terminados";

// Opciones de filtro por tipo de pedido
const TIPO_OPTIONS = [
  { label: "Todos",                  value: "" },
  { label: "P – Punto de venta",     value: "P" },
  { label: "D – Pedido Directo",     value: "D" },
  { label: "S – Abastecimiento",     value: "S" },
];

function Agregar({ onSuccess, onCancel }) {
  const { usuario } = useAuth();
  const id_emisor  = usuario?.id_emisor  || null;
  const id_usuario = usuario?.id_usuario || null;

  const [formData, setFormData] = useState({
    id_almacen:          0,
    id_empleado_manda:   id_usuario,
    id_empleado_recibe:  0,
    fecha_emision:       new Date().toISOString().split("T")[0],
    salida_directa:      0,
    id_emisor:           id_emisor,
    items:               [],
  });

  const [loading,       setLoading]     = useState(false);
  const [submitted,     setSubmitted]   = useState(false);
  const [loadingData,   setLoadingData] = useState(false);
  const [empleado,      setEmpleado]    = useState([]);
  const [almacen,       setAlmacen]     = useState([]);
  const [salidaDirecta, setSalidaDirecta] = useState(false);

  const toast   = useRef(null);
  const API_URL = `${import.meta.env.VITE_API_URL}trans/INSERT.php`;

  useEffect(() => {
    if (id_emisor) {
      setFormData(prev => ({ ...prev, id_emisor }));
      fetchAlmacen();
      fetchEmpleados();
    }
  }, [id_emisor]);

  const handleSalidaDirecta = (checked) => {
    setSalidaDirecta(checked);
    setFormData(prev => ({
      ...prev,
      salida_directa:     checked ? 1 : 0,
      id_almacen:         checked ? 0 : prev.id_almacen,
      id_empleado_recibe: checked ? 0 : prev.id_empleado_recibe,
    }));
  };

  const fetchAlmacen = async () => {
    setLoadingData(true);
    try {
      const url      = `${import.meta.env.VITE_API_URL}catalogos/alm/GET.php?id_emisor=${id_emisor}`;
      const response = await axios.get(url);
      setAlmacen(response.data.map(item => ({ label: item.descripcion, value: item.id })));
    } catch (error) {
      console.error("Error al obtener almacenes:", error);
      toast.current?.show({ severity: "error", summary: "Error",
        detail: "No se pudieron cargar los almacenes", life: 3000 });
    } finally {
      setLoadingData(false);
    }
  };

  const fetchEmpleados = async () => {
    setLoadingData(true);
    try {
      const url      = `${import.meta.env.VITE_API_URL}catalogos/us/GET.php`;
      const response = await axios.get(url);
      setEmpleado(
        response.data
          .filter(item => item.id_emisor === id_emisor)
          .map(item => ({ label: item.username, value: item.id }))
      );
    } catch (error) {
      console.error("Error al obtener empleados:", error);
      toast.current?.show({ severity: "error", summary: "Error",
        detail: "No se pudieron cargar los empleados", life: 3000 });
    } finally {
      setLoadingData(false);
    }
  };

  const handleDropdownChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const selectedPedidos = formData.items.map(i => i.id_pedido);

  const handlePedidosChange = (ids) => {
  setFormData(prev => ({
    ...prev,
    items: ids.map(id => ({ id_pedido: id })),
  }));
};

  // ── Manejo de checkboxes ────
  const selectedIds = new Set(formData.items.map(i => i.id_pedido));

  const toggleItem = (id) => {
    setFormData(prev => {
      const exists = prev.items.some(i => i.id_pedido === id);
      const items  = exists
        ? prev.items.filter(i => i.id_pedido !== id)
        : [...prev.items, { id_pedido: id }];
      return { ...prev, items };
    });
  };

  const toggleAll = (visibles) => {
    const todosSeleccionados = visibles.every(p => selectedIds.has(p.id));
    setFormData(prev => {
      if (todosSeleccionados) {
        // Quitar solo los visibles
        const idsVisibles = new Set(visibles.map(p => p.id));
        return { ...prev, items: prev.items.filter(i => !idsVisibles.has(i.id_pedido)) };
      } else {
        
        // Agregar los que faltan
        const nuevos = visibles
          .filter(p => !selectedIds.has(p.id))
          .map(p => ({ id_pedido: p.id }));
        return { ...prev, items: [...prev.items, ...nuevos] };
      }
    });
  };

  // ── Validación ────────────────────────────────────────────────────────────
  const isFormValid = () => {
    const tieneItems = formData.items.length > 0;
    if (!salidaDirecta) {
      return tieneItems && formData.id_almacen && formData.id_empleado_recibe;
    }
    return tieneItems;
  };

  const handleSubmit = async () => {
    setSubmitted(true);
    if (!isFormValid()) {
      toast.current?.show({ severity: "warn", summary: "Validación",
        detail: "Por favor complete los campos requeridos", life: 3000 });
      return;
    }
    try {
      setLoading(true);
      const response = await axios.post(API_URL, formData, {
        headers: { "Content-Type": "application/json" },
      });
      if (response.data.success) {
        toast.current?.show({ severity: "success", summary: "Éxito",
          detail: `Transferencia ${response.data.id} agregada correctamente ✅`, life: 3000 });
        if (onSuccess) onSuccess();
      } else {
        toast.current?.show({ severity: "error", summary: "Error",
          detail: response.data.error || "Error desconocido", life: 3000 });
      }
    } catch (error) {
      console.error("Error al agregar:", error);
      toast.current?.show({ severity: "error", summary: "Error",
        detail: "Error de red al agregar", life: 3000 });
    } finally {
      setLoading(false);
    }
  };

  if (!id_emisor) {
    return (
      <div className="p-fluid">
        <div className="flex justify-content-center align-items-center py-4">
          <div className="text-center">
            <i className="pi pi-spin pi-spinner" style={{ fontSize: "2rem" }} />
            <p className="mt-2">Cargando datos...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-fluid">
      <Toast ref={toast} />
      <div className="grid">

        {/* Checkbox Salida Directa */}
        <div className="col-12">
          <div className="field-checkbox">
            <input
              type="checkbox"
              id="salida_directa"
              checked={salidaDirecta}
              onChange={(e) => handleSalidaDirecta(e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="salida_directa" className="font-bold">
              Salida directa
            </label>
          </div>
        </div>

        {/* ── Tabla de Terminados ───────────────────────────────────────── */}
        <div className="col-12">
          <Terminado
            selectedIds={selectedPedidos}
            onSelChange={handlePedidosChange}
            submitted={submitted}
          />
        </div>

        {/* Almacén */}
        <div className="col-12 md:col-6">
          <div className="field">
            <label htmlFor="id_almacen" className="font-bold block">
              Almacén {!salidaDirecta && <span className="text-red-500">*</span>}
            </label>
            <Dropdown
              id="id_almacen"
              value={formData.id_almacen || null}
              options={almacen}
              onChange={(e) => handleDropdownChange("id_almacen", e.value)}
              placeholder={loadingData ? "Cargando..." : "Seleccione un almacén"}
              className={classNames("w-full", {
                "p-invalid": submitted && !salidaDirecta && !formData.id_almacen,
              })}
              disabled={loadingData || salidaDirecta}
              showClear
              filter
            />
            {submitted && !salidaDirecta && !formData.id_almacen && (
              <small className="p-error">El almacén es requerido</small>
            )}
          </div>
        </div>

        {/* Empleado que recibe */}
        <div className="col-12 md:col-6">
          <div className="field">
            <label htmlFor="id_empleado_recibe" className="font-bold block">
              Recibe {!salidaDirecta && <span className="text-red-500">*</span>}
            </label>
            <Dropdown
              id="id_empleado_recibe"
              value={formData.id_empleado_recibe || null}
              options={empleado}
              onChange={(e) => handleDropdownChange("id_empleado_recibe", e.value)}
              placeholder={loadingData ? "Cargando..." : "Seleccione un empleado"}
              className={classNames("w-full", {
                "p-invalid": submitted && !salidaDirecta && !formData.id_empleado_recibe,
              })}
              disabled={loadingData || salidaDirecta}
              showClear
              filter
            />
            {submitted && !salidaDirecta && !formData.id_empleado_recibe && (
              <small className="p-error">El empleado que recibe es requerido</small>
            )}
          </div>
        </div>

      </div>

      {/* Botones */}
      <div className="flex justify-content-end mt-4 gap-2">
        {onCancel && (
          <Button label="Cancelar" icon="pi pi-times"
            className="p-button-secondary" onClick={onCancel} disabled={loading} />
        )}
        <Button
          label={loading ? "Guardando..." : "Agregar"}
          icon="pi pi-check"
          className="p-button-success"
          onClick={handleSubmit}
          loading={loading}
        />
      </div>
    </div>
  );
}

export default Agregar;