import React, { useState, useRef } from "react";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";
import { Card } from "primereact/card";
import { classNames } from "primereact/utils";
import axios from "axios";

function Agregar({ onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    modulo: "",
    descripcion: ""
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const toast = useRef(null);

  const API_URL = `${import.meta.env.VITE_API_URL}/seg/mo/INSERT.php`;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // 🔹 CORREGIDO: Validar el campo correcto (modulo)
  const isFormValid = () => {
    return formData.modulo && formData.modulo.trim() !== "";
  };

  const handleSubmit = async () => {
    setSubmitted(true);

    if (!isFormValid()) {
      toast.current.show({
        severity: "warn",
        summary: "Validación",
        detail: "Por favor complete el campo clínica",
        life: 3000
      });
      return;
    }

    try {
      setLoading(true);

      const payload = {
        modulo: formData.modulo.trim(),
        descripcion: formData.descripcion?.trim() || "",
      };


      const response = await axios.post(API_URL, payload, {
        headers: { "Content-Type": "application/json" },
      });

      if (response.data.success) {
        toast.current.show({
          severity: "success",
          summary: "Éxito",
          detail: "Clínica agregada correctamente ✅",
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
      
      let errorMessage = "Error de red al agregar clínica";
      if (error.response) {
        errorMessage = error.response.data?.error || `Error ${error.response.status}`;
      }
      
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

  return (
    <div className="p-fluid">
      <Toast ref={toast} />

      <Card className="mb-3">
        <div className="grid">
          <div className="col-12">
            <div className="field">
              <label htmlFor="modulo" className="font-bold block">
                Modulo <span className="text-red-500">*</span>
              </label>
              <InputText
                id="modulo"
                name="modulo"
                value={formData.modulo}
                onChange={handleChange}
                className={classNames("w-full", {
                  "p-invalid": submitted && !formData.modulo
                })}
                placeholder="Ingrese el nombre de la modulo"
              />
              {submitted && !formData.modulo && (
                <small className="p-error block">
                  El nombre del modulo es requerido
                </small>
              )}
            </div>
          </div>

          <div className="col-12">
            <div className="field">
              <label htmlFor="descripcion" className="font-bold block">
                Descripción 
              </label>
              <InputText
                id="descripcion"
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                className="w-full"
                placeholder="Ingrese una descripción (opcional)"
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