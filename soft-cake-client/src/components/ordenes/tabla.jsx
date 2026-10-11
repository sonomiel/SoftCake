import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Toolbar } from "primereact/toolbar";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";
import { useAuth } from '../context/useAuth';

import Agregar from "./agregar";
import Eliminar from "./eliminar";

import { usePermisos } from "../context/permisoscontext";
import { PERMISOS, MODULOS } from "../constants/permisos";

const FILTRO_ESTATUS = [
  { label: "Todos",      value: "todos" },
  { label: "Pendientes", value: 1       },
  { label: "Completados", value: 2      },
];

function Tabla() {
  const { usuario } = useAuth();
  const { tieneModulo, tienePermiso } = usePermisos();
  const toast = useRef(null);

  const id_emisor = usuario?.id_emisor || "";

  const accesoModulo = tieneModulo(MODULOS.INSUMOS);
  const canAgregar   = accesoModulo && tienePermiso(PERMISOS.AGREGAR);
  const canEliminar  = accesoModulo && tienePermiso(PERMISOS.ELIMINAR);
  const canConfigurar = accesoModulo && tienePermiso(PERMISOS.CONFIGURAR);

  const [data, setData]               = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [selectedCs, setSelectedCs]   = useState(null);
  const [showAgregar, setShowAgregar] = useState(false);
  const [showEliminar, setShowEliminar] = useState(false);
  const [globalFilter, setGlobalFilter] = useState("");
  const [filtroEstatus, setFiltroEstatus] = useState("todos");
  const [loading, setLoading]         = useState(false);
  const [loadingEstatus, setLoadingEstatus] = useState(null); // id en proceso

  if (!accesoModulo) {
    return (
      <div className="p-4">
        <Card className="shadow-3 text-center">
          <h3>No tienes acceso a este módulo</h3>
        </Card>
      </div>
    );
  }

  const fetchData = async () => {
    if (!id_emisor) return;
    setLoading(true);
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}ord_ins/GET.php?id_emisor=${id_emisor}`);
      setData(res.data);
    } catch {
      toast.current?.show({ severity: "error", summary: "Error", detail: "Error al obtener datos", life: 3000 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [id_emisor]);

  // Filtro combinado: texto + estatus
  useEffect(() => {
    let result = [...data];

    if (filtroEstatus !== "todos")
      result = result.filter(item => item.estatus === filtroEstatus);

    if (globalFilter.trim()) {
      const val = globalFilter.toLowerCase();
      result = result.filter(item =>
        Object.values(item).some(v => v !== null && v !== undefined && v.toString().toLowerCase().includes(val))
      );
    }

    setFilteredData(result);
  }, [globalFilter, filtroEstatus, data]);

  // ── Cambiar estatus ───────────────────────────────────────────────────────
  const handleEstatus = async (rowData) => {
    setLoadingEstatus(rowData.id);
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}ord_ins/ESTATUS.php`,
        { id: rowData.id, id_ins_gral: rowData.id_ins_gral, estatus: 2 },
        { headers: { "Content-Type": "application/json" } }
      );
      if (res.data.success) {
        toast.current?.show({ severity: "success", summary: "Actualizado", detail: "Estatus actualizado correctamente", life: 2000 });
        fetchData();
      } else {
        toast.current?.show({ severity: "error", summary: "Error", detail: res.data.error || "Error desconocido", life: 3000 });
      }
    } catch {
      toast.current?.show({ severity: "error", summary: "Error", detail: "Error de red", life: 3000 });
    } finally {
      setLoadingEstatus(null);
    }
  };

  // ── Toolbar ───────────────────────────────────────────────────────────────
  const leftToolbarTemplate = () => (
    <div className="flex gap-2 align-items-center flex-wrap">
      {canAgregar && (
        <Button icon="pi pi-plus" label="Agregar" className="p-button-success" onClick={() => setShowAgregar(true)} />
      )}
      {/* Filtro de estatus */}
      <div className="flex gap-1">
        {FILTRO_ESTATUS.map(f => (
          <Button
            key={f.value}
            label={f.label}
            size="small"
            onClick={() => setFiltroEstatus(f.value)}
            style={
              filtroEstatus === f.value
                ? { background: "rgba(196,130,60,1)", border: "none", color: "#fff" }
                : {}
            }
            outlined={filtroEstatus !== f.value}
          />
        ))}
      </div>
    </div>
  );

  const rightToolbarTemplate = () => (
    <div className="flex gap-2 align-items-center">
      <span className="p-input-icon-left">
        <i className="pi pi-search" />
        <InputText
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder="Buscar..."
          className="p-inputtext-sm"
        />
      </span>
      {globalFilter && (
        <Button icon="pi pi-times" className="p-button-text p-button-sm" tooltip="Limpiar" onClick={() => setGlobalFilter("")} />
      )}
    </div>
  );

  // ── Row style (verde si estatus == 2) ─────────────────────────────────────
  const rowStyle = (rowData) => {
    if (rowData.estatus === 2) return { background: "#d1fae5", color: "#065f46" };
    return {};
  };

  // ── Acciones ──────────────────────────────────────────────────────────────
  const actionBodyTemplate = (rowData) => (
    <div className="flex gap-2">
      {canEliminar && (
        <Button
          icon="pi pi-times"
          rounded text severity="danger"
          tooltip="Eliminar"
          tooltipOptions={{ position: "top" }}
          onClick={() => { setSelectedCs(rowData); setShowEliminar(true); }}
        />
      )}
      {canConfigurar && rowData.estatus !== 2 && (
        <Button
          icon={loadingEstatus === rowData.id ? "pi pi-spin pi-spinner" : "pi pi-check"}
          rounded text severity="success"
          tooltip="Marcar completado"
          tooltipOptions={{ position: "top" }}
          disabled={loadingEstatus === rowData.id}
          onClick={() => handleEstatus(rowData)}
        />
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="p-4">
        <Card className="shadow-3">
          <div className="flex justify-content-center align-items-center p-5">
            <i className="pi pi-spin pi-spinner text-4xl mr-2" />
            <span>Cargando datos...</span>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4">
      <Toast ref={toast} />
      <Card title="Ordenes de Compra" className="shadow-3">
        <Toolbar className="mb-4 p-3" left={leftToolbarTemplate} right={rightToolbarTemplate} />

        <div className="mb-3 text-sm text-500">
          {filteredData.length} de {data.length} registros
          {globalFilter && <span className="ml-2">— buscando: <strong>{globalFilter}</strong></span>}
        </div>

        <DataTable
          value={filteredData}
          paginator
          rows={20}
          rowsPerPageOptions={[20, 40, 60]}
          responsiveLayout="scroll"
          scrollable
          scrollHeight="600px"
          emptyMessage={globalFilter ? "No se encontraron resultados" : "No hay datos disponibles"}
          className="p-datatable-sm"
          stripedRows
          showGridlines
          rowStyle={rowStyle}
        >
          <Column field="id"             header="Id"         sortable />
          <Column field="insumo"         header="Insumo"     sortable />
          <Column field="cantidad"       header="Cantidad"   sortable />
          <Column field="fecha_emision"  header="F. Emisión" sortable />
          <Column field="fecha_entrega"  header="F. Entrega" sortable />
          {(canConfigurar || canEliminar) && (
            <Column header="Acciones" body={actionBodyTemplate} />
          )}
        </DataTable>
      </Card>

      {canAgregar && (
        <Dialog header="Agregar" visible={showAgregar} onHide={() => setShowAgregar(false)}
          style={{ width: "800px" }} modal draggable={false} resizable={false}>
          <Agregar
            onSuccess={() => { setShowAgregar(false); fetchData(); }}
            onCancel={() => setShowAgregar(false)}
          />
        </Dialog>
      )}

      {canEliminar && (
        <Dialog header="Eliminar" visible={showEliminar} onHide={() => setShowEliminar(false)}
          style={{ width: "400px" }} modal draggable={false} resizable={false}>
          {selectedCs && (
            <Eliminar
              Id={selectedCs.id}
              onSuccess={() => { setShowEliminar(false); fetchData(); }}
            />
          )}
        </Dialog>
      )}
    </div>
  );
}

export default Tabla;