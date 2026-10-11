import React, { useState, useRef } from "react";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { Dropdown } from "primereact/dropdown";
import axios from "axios";

function EstatusCs({ Id, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const toast = useRef(null);
  const [selectedEstado, setSelectedEstado] = useState(null);

  const estados = [
    { name: "Inactivo", code: "0" },
    { name: "Activo", code: "1" }
  ];

  const handleUpdate = async () => {
    if (!selectedEstado) {
      toast.current.show({
        severity: "warn",
        summary: "Atención",
        detail: "Debes seleccionar un estado",
        life: 3000
      });
      return;
    }

    try {
      setLoading(true);
      const API_URL = `${import.meta.env.VITE_API_URL}/seg/pe/ESTATUS.php`;

      const response = await axios.post(
        API_URL,
        {
          id: Id,
          estatus: selectedEstado.code, 
        },
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      if (response.data.success) {
        toast.current.show({
          severity: "success",
          summary: "Éxito",
          detail: "Estado actualizado ✅",
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
      console.error("Error al actualizar estado:", error);
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Error de red al actualizar estado",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-d-flex p-flex-column p-ai-center p-jc-center gap-3">
      <Toast ref={toast} />

      <Dropdown
        value={selectedEstado}
        onChange={(e) => setSelectedEstado(e.value)}
        options={estados}
        optionLabel="name"
        placeholder="Selecciona estado"
        className="w-full md:w-14rem"
      />

      <br />

      <div className="p-d-flex gap-2">
        <Button
          label={loading ? "Actualizando..." : "Actualizar"}
          className="p-button-info"
          onClick={handleUpdate}
          loading={loading}
        />
      </div>
    </div>
  );
}


export default EstatusCs;