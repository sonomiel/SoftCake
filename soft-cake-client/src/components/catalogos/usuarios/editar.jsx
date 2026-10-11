import React, { useState, useRef, useEffect } from "react";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";
import { Card } from "primereact/card";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { Password } from "primereact/password"; // CORREGIDO: faltaba este import
import { classNames } from "primereact/utils";
import axios from "axios";
import { useAuth } from '../../context/useAuth';

// Formatea un Date a "YYYY-MM-DD" para el backend
const formatDate = (date) => {
  if (!date) return "";
  const d = new Date(date);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

// Convierte string "YYYY-MM-DD" del backend a objeto Date para el Calendar
const parseDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
};

function Editar({ cs, onSuccess, onCancel }) {
  const { usuario } = useAuth();
  const id_emisor_Auth = usuario?.id_emisor || null;

  const [formData, setFormData] = useState({ ...cs });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [emisores, setEmisores] = useState([]); 
  const [loadingData, setLoadingData] = useState(false);

  const toast = useRef(null);

  const API_URL = `${import.meta.env.VITE_API_URL}catalogos/us/UPDATE.php`;

// useEffect de sincronización
useEffect(() => {
  if (cs) {
    setFormData({
      ...cs,
      fecha_inicio: parseDate(cs.fecha_inicio),
      fecha_fin: parseDate(cs.fecha_fin),
    });
    setSubmitted(false);
  }
}, [cs]);

  // Cargar emisores
  useEffect(() => {
    if (!id_emisor_Auth) return;

    const cargarDatos = async () => {
      try {
        setLoadingData(true);
        const API_GET = `${import.meta.env.VITE_API_URL}catalogos/em/GET.php`;
        const response = await axios.get(API_GET);
        const data = response.data;

        if (Array.isArray(data)) {
          setEmisores( // CORREGIDO: usar setEmisores
            data.map(m => ({
              label: m.nombre,
              value: m.id
            }))
          );
        }
      } catch (error) {
        console.error("Error al cargar catálogos:", error);
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: "Error al cargar los catálogos",
          life: 3000
        });
      } finally {
        setLoadingData(false);
      }
    };

    cargarDatos();
  }, [id_emisor_Auth]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // CORREGIDO: recibe el nombre del campo explícitamente
  const handleDateChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDropdownChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // CORREGIDO: fechas son Date, no strings
  const isFormValid = () => {
    return (
      formData.nombre?.trim() &&
      formData.username?.trim() &&
      formData.fecha_inicio &&
      formData.fecha_fin &&
      formData.id_emisor
    );
  };

  const handleSubmit = async () => {
    setSubmitted(true);

    if (!isFormValid()) {
      toast.current.show({
        severity: "warn",
        summary: "Validación",
        detail: "Por favor complete los campos requeridos",
        life: 3000
      });
      return;
    }

    try {
      setLoading(true);

      // CORREGIDO: formatear fechas antes de enviar
      const payload = {
        ...formData,
        fecha_inicio: formatDate(formData.fecha_inicio),
        fecha_fin: formatDate(formData.fecha_fin)
      };

      const response = await axios.put(API_URL, payload, {
        headers: { "Content-Type": "application/json" }
      });

      if (response.data.success) {
        toast.current.show({
          severity: "success",
          summary: "Éxito",
          detail: "Usuario actualizado correctamente ✅",
          life: 3000
        });
        if (onSuccess) onSuccess();
      } else {
        toast.current.show({
          severity: "error",
          summary: "Error",
          detail: response.data.error || "Error desconocido",
          life: 3000
        });
      }
    } catch (error) {
      console.error("Error al actualizar:", error);
      const errorMessage = error.response?.data?.error || "Error de red al actualizar";
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: errorMessage,
        life: 3000
      });
    } finally {
      setLoading(false);
    }
  };

  if (!id_emisor_Auth) {
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

          {/* Nombre */}
          <div className="col-12">
            <div className="field">
              <label htmlFor="nombre" className="font-bold block">
                Nombre <span className="text-red-500">*</span>
              </label>
              <InputText
                id="nombre"
                name="nombre"
                value={formData.nombre || ""}
                onChange={handleChange}
                className={classNames("w-full", {
                  "p-invalid": submitted && !formData.nombre?.trim()
                })}
              />
              {submitted && !formData.nombre?.trim() && (
                <small className="p-error block">El nombre es requerido</small>
              )}
            </div>
          </div>

          {/* Fecha inicio */}
          <div className="col-12 md:col-4">
            <div className="field">
              <label htmlFor="fecha_inicio" className="font-bold block">
                Fecha Inicio Servicio <span className="text-red-500">*</span>
              </label>
              <Calendar
                id="fecha_inicio"
                value={formData.fecha_inicio}
                onChange={(e) => handleDateChange("fecha_inicio", e.value)} // CORREGIDO
                dateFormat="dd/mm/yy"
                className={classNames("w-full", {
                  "p-invalid": submitted && !formData.fecha_inicio
                })}
                showIcon
                placeholder="Seleccione fecha"
              />
              {submitted && !formData.fecha_inicio && (
                <small className="p-error block">La fecha de inicio es requerida</small>
              )}
            </div>
          </div>

          {/* Fecha fin */}
          <div className="col-12 md:col-4">
            <div className="field">
              <label htmlFor="fecha_fin" className="font-bold block">
                Fecha Fin de Servicio <span className="text-red-500">*</span>
              </label>
              <Calendar
                id="fecha_fin"
                value={formData.fecha_fin}
                onChange={(e) => handleDateChange("fecha_fin", e.value)} // CORREGIDO
                dateFormat="dd/mm/yy"
                className={classNames("w-full", {
                  "p-invalid": submitted && !formData.fecha_fin
                })}
                showIcon
                placeholder="Seleccione fecha"
                minDate={formData.fecha_inicio ? new Date(formData.fecha_inicio) : undefined}

              />
              {submitted && !formData.fecha_fin && (
                <small className="p-error block">La fecha de fin es requerida</small>
              )}
            </div>
          </div>

          {/* Teléfono */}
          <div className="col-12 md:col-4">
            <div className="field">
              <label htmlFor="telefono" className="font-bold block">
                Teléfono
              </label>
              <InputText
                id="telefono"
                name="telefono"
                value={formData.telefono || ""}
                onChange={handleChange}
                className="w-full"
                keyfilter="int"
              />
            </div>
          </div>

          {/* Emisor */}
          <div className="col-12">
            <div className="field">
              <label htmlFor="id_emisor" className="font-bold block">
                Emisor 
              </label>
              <Dropdown
                id="id_emisor"
                name="id_emisor"
                value={formData.id_emisor || null}
                options={emisores}
                onChange={(e) => handleDropdownChange("id_emisor", e.value)}
                placeholder={loadingData ? "Cargando..." : "Seleccione un emisor"}
                className="w-full"
                disabled={loadingData}
                showClear
              />
            </div>
          </div>

        </div>

        {/* Botones */}
        <div className="flex justify-content-end mt-4 gap-2">
          {onCancel && (
            <Button
              label="Cancelar"
              icon="pi pi-times"
              className="p-button-secondary"
              onClick={onCancel}
              disabled={loading}
            />
          )}
          <Button
            label={loading ? "Guardando..." : "Guardar Cambios"}
            icon="pi pi-check"
            className="p-button-success"
            onClick={handleSubmit}
            disabled={loading}
          />
        </div>
      </Card>
    </div>
  );
}

export default Editar;
