import React, { useEffect, useState } from "react";
import axios from "axios";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Toolbar } from "primereact/toolbar";
import { InputText } from "primereact/inputtext";
import { useAuth } from '../../context/useAuth';

import Agregar from "./agregar";
import Editar from "./editar";
import Eliminar from "./eliminar";

import { usePermisos } from "../../context/permisoscontext";
import { PERMISOS, MODULOS } from "../../constants/permisos";

function Tabla() {
  const { usuario } = useAuth();
  const id_emisor = usuario?.id_emisor || "";
  const { tieneModulo, tienePermiso } = usePermisos();
  
  const accesoModulo = tieneModulo(MODULOS.PROVEEDORES);

  const canAgregar = accesoModulo && tienePermiso(PERMISOS.AGREGAR);
  const canEditar = accesoModulo && tienePermiso(PERMISOS.EDITAR);
  const canEliminar = accesoModulo && tienePermiso(PERMISOS.ELIMINAR);
  const canCOnfigurar = accesoModulo && tienePermiso(PERMISOS.CONFIGURAR);
    
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [selectedCs, setSelectedCs] = useState(null);
  const [showAgregar, setShowAgregar] = useState(false);
  const [showEditar, setShowEditar] = useState(false);
  const [showEliminar, setShowEliminar] = useState(false);
  const [globalFilter, setGlobalFilter] = useState("");
  const [loading, setLoading] = useState(false);

    // Si no hay acceso al módulo
  if (!accesoModulo) {
    return (
      <div className="p-4">
        <Card className="shadow-3 text-center">
          <h3>No tienes acceso a este módulo</h3>
          <p>Módulo requerido: PROVEEDORES </p>
        </Card>
      </div>
    );
  }
  useEffect(() => {
    if (!id_emisor) {
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const API_URL = `${import.meta.env.VITE_API_URL}catalogos/pr/GET.php?id_emisor=${id_emisor}`;
        const response = await axios.get(API_URL);
        setData(response.data);
        setFilteredData(response.data);
      } catch (error) {
        console.error("Error al obtener los datos:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id_emisor]); 

  // Efecto para filtrar datos cuando cambia el filtro global o los datos
  useEffect(() => {
    if (!globalFilter.trim()) {
      setFilteredData(data);
      return;
    }

    const filterValue = globalFilter.toLowerCase();
    const filtered = data.filter(item => 
      Object.values(item).some(value => 
        value !== null && 
        value !== undefined && 
        value.toString().toLowerCase().includes(filterValue)
      )
    );
    setFilteredData(filtered);
  }, [globalFilter, data]);

  const reloadData = async () => {
    if (!id_emisor) return; 
    try {
      const API_URL = `${import.meta.env.VITE_API_URL}catalogos/pr/GET.php?id_emisor=${id_emisor}`;
      const response = await axios.get(API_URL);
      setData(response.data);
    } catch (error) {
      console.error("Error al recargar datos:", error);
    }
  };

  const leftToolbarTemplate = () => {
    return (
      <div className="flex gap-2">
        <Button
          icon="pi pi-plus"
          label="Agregar"
          className="p-button-success"
          onClick={() => setShowAgregar(true)}
        />
      </div>
    );
  };

  const rightToolbarTemplate = () => {
    return (
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
          <Button
            icon="pi pi-times"
            className="p-button-text p-button-sm"
            tooltip="Limpiar búsqueda"
            tooltipOptions={{ position: 'bottom' }}
            onClick={() => setGlobalFilter("")}
          />
        )}
      </div>
    );
  };

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

  // Template para mostrar el estado de carga
  if (loading) {
    return (
      <div className="p-4">
        <Card className="shadow-3">
          <div className="flex justify-content-center align-items-center p-5">
            <i className="pi pi-spin pi-spinner text-4xl mr-2"></i>
            <span>Cargando datos...</span>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4">
      <Card title="Proveedores" className="shadow-3">
        <Toolbar 
          className="mb-4 p-3" 
          left={leftToolbarTemplate} 
          right={rightToolbarTemplate}
        />

        {/* Contador de resultados */}
        <div className="mb-3 text-sm text-500">
          {filteredData.length} de {data.length} items encontrados
          {globalFilter && (
            <span className="ml-2">
              - Buscando: "<strong>{globalFilter}</strong>"
            </span>
          )}
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
        >
          <Column field="id" header="Id" sortable style={{ width: '5%' }} />
          <Column field="rfc" header="RFC" sortable style={{ width: '15%' }} />
          <Column field="clave_proveedor" header="Clave" sortable style={{ width: '15%' }} />
          <Column field="nombre" header="Nombre" sortable style={{ width: '20%' }} />
          {(canEditar || canEliminar) && (
            <Column header="Acciones" body={actionBodyTemplate} style={{ width: '15%' }} />
          )}
          
        </DataTable>
      </Card>

      {/* Modales */}
      {canAgregar && (
        <Dialog
          header="Agregar"
          visible={showAgregar}
          onHide={() => setShowAgregar(false)}
          style={{ width: "800px" }}
          modal
          className="p-fluid"
          draggable={false}
          resizable={false}
        >
          <Agregar
            onSuccess={() => { setShowAgregar(false); reloadData(); }}
            onCancel={() => setShowAgregar(false)}
          />
        </Dialog>        
      )}

      {canEditar && (
        <Dialog
          header="Editar"
          visible={showEditar}
          onHide={() => setShowEditar(false)}
          style={{ width: "800px" }}
          modal
          className="p-fluid"
          draggable={false}
          resizable={false}
        >
          {selectedCs && (
            <Editar
              cs={selectedCs}
              onSuccess={() => { setShowEditar(false); reloadData(); }}
            />
          )}
        </Dialog>
      )}

      {canEliminar && (
        <Dialog
          header="Eliminar"
          visible={showEliminar}
          style={{ width: "400px" }}
          onHide={() => setShowEliminar(false)}
          modal
          draggable={false}
          resizable={false}
        >
          {selectedCs && (
            <Eliminar
              Id={selectedCs.id}
              onSuccess={() => { setShowEliminar(false); reloadData(); }}
            />
          )}
        </Dialog>        
      )}

    </div>
  );
}

export default Tabla;