import React, { useState, useRef } from "react";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import axios from "axios";

function Eliminar({ id_rol, id_permiso, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const toast = useRef(null);

  const handleDelete = async () => {
    try {
      setLoading(true);
      const API_URL = `${import.meta.env.VITE_API_URL}/seg/ro/ro_pe/DELETE.php`;

      const response = await axios.delete(API_URL, {
        data: {
           id_rol,
           id_permiso
           }, 
        headers: { "Content-Type": "application/json" },
      });

      if (response.data.success) {
        toast.current.show({ severity: "success", summary: "Éxito", detail: `: eliminado ✅`, life: 3000 });
        if (onSuccess) onSuccess();
      } else {
        toast.current.show({ severity: "error", summary: "Error", detail: response.data.error || "Error desconocido", life: 3000 });
      }
    } catch (error) {
      console.error("Error al eliminar :", error);
      toast.current.show({ severity: "error", summary: "Error", detail: "Error de red al eliminar ", life: 3000 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-d-flex p-flex-column p-ai-center p-jc-center gap-3">
      <Toast ref={toast} />
      <p>¿Estás seguro que deseas eliminar el elemento ?</p>
      <div className="p-d-flex gap-2">
        <Button label={loading ? "Eliminando..." : "Eliminar"} className="p-button-danger" onClick={handleDelete} loading={loading} />
      </div>
    </div>
  );
}


export default Eliminar;