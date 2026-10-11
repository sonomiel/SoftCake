import React, { useState, useRef, useEffect } from "react";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";
import { Card } from "primereact/card";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { Password } from "primereact/password";
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

function Agregar({ onSuccess, onCancel }) {
  const { usuario } = useAuth();
  const id_emisor = usuario?.id_emisor || null;

  const [formData, setFormData] = useState({
    clave: "",
    fecha_inicio: null,
    fecha_fin: null,
    id_emisor: "",
    nombre: "",
    password: "",
    telefono: "",
    username: ""
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [emisores, setEmisores] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  const toast = useRef(null);

  const API_URL = `${import.meta.env.VITE_API_URL}catalogos/us/INSERT.php`;

  // Sincronizar id_emisor cuando esté disponible
  useEffect(() => {
    if (id_emisor) {
      setFormData(prev => ({ ...prev, id_emisor }));
    }
  }, [id_emisor]);

  // Cargar emisores
  useEffect(() => {
    if (!id_emisor) return;

    const cargarDatos = async () => {
      try {
        setLoadingData(true);
        const API_GET = `${import.meta.env.VITE_API_URL}catalogos/em/GET.php`;
        const response = await axios.get(API_GET);
        const data = response.data;

        if (Array.isArray(data)) {
          setEmisores(
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
  }, [id_emisor]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // CORREGIDO: Calendar no expone e.target.name, se pasa el nombre explícito
  const handleDateChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // CORREGIDO: Declarada correctamente
  const handleDropdownChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // CORREGIDO: Las fechas son Date, no strings, no se usa .trim()
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

      // CORREGIDO: Formatear fechas a string antes de enviar
      const payload = {
        ...formData,
        fecha_inicio: formatDate(formData.fecha_inicio),
        fecha_fin: formatDate(formData.fecha_fin)
      };

      const response = await axios.post(API_URL, payload, {
        headers: { "Content-Type": "application/json" }
      });

      if (response.data.success) {
        toast.current.show({
          severity: "success",
          summary: "Éxito",
          detail: "Usuario agregado correctamente ✅",
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
      console.error("Error al agregar:", error);
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Error de red al agregar",
        life: 3000
      });
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

          {/* Nombre */}
          <div className="col-12">
            <div className="field">
              <label htmlFor="nombre" className="font-bold block">
                Nombre <span className="text-red-500">*</span>
              </label>
              <InputText
                id="nombre"
                name="nombre"
                value={formData.nombre}
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

          {/* Username */}
          <div className="col-12 md:col-6">
            <div className="field">
              <label htmlFor="username" className="font-bold block">
                Username <span className="text-red-500">*</span>
              </label>
              <InputText
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className={classNames("w-full", {
                  "p-invalid": submitted && !formData.username?.trim()
                })}
              />
              {submitted && !formData.username?.trim() && (
                <small className="p-error block">El username es requerido</small>
              )}
            </div>
          </div>

          {/* Password */}
          <div className="col-12 md:col-6">
            <div className="field">
              <label htmlFor="password" className="font-bold block">
                Password
              </label>
              <Password
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full"
                toggleMask
                feedback={false}
              />
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
                onChange={(e) => handleDateChange("fecha_inicio", e.value)}
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
                onChange={(e) => handleDateChange("fecha_fin", e.value)}
                dateFormat="dd/mm/yy"
                className={classNames("w-full", {
                  "p-invalid": submitted && !formData.fecha_fin
                })}
                showIcon
                placeholder="Seleccione fecha"
                minDate={formData.fecha_inicio || undefined}
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
                value={formData.telefono}
                onChange={handleChange}
                className="w-full"
                keyfilter="int"
              />
            </div>
          </div>

          {/* Emisor */}
          <div className="col-12 md:col-6">
            <div className="field">
              <label htmlFor="id_emisor" className="font-bold block">
                Emisor <span className="text-red-500">*</span>
              </label>
              <Dropdown
                id="id_emisor"
                name="id_emisor"
                value={formData.id_emisor}
                options={emisores}
                onChange={(e) => handleDropdownChange("id_emisor", e.value)}
                placeholder={loadingData ? "Cargando..." : "Seleccione un emisor"}
                className={classNames("w-full", {
                  "p-invalid": submitted && !formData.id_emisor
                })}
                disabled={loadingData}
                showClear
              />
              {submitted && !formData.id_emisor && (
                <small className="p-error block">El emisor es requerido</small>
              )}
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
            label={loading ? "Guardando..." : "Agregar"}
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

export default Agregar;
