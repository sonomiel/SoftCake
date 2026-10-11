import React, { useRef, useState } from "react";
import axios from "axios";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { useAuth } from '../../context/useAuth';

function Productos({ lista, setLista, onGuardadoExitoso, tipo }) {
  const { usuario } = useAuth();
  const id_emisor = usuario?.id_emisor || null;
  const toast = useRef(null);
  const [loading, setLoading] = useState(false);

  const handleEliminar = (rowData) => {
    setLista(prev => prev.filter(i => i._key !== rowData._key));
  };

  const handleGuardar = async () => {
    if (lista.length === 0) {
      toast.current.show({
        severity: "warn",
        summary: "Lista vacía",
        detail: "Agrega al menos un producto antes de guardar",
        life: 3000,
      });
      return;
    }
    try {
      setLoading(true);
        const API_URL = tipo === "producto"
          ? `${import.meta.env.VITE_API_URL}etrance/INSERT_PC.php`
          : `${import.meta.env.VITE_API_URL}etrance/INSERT.php`;
        const response = await axios.post(API_URL, { id_emisor, items: lista }, {
        headers: { "Content-Type": "application/json" },
      });

      if (response.data.success) {
        toast.current.show({
          severity: "success",
          summary: "Éxito",
          detail: `Entrada guardada correctamente ✅`,
          life: 3000,
        });
        setLista([]);
        // Esperar un momento para que el servidor termine de actualizar
        setTimeout(() => {
          if (onGuardadoExitoso) onGuardadoExitoso();
        }, 500);
      }else {
        toast.current.show({
          severity: "error",
          summary: "Error",
          detail: response.data.error || "Error desconocido",
          life: 3000,
        });
      }
    } catch (error) {
      console.error("Error al guardar:", error);
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Error de red al guardar",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const accionesTemplate = (rowData) => (
    <Button
      icon="pi pi-trash"
      className="p-button-danger p-button-text p-button-sm"
      tooltip="Eliminar"
      tooltipOptions={{ position: "top" }}
      onClick={() => handleEliminar(rowData)}
      type="button"
    />
  );

  return (
    <div className="p-fluid">
      <Toast ref={toast} />
      <Card>
        <div style={{ height: "270px" }}>
          <DataTable
            value={lista}
            dataKey="_key"
            scrollable
            scrollHeight="200px"
            className="p-datatable-sm"
            stripedRows
            showGridlines
            emptyMessage="No hay productos agregados aún"
          >
            <Column field="almacen"      header="Almacén"    sortable />
            <Column field="insumo" header="Nombre" sortable />
            <Column field="existencia"   header="Existencia" />
            <Column field="cantidad"     header="C. Surtida" />
            <Column field="precio"       header="Precio"
              body={(r) => `$${Number(r.precio ?? 0).toFixed(2)}`} />
            <Column field="unidad_medida" header="UM" />
            <Column header="Importe"
              body={(r) => `$${(Number(r.cantidad ?? 0) * Number(r.precio ?? 0)).toFixed(2)}`} />
            <Column header="" body={accionesTemplate} style={{ width: "60px" }} />
          </DataTable>
        </div>

        <div className="flex justify-content-end mt-3">
          <Button
            label={loading ? "Guardando..." : `Guardar entrada (${lista.length})`}
            icon="pi pi-save"
            className="p-button-success"
            onClick={handleGuardar}
            disabled={loading || lista.length === 0}
            type="button"
          />
        </div>
      </Card>
    </div>
  );
}

export default Productos;
