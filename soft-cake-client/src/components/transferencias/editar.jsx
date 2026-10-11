import React, { useState, useRef, useEffect } from "react";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { Card } from "primereact/card";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
import { classNames } from "primereact/utils";
import axios from "axios";
import { useAuth } from "../context/useAuth";

function Editar({ cs, onSuccess, onCancel }) {
  const { usuario } = useAuth();
  const id_emisor = usuario?.id_emisor || null;

  const [formData,    setFormData]    = useState({ ...cs });
  const [loading,     setLoading]     = useState(false);
  const [submitted,   setSubmitted]   = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [producto,    setProducto]    = useState([]); // ✅ nombre consistente
  const [almacen,     setAlmacen]     = useState([]); // ✅ agregado
  const [empleado,    setEmpleado]    = useState([]); // ✅ agregado

  const toast = useRef(null);

  const API_URL = `${import.meta.env.VITE_API_URL}trans/UPDATE.php`; // ✅ endpoint correcto

  useEffect(() => {
    if (cs) {
      setFormData({ ...cs, id_emisor });
      setSubmitted(false);
    }
  }, [cs, id_emisor]);

  useEffect(() => {
    if (id_emisor) {
      fetchProductos();
      fetchAlmacen();     // ✅ agregado
      fetchEmpleados();   // ✅ agregado
    }
  }, [id_emisor]);

  const fetchProductos = async () => {
    setLoadingData(true);
    try {
      const url      = `${import.meta.env.VITE_API_URL}pc/GET.php?id_emisor=${id_emisor}`;
      const response = await axios.get(url);
      const opciones = response.data.map(item => ({
        label: item.producto,
        value: item.id,
      }));
      setProducto(opciones); // ✅ setProducto
    } catch (error) {
      console.error("Error al obtener productos:", error);
      toast.current?.show({ severity: "error", summary: "Error",
        detail: "No se pudieron cargar los productos", life: 3000 });
    } finally {
      setLoadingData(false);
    }
  };

  // ✅ Función agregada
  const fetchAlmacen = async () => {
    setLoadingData(true);
    try {
      const url      = `${import.meta.env.VITE_API_URL}catalogos/alm/GET.php?id_emisor=${id_emisor}`;
      const response = await axios.get(url);
      const opciones = response.data.map(item => ({
        label: item.descripcion,
        value: item.id,
      }));
      setAlmacen(opciones);
    } catch (error) {
      console.error("Error al obtener almacenes:", error);
      toast.current?.show({ severity: "error", summary: "Error",
        detail: "No se pudieron cargar los almacenes", life: 3000 });
    } finally {
      setLoadingData(false);
    }
  };

  // ✅ Función agregada
  const fetchEmpleados = async () => {
    setLoadingData(true);
    try {
      const url      = `${import.meta.env.VITE_API_URL}catalogos/us/GET.php`;
      const response = await axios.get(url);
      const opciones = response.data
        .filter(item => item.id_emisor === id_emisor)
        .map(item => ({
          label: item.username,
          value: item.id,
        }));
      setEmpleado(opciones);
    } catch (error) {
      console.error("Error al obtener empleados:", error);
      toast.current?.show({ severity: "error", summary: "Error",
        detail: "No se pudieron cargar los empleados", life: 3000 });
    } finally {
      setLoadingData(false);
    }
  };

  const handleNumberChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDropdownChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const isFormValid = () => {
    return formData.id_prod_carta && formData.cantidad > 0; // ✅ campos correctos
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
      const payload  = { ...formData, id_emisor };
      const response = await axios.put(API_URL, payload, {
        headers: { "Content-Type": "application/json" },
      });
      if (response.data.success) {
        toast.current?.show({ severity: "success", summary: "Éxito",
          detail: "Transferencia actualizada correctamente ✅", life: 3000 });
        if (onSuccess) onSuccess();
      } else {
        toast.current?.show({ severity: "error", summary: "Error",
          detail: response.data.error || "Error desconocido", life: 3000 });
      }
    } catch (error) {
      console.error("Error al actualizar:", error);
      toast.current?.show({ severity: "error", summary: "Error",
        detail: error.response?.data?.error || "Error de red al actualizar", life: 3000 });
    } finally {
      setLoading(false);
    }
  };

  if (!id_emisor) {
    return (
      <div className="p-fluid">
        <Card>
          <div className="flex justify-content-center align-items-center py-4">
            <div className="text-center">
              <i className="pi pi-spin pi-spinner" style={{ fontSize: "2rem" }} />
              <p className="mt-2">Cargando datos...</p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-fluid">
      <Toast ref={toast} />
      <Card className="mb-3">
        <div className="grid">
          {/* Cantidad */}
          <div className="col-12 md:col-6">
            <div className="field">
              <label htmlFor="cantidad" className="font-bold block">
                Cantidad <span className="text-red-500">*</span>
              </label>
              <InputNumber
                id="cantidad"
                value={formData.cantidad}
                onValueChange={(e) => handleNumberChange("cantidad", e.value)}
                min={1}
                className={classNames("w-full", {
                  "p-invalid": submitted && !(formData.cantidad > 0)
                })}
              />
              {submitted && !(formData.cantidad > 0) && (
                <small className="p-error">La cantidad es requerida</small>
              )}
            </div>
          </div>

          {/* Producto */}
          <div className="col-12 md:col-6">
            <div className="field">
              <label htmlFor="id_prod_carta" className="font-bold block">
                Producto <span className="text-red-500">*</span>
              </label>
              <Dropdown
                id="id_prod_carta"
                value={formData.id_prod_carta}
                options={producto}
                onChange={(e) => handleDropdownChange("id_prod_carta", e.value)}
                placeholder="Seleccione un producto"
                className={classNames("w-full", {
                  "p-invalid": submitted && !formData.id_prod_carta
                })}
                showClear
                filter
              />
              {submitted && !formData.id_prod_carta && (
                <small className="p-error">El producto es requerido</small>
              )}
            </div>
          </div>

          {/* Almacén */}
          <div className="col-12 md:col-6">
            <div className="field">
              <label htmlFor="id_almacen" className="font-bold block">
                Almacén
              </label>
              <Dropdown
                id="id_almacen"
                value={formData.id_almacen}
                options={almacen}
                onChange={(e) => handleDropdownChange("id_almacen", e.value)}
                placeholder={loadingData ? "Cargando..." : "Seleccione un almacén"}
                className="w-full"
                disabled={loadingData}
                showClear
                filter
              />
            </div>
          </div>

          {/* Empleado que recibe */}
          <div className="col-12 md:col-6">
            <div className="field">
              <label htmlFor="id_empleado_recibe" className="font-bold block">
                Recibe
              </label>
              <Dropdown
                id="id_empleado_recibe"
                value={formData.id_empleado_recibe}
                options={empleado}
                onChange={(e) => handleDropdownChange("id_empleado_recibe", e.value)}
                placeholder={loadingData ? "Cargando..." : "Seleccione un empleado"}
                className="w-full"
                disabled={loadingData}
                showClear
                filter
              />
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
            label="Guardar Cambios"
            icon="pi pi-check"
            className="p-button-success"
            onClick={handleSubmit}
            loading={loading}
          />
        </div>
      </Card>
    </div>
  );
}

export default Editar;