import React, { useState, useEffect, useRef } from "react";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { Toast } from "primereact/toast";
import { Card } from "primereact/card";
import axios from "axios";

function Agregar({ onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    id_rol: 0,
    id_modulo: 0
  });

  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState([]);
  const [modulos, setModulos] = useState([]);

  const toast = useRef(null);

  useEffect(() => {
    const fetchDatos = async () => {
      try {
        const [rResponse, pResponse] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URL}/seg/ro/GET.php`),
          axios.get(`${import.meta.env.VITE_API_URL}/seg/mo/GET.php`)
        ]);

        const filterByEstado = (data) => {
          if (!Array.isArray(data)) return [];
          return data.filter(item => item.estatus === 1);
        };

        setRoles(filterByEstado(rResponse.data));
        setModulos(filterByEstado(pResponse.data));

      } catch (err) {
        console.error("Error al cargar datos:", err);
        toast.current.show({
          severity: "error",
          summary: "Error",
          detail: "Error al cargar datos del formulario",
          life: 3000
        });
      }
    };

    fetchDatos();
  }, []);

  const API_URL = `${import.meta.env.VITE_API_URL}/seg/ro/ro_mo/INSERT.php`;

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const isFormValid = () => {
    return formData.id_rol && formData.id_modulo;
  };

  const handleSubmit = async () => {
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
      const response = await axios.post(API_URL, formData, {
        headers: { "Content-Type": "application/json" },
      });

      if (response.data.success) {
        toast.current.show({
          severity: "success",
          summary: "Éxito",
          detail: "Agregado correctamente ✅",
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

  return (
    <div className="p-fluid">
      <Toast ref={toast} />

      <Card className="mb-3">
        <div className="grid">
          {/* Dropdown Roles */}
          <div className="col-12 md:col-6">
            <div className="field">
              <label htmlFor="id_rol" className="font-bold block mb-2">Rol</label>
              <Dropdown
                id="id_rol"
                value={formData.id_rol}
                options={roles.map(r => ({ label: r.rol, value: r.id }))}
                onChange={(e) => handleSelectChange("id_rol", e.value)}
                placeholder="Selecciona un rol"
                className="w-full"
              />
            </div>
          </div>

          {/* Dropdown Modulos */}
          <div className="col-12 md:col-6">
            <div className="field">
              <label htmlFor="id_modulo" className="font-bold block mb-2">Modulo</label>
              <Dropdown
                id="id_modulo"
                value={formData.id_modulo}
                options={modulos.map(m => ({ label: m.modulo, value: m.id }))}
                onChange={(e) => handleSelectChange("id_modulo", e.value)}
                placeholder="Selecciona un modulo"
                className="w-full"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-content-end mt-4 gap-2">
          {onCancel && (
            <Button
              label="Cancelar"
              icon="pi pi-times"
              className="p-button-secondary"
              onClick={onCancel}
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
