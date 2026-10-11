import React, { useState, useRef, useEffect } from "react";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";
import { Card } from "primereact/card";
import { Dropdown } from "primereact/dropdown";
import { classNames } from "primereact/utils";
import axios from "axios";
import { useAuth } from '../../context/useAuth';

function Editar({ cs, onSuccess, onCancel }) {
  const { usuario } = useAuth();
  const id_emisor = usuario?.id_emisor || null;

  const [formData, setFormData] = useState({ ...cs });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [tipo_almacen, setTiposAlmacen] = useState([]);

  const toast = useRef(null);

  const API_URL = `${import.meta.env.VITE_API_URL}catalogos/alm/UPDATE.php`;

  // Sincronizar formData si cambia el registro seleccionado
  useEffect(() => {
    if (cs) {
      setFormData({ ...cs, id_emisor });
      setSubmitted(false);
    }
  }, [cs, id_emisor]);

  // Cargar catálogos desde GET.php
  
  useEffect(() => {
    if (!id_emisor) return;
        const cargarDatos = async () => {
      try {
        setLoadingData(true);
        const API_GET = `${import.meta.env.VITE_API_URL}catalogos/ta/GET.php?id_emisor=${id_emisor}`;
        const response = await axios.get(API_GET);

        const data = response.data;

      if (Array.isArray(data)) {
        setTiposAlmacen(
          data.map(m => ({
            label: m.descripcion,
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

  
  const handleDropdownChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  

  const isFormValid = () => {
    return formData.descripcion?.trim();
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

      const payload = {
        ...formData,
        id_emisor
      };

      const response = await axios.put(API_URL, payload, {
        headers: { "Content-Type": "application/json" }
      });

      if (response.data.success) {
        toast.current.show({
          severity: "success",
          summary: "Éxito",
          detail: "Cliente actualizado correctamente ✅",
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

  if (!id_emisor) {
    return (
      <div className="p-fluid">
        <Card>
          <div className="flex justify-content-center align-items-center py-4">
            <div className="text-center">
              <i className="pi pi-spin pi-spinner" style={{ fontSize: "2rem" }} />
              <p className="mt-2">Cargando datos de la clínica...</p>
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
  
            {/* Descripcion */}
            <div className="col-12 md:col-6">
              <div className="field">
                <label htmlFor="descripcion" className="font-bold block">
                  Descripcion <span className="text-red-500">*</span>
                </label>
                <InputText
                  id="descripcion"
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleChange}
                  className={classNames("w-full", {
                    "p-invalid": submitted && !formData.descripcion?.trim()
                  })}
                />
              </div>
            </div>

          {/* Tipo de Almacen */}
          <div className="col-12 md:col-6">
            <div className="field">
              <label htmlFor="id_tipo_almacen" className="font-bold block">
                Tipo de Almacen
              </label>
              <Dropdown
                id="id_tipo_almacen"
                name="id_tipo_almacen"
                value={formData.id_tipo_almacen}
                options={tipo_almacen}
                onChange={(e) => handleDropdownChange("id_tipo_almacen", e.value)}
                placeholder={loadingData ? "Cargando..." : "Seleccione un almacen"}
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
