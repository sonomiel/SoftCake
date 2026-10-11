import React, { useEffect, useState } from "react";
import axios from "axios";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Toolbar } from "primereact/toolbar";
import { InputText } from "primereact/inputtext";
import { Calendar } from "primereact/calendar";
import { useAuth } from '../context/useAuth';

import Agregar from "./agregar";
import Editar from "./editar";
import Eliminar from "./eliminar";

import { usePermisos } from "../context/permisoscontext";
import { PERMISOS, MODULOS } from "../constants/permisos";

function Tabla() {
  const { usuario } = useAuth();
  const id_emisor = usuario?.id_emisor || "";
  const { tieneModulo, tienePermiso } = usePermisos();

  const hoy = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD

  const accesoModulo = tieneModulo(MODULOS.GASTOS);

  const canAgregar = accesoModulo && tienePermiso(PERMISOS.AGREGAR);
  const canEditar = accesoModulo && tienePermiso(PERMISOS.EDITAR);
  const canEliminar = accesoModulo && tienePermiso(PERMISOS.ELIMINAR);

  const [data, setData]               = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [selectedCs, setSelectedCs]   = useState(null);

  const [showAgregar, setShowAgregar] = useState(false);
  const [showEditar, setShowEditar]   = useState(false);
  const [showEliminar, setShowEliminar] = useState(false);
  const [showItems, setShowItems]     = useState(false);

  const [globalFilter, setGlobalFilter] = useState("");
  const [loading, setLoading]         = useState(false);
  const [fechaIni, setFechaIni]       = useState(new Date()); // ← nuevo
  const [fechaFin, setFechaFin]       = useState(new Date()); // ← nuevo

  const toDate = (d) => d instanceof Date ? d.toLocaleDateString("en-CA") : d;
  
  // Si no hay acceso al módulo
  if (!accesoModulo) {
    return (
      <div className="p-4">
        <Card className="shadow-3 text-center">
          <h3>No tienes acceso a este módulo</h3>
          <p>Módulo requerido: GASTOS </p>
        </Card>
      </div>
    );
  }

  useEffect(() => {
    if (id_emisor) fetchData();
  }, [id_emisor]);

  const fetchData = async () => {
    if (!id_emisor) return;
    setLoading(true);
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}g/GET.php?id_emisor=${id_emisor}&fecha_ini=${toDate(fechaIni)}&fecha_fin=${toDate(fechaFin)}`
      );
      setData(res.data);
      setFilteredData(res.data);
    } catch (error) {
      console.error("Error al obtener los datos:", error);
    } finally {
      setLoading(false);
    }
  };

  const reloadData = () => fetchData();

  useEffect(() => {
    if (!globalFilter.trim()) { setFilteredData(data); return; }
    const val = globalFilter.toLowerCase();
    setFilteredData(data.filter(item =>
      Object.values(item).some(v => v !== null && v !== undefined && v.toString().toLowerCase().includes(val))
    ));
  }, [globalFilter, data]);

  const leftToolbarTemplate = () => (
    <div className="flex gap-2">
      <Button icon="pi pi-plus" label="Agregar" className="p-button-success"
        onClick={() => setShowAgregar(true)} />
    </div>
  );

  const rightToolbarTemplate = () => (
    <div className="flex gap-2 align-items-center flex-wrap">
      <Calendar value={fechaIni} onChange={e => setFechaIni(e.value)}
        dateFormat="dd/mm/yy" showIcon placeholder="Fecha ini"
        className="p-inputtext-sm" style={{ width: 160 }} />
      <Calendar value={fechaFin} onChange={e => setFechaFin(e.value)}
        dateFormat="dd/mm/yy" showIcon placeholder="Fecha fin"
        className="p-inputtext-sm" style={{ width: 160 }} />

      {/* ← agregar este botón */}
      <Button icon="pi pi-search" label="Buscar" className="p-button-sm"
        onClick={fetchData} disabled={!fechaIni || !fechaFin} />

      <span className="p-input-icon-left">
        <i className="pi pi-search" />
        <InputText value={globalFilter} onChange={e => setGlobalFilter(e.target.value)}
          placeholder="Buscar..." className="p-inputtext-sm" />
      </span>
    </div>
  );

  const actionBodyTemplate = (rowData) => (
    <div className="flex gap-2">
      {canEditar && (
        <Button
          icon="pi pi-pencil" 
          rounded 
          text 
          severity="info" 
          aria-label="Editar"
          tooltip="Editar"
          tooltipOptions={{ position: 'top' }}
          onClick={() => { setSelectedCs(rowData); setShowEditar(true); }}
        />        
      )}

      {canEliminar && (
       <Button
        icon="pi pi-times" 
        rounded 
        text 
        severity="danger" 
        aria-label="Eliminar"
        tooltip="Eliminar"
        tooltipOptions={{ position: 'top' }}
        onClick={() => { setSelectedCs(rowData); setShowEliminar(true); }}
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
      <Card title="Gastos" className="shadow-3">
        <Toolbar className="mb-4 p-3" left={leftToolbarTemplate} right={rightToolbarTemplate} />

        <div className="mb-3 text-sm text-500">
          {filteredData.length} de {data.length} items encontrados
          {globalFilter && <span className="ml-2">- Buscando: "<strong>{globalFilter}</strong>"</span>}
        </div>

        <DataTable value={filteredData} paginator rows={20} rowsPerPageOptions={[20, 40, 60]}
          responsiveLayout="scroll" scrollable scrollHeight="600px"
          emptyMessage={globalFilter ? "No se encontraron resultados" : "No hay datos disponibles"}
          className="p-datatable-sm" stripedRows showGridlines
          selectionMode="single"
          onRowClick={e => { setSelectedCs(e.data); setShowItems(true); }}
          rowClassName={() => "cursor-pointer"}>
          <Column field="id"          header="Id"                   sortable />
          <Column field="concepto"    header="Concepto Movimiento"  sortable />
          <Column field="proveedor"   header="Proveedor"            sortable />
          <Column field="comentarios" header="Comentarios"          sortable />
          <Column field="fecha"       header="Fecha"                sortable />
          <Column field="importe"     header="$"                    sortable />
          {(canEditar || canEliminar) && (
            <Column header="Acciones"   body={actionBodyTemplate} />
          )}
          
        </DataTable>
      </Card>

      {canAgregar && (
        <Dialog header="Agregar" visible={showAgregar} onHide={() => setShowAgregar(false)}
          style={{ width: "800px" }} modal className="p-fluid" draggable={false} resizable={false}>
          <Agregar
            onSuccess={() => { setShowAgregar(false); reloadData(); }}
            onCancel={() => setShowAgregar(false)} />
        </Dialog>        
      )}

      {canEditar && (
        <Dialog header="Editar" visible={showEditar} onHide={() => setShowEditar(false)}
          style={{ width: "800px" }} modal className="p-fluid" draggable={false} resizable={false}>
          {selectedCs && (
            <Editar cs={selectedCs}
              onSuccess={() => { setShowEditar(false); reloadData(); }} />
          )}
        </Dialog>        
      )}

      {canEliminar && (
        <Dialog header="Eliminar" visible={showEliminar} onHide={() => setShowEliminar(false)}
          style={{ width: "400px" }} modal draggable={false} resizable={false}>
          {selectedCs && (
            <Eliminar Id={selectedCs.id}
              onSuccess={() => { setShowEliminar(false); reloadData(); }} />
          )}
        </Dialog>        
      )}

    </div>
  );
}

export default Tabla;