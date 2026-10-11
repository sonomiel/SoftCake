import React, { useState, useEffect, useRef } from "react";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { Toast } from "primereact/toast";
import { Card } from "primereact/card";
import axios from "axios";

function Editar({ cs, onSuccess, onCancel }) {
  const [formData, setFormData] = useState({ 
    id_rol: cs?.id_rol || null,
    id_usuario: cs?.id_usuario || null
  });
  
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState([]);
  const [usuarios, setusuarios] = useState([]);
  const toast = useRef(null);

  const API_URL = `${import.meta.env.VITE_API_URL}/seg/ro/ro_us/UPDATE.php`;

  useEffect(() => {
    const fetchDatos = async () => {
      try {
        const [rResponse, pResponse] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URL}/seg/ro/GET.php`),
          axios.get(`${import.meta.env.VITE_API_URL}/us/GET.php`)
        ]);

        const filterByEstado = (data) => {
          if (!Array.isArray(data)) return [];
          return data.filter(item => item.estatus === 1);
        };

        setRoles(filterByEstado(rResponse.data));
        setusuarios(filterByEstado(pResponse.data));

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

  // Actualizar formData cuando cambie el prop 'cs'
  useEffect(() => {
    if (cs) {
      setFormData({
        id_rol: cs.id_rol || null,
        id_usuario: cs.id_usuario || null
      });
    }
  }, [cs]);

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const isFormValid = () => {
    return formData.id_rol && formData.id_usuario;
  };

  const handleSubmit = async () => {
    if (!isFormValid()) {
      toast.current.show({
        severity: "warn",
        summary: "Validación",
        detail: "Por favor complete todos los campos requeridos",
        life: 3000,
      });
      return;
    }

    setLoading(true);

    try {
      // Preparar payload - asumiendo que necesitas enviar el ID original y los nuevos valores
      const payload = {
        id_rol_old: cs?.id_rol ? Number(cs.id_rol) : null,
        id_usuario_old: cs?.id_usuario ? Number(cs.id_usuario) : null,
        id_rol_new: Number(formData.id_rol),
        id_usuario_new: Number(formData.id_usuario)
      };


      const response = await axios.put(API_URL, payload, {
        headers: { "Content-Type": "application/json" },
      });

      if (response.data.success) {
        toast.current.show({
          severity: "success",
          summary: "Éxito",
          detail: "Relación Rol-usuario actualizada correctamente ✅",
          life: 3000,
        });
        if (onSuccess) onSuccess();
      } else {
        toast.current.show({
          severity: "error",
          summary: "Error",
          detail: response.data.error || "Error desconocido",
          life: 3000,
        });
      }
    } catch (error) {
      console.error("Error al actualizar:", error);
      let errorMessage = "Error de red al actualizar";
      
      if (error.response) {
        errorMessage = error.response.data?.error || `Error ${error.response.status}`;
      }
      
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: errorMessage,
        life: 3000,
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
          {/* Dropdown Rol */}
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

          {/* Dropdown usuario */}
          <div className="col-12 md:col-6">
            <div className="field">
              <label htmlFor="id_usuario" className="font-bold block mb-2">Usuario</label>
              <Dropdown
                id="id_usuario"
                value={formData.id_usuario}
                options={usuarios.map(m => ({ label: m.username, value: m.id }))}
                onChange={(e) => handleSelectChange("id_usuario", e.value)}
                placeholder="Selecciona un usuario"
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
              disabled={loading}
            />
          )}
          <Button
            label={loading ? "Actualizando..." : "Actualizar"}
            icon="pi pi-check"
            className="p-button-success"
            onClick={handleSubmit}
            disabled={loading || !isFormValid()}
          />
        </div>
      </Card>
    </div>
  );
}

export default Editar;