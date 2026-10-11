import React, { useState, useRef, useEffect } from "react";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";
import { Card } from "primereact/card";
import { classNames } from "primereact/utils";
import axios from "axios";

function Editar({ cs, onSuccess }) {
  const [formData, setFormData] = useState({ 
    id: "",
    rol: "",
    descripcion: ""
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const toast = useRef(null);

  const API_URL = `${import.meta.env.VITE_API_URL}/seg/ro/UPDATE.php`;

  useEffect(() => {
    if (cs) {
      setFormData({
        id: cs.id || "",
        rol: cs.rol || "",
        descripcion: cs.descripcion || ""
      });
    }
  }, [cs]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // 🔹 CORREGIDO: Validar el campo correcto (rol)
  const isFormValid = () => {
    return formData.rol && formData.rol.trim() !== "";
  };

  const handleSubmit = async () => {
    setSubmitted(true);

    if (!isFormValid()) {
      toast.current.show({
        severity: "warn",
        summary: "Validación",
        detail: "Por favor complete el campo rol",
        life: 3000,
      });
      return;
    }

    // 🔹 CORREGIDO: Verificar que tenemos el ID
    if (!formData.id) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo identificar la rol a editar",
        life: 3000,
      });
      return;
    }

    setLoading(true);

    try {
      const payload = {
        id: formData.id,
        rol: formData.rol.trim(),
        descripcion: formData.descripcion?.trim() || ""
      };

      const response = await axios.put(API_URL, payload, {
        headers: { "Content-Type": "application/json" },
      });

      if (response.data.success) {
        toast.current.show({
          severity: "success",
          summary: "Éxito",
          detail: "rol actualizada correctamente ✅",
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
      console.error("Error al actualizar rol:", error);
      
      let errorMessage = "Error de red al actualizar rol";
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
        {/* Rol */}
        <div className="field mb-4">
          <label htmlFor="rol" className="font-bold block mb-2">
            Rol <span className="text-red-500">*</span>
          </label>
          <InputText
            id="rol"
            name="rol"
            value={formData.rol || ""}
            onChange={handleChange}
            className={classNames("w-full", {
              "p-invalid": submitted && !formData.rol,
            })}
            placeholder="Ingrese el nombre de la rol"
          />
          {submitted && !formData.rol && (
            <small className="p-error block">El nombre del rol es requerido</small>
          )}
        </div>

        {/* Descripción */}
        <div className="field mb-4">
          <label htmlFor="descripcion" className="font-bold block mb-2">
            Descripción
          </label>
          <InputText
            id="descripcion"
            name="descripcion"
            value={formData.descripcion || ""}
            onChange={handleChange}
            className="w-full"
            placeholder="Ingrese una descripción (opcional)"
          />
        </div>

        <div className="flex justify-content-end mt-4">
          <Button
            label={loading ? "Guardando..." : "Guardar Cambios"}
            icon="pi pi-check"
            className="p-button-success"
            onClick={handleSubmit}
            disabled={loading || !formData.id}
          />
        </div>
      </Card>
    </div>
  );
}

export default Editar;