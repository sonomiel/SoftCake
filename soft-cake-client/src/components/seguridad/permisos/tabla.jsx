import React, { useEffect, useState } from "react";
import axios from "axios";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Toolbar } from "primereact/toolbar";
import { InputText } from "primereact/inputtext";
import { Tag } from "primereact/tag";
import { ProgressSpinner } from "primereact/progressspinner";
import { Toast } from "primereact/toast";
import { useRef } from "react";
import Agregar from "./agregar";
import Editar from "./editar";
import Estatus from "./estatus";
import Eliminar from "./eliminar";

import { usePermisos } from "../../context/permisoscontext";
import { PERMISOS, MODULOS } from "../../constants/permisos";

function Tabla() {
  const { usuario, tieneModulo, tienePermiso, idsModulos, loading } = usePermisos();
  const id_emisor = usuario?.id_emisor || null;
  const accesoModulo = tieneModulo(MODULOS.PERMISO);
  const toast = useRef(null);

  const canAgregar = accesoModulo && tienePermiso(PERMISOS.AGREGAR);
  const canEditar = accesoModulo && tienePermiso(PERMISOS.EDITAR);
  const canEliminar = accesoModulo && tienePermiso(PERMISOS.ELIMINAR);
  const canConfig = accesoModulo && tienePermiso(PERMISOS.CONFIGURAR);

  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [selectedCs, setSelectedCs] = useState(null);
  const [showAgregar, setShowAgregar] = useState(false);
  const [showEditar, setShowEditar] = useState(false);
  const [showEliminar, setShowEliminar] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [globalFilter, setGlobalFilter] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Detectar cambios en el tamaño de la pantalla
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Función para mostrar notificaciones
  const showToast = (severity, summary, detail) => {
    if (toast.current) {
      toast.current.show({ severity, summary, detail, life: 3000 });
    }
  };

  // Función para obtener los datos
  const fetchData = async () => {
    if (!id_emisor) {
      setError("No hay usuario autenticado");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const API_URL = `${import.meta.env.VITE_API_URL}/seg/pe/GET.php`;
      const response = await axios.get(API_URL);
      
      if (response.data && Array.isArray(response.data)) {
        setData(response.data);
        setFilteredData(response.data);
      } else {
        console.error("Formato de datos incorrecto:", response.data);
        setError("Formato de datos incorrecto");
        setData([]);
        setFilteredData([]);
        showToast('error', 'Error', 'Formato de datos incorrecto');
      }
    } catch (error) {
      console.error("Error al obtener los datos:", error);
      setError("Error al cargar los datos: " + error.message);
      setData([]);
      setFilteredData([]);
      showToast('error', 'Error', 'No se pudieron cargar los datos');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id_emisor) {
      fetchData();
    }
  }, [id_emisor]);

  // Efecto para filtrar datos cuando cambia el filtro global
  useEffect(() => {
    if (!globalFilter || !globalFilter.trim()) {
      setFilteredData(data);
      return;
    }

    const filterValue = globalFilter.toLowerCase().trim();
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
    await fetchData();
  };

  // Template para el estatus
  const statusBodyTemplate = (rowData) => {
    const isActive = rowData.estatus === 1;
    return (
      <Tag 
        value={isActive ? "Activo" : "Inactivo"}
        severity={isActive ? "success" : "danger"}
        icon={isActive ? "pi pi-check" : "pi pi-times"}
        rounded
      />
    );
  };

  // Template para las acciones
  const actionBodyTemplate = (rowData) => (
    <div className="flex gap-2">
      {canEditar && (
        <Button
          rounded 
          outlined 
          severity="info" 
          icon="pi pi-pencil"
          tooltip={!isMobile ? "Editar" : null}
          tooltipOptions={{ position: 'top' }}
          onClick={() => { 
            setSelectedCs(rowData); 
            setShowEditar(true); 
          }}
          className={isMobile ? "p-button-sm" : ""}
        />
      )}
      {canEliminar && (
        <Button
          rounded 
          outlined 
          severity="danger"
          icon="pi pi-trash"
          tooltip={!isMobile ? "Eliminar" : null}
          tooltipOptions={{ position: 'top' }}
          onClick={() => { 
            setSelectedCs(rowData); 
            setShowEliminar(true); 
          }}
          className={isMobile ? "p-button-sm" : ""}
        />
      )}
      {canConfig && (
        <Button
          rounded 
          outlined 
          severity="warning"
          icon="pi pi-cog"
          tooltip={!isMobile ? "Configuración" : null}
          tooltipOptions={{ position: 'top' }}
          onClick={() => { 
            setSelectedCs(rowData); 
            setShowConfig(true); 
          }}
          className={isMobile ? "p-button-sm" : ""}
        />
      )}
    </div>
  );

  const leftToolbarTemplate = () => {
    if (!canAgregar) return null;
    return (
      <div className="flex gap-2">
        <Button
          icon="pi pi-plus"
          label={!isMobile ? "Agregar" : ""}
          className={`p-button-success ${isMobile ? 'p-button-rounded' : ''}`}
          onClick={() => setShowAgregar(true)}
          tooltip={isMobile ? "Agregar" : null}
          tooltipOptions={{ position: 'bottom' }}
        />
      </div>
    );
  };

    const rightToolbarTemplate = () => {
    return (
    <div className="p-inputgroup">
      <span className="p-inputgroup-addon">
        <i className="pi pi-search"></i>
      </span>
      <InputText
        placeholder="Buscar"
        value={globalFilter}
        onChange={(e) => setGlobalFilter(e.target.value)}
      />
        {globalFilter && (
          <Button
            icon="pi pi-times"
            className={`p-button-text p-button-sm ${isMobile ? 'p-button-rounded ml-2' : ''}`}
            tooltip="Limpiar búsqueda"
            tooltipOptions={{ position: 'top' }}
            onClick={() => setGlobalFilter("")}
          />
        )}
      </div>
    );
  };

  // Template para cuando no hay datos
  const emptyMessageTemplate = () => {
    return (
      <div className="text-center p-4">
        <i className="pi pi-info-circle" style={{ fontSize: '2rem', color: 'var(--primary-color)' }}></i>
        <p className="mt-2">{globalFilter ? "No se encontraron resultados" : "No hay datos disponibles"}</p>
      </div>
    );
  };

  // Si está cargando permisos
  if (loading) {
    return (
      <div className="flex justify-content-center align-items-center" style={{ height: '50vh' }}>
        <div className="text-center">
          <ProgressSpinner />
          <p className="mt-2">Cargando permisos...</p>
        </div>
      </div>
    );
  }

  // Si no hay acceso al módulo
  if (!accesoModulo) {
    return (
      <div className="p-4">
        <Card className="shadow-3 text-center">
          <i className="pi pi-lock" style={{ fontSize: '3rem', color: 'var(--red-500)' }}></i>
          <h3 className="mt-3">No tienes acceso a este módulo</h3>
          <p className="text-color-secondary">Módulo requerido: PERMISOS</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4">
      <Toast ref={toast} />
      
      <Card title="Permiso" className="shadow-3">
        <Toolbar 
          className="mb-4 toolbar-container" 
          right={rightToolbarTemplate}
          left={leftToolbarTemplate}
        />

        {error && (
          <div className="mb-3 p-3 bg-red-100 border-round text-red-700">
            <i className="pi pi-exclamation-triangle mr-2"></i>
            {error}
          </div>
        )}

        <DataTable
          value={filteredData}
          paginator
          rows={isMobile ? 10 : 20}
          rowsPerPageOptions={isMobile ? [10, 20, 30] : [20, 40, 60]}
          responsiveLayout={isMobile ? "stack" : "scroll"}
          breakpoint="768px"
          scrollable={!isMobile}
          scrollHeight={!isMobile ? "400px" : undefined}
          loading={isLoading}
          emptyMessage={emptyMessageTemplate}
          className={`p-datatable-sm ${isMobile ? 'p-datatable-responsive' : ''}`}
          stripedRows
          showGridlines={!isMobile}
          size={isMobile ? "small" : "normal"}
        >
          <Column field="id" header="ID" sortable style={{ minWidth: isMobile ? 'auto' : '80px' }} />
          <Column field="permiso" header="Permiso" sortable style={{ minWidth: isMobile ? 'auto' : '120px' }} />
          <Column field="descripcion" header="Descripcion" sortable style={{ minWidth: isMobile ? 'auto' : '120px' }} />
          <Column
            field="estatus"
            header="Estatus"
            sortable
            body={statusBodyTemplate}
            style={{ minWidth: isMobile ? 'auto' : '100px' }}
          />
          {(canEditar || canEliminar || canConfig) && (
            <Column 
              header="Acciones" 
              body={actionBodyTemplate} 
              style={{ minWidth: isMobile ? 'auto' : '150px' }}
            />
          )}
        </DataTable>
      </Card>

      {/* Modales con tamaño responsivo */}
      {canAgregar && (
        <Dialog
          header="Agregar "
          visible={showAgregar}
          onHide={() => setShowAgregar(false)}
          style={{ width: isMobile ? "95vw" : "800px" }}
          modal
          className="p-fluid responsive-dialog"
          dismissableMask
        >
          <Agregar
            onSuccess={() => { 
              setShowAgregar(false); 
              reloadData();
              showToast('success', 'Éxito', 'Empleado agregado correctamente');
            }}
            onCancel={() => setShowAgregar(false)}
          />
        </Dialog>
      )}

      {canEditar && (
        <Dialog
          header="Editar"
          visible={showEditar}
          onHide={() => setShowEditar(false)}
          style={{ width: isMobile ? "95vw" : "800px" }}
          modal
          dismissableMask
        >
          {selectedCs && (
            <Editar
              cs={selectedCs}
              onSuccess={() => { 
                setShowEditar(false); 
                reloadData();
                showToast('success', 'Éxito', 'Empleado actualizado correctamente');
              }}
              onCancel={() => setShowEditar(false)}
            />
          )}
        </Dialog>
      )}

      {canEliminar && (
        <Dialog
          header="Eliminar"
          visible={showEliminar}
          style={{ width: isMobile ? "95vw" : "400px" }}
          onHide={() => setShowEliminar(false)}
          modal
          dismissableMask
        >
          {selectedCs && (
            <Eliminar
              Id={selectedCs.id}
              onSuccess={() => { 
                setShowEliminar(false); 
                reloadData();
                showToast('success', 'Éxito', 'Empleado eliminado correctamente');
              }}
              onCancel={() => setShowEliminar(false)}
            />
          )}
        </Dialog>
      )}

      {canConfig && (
        <Dialog
          header="Configuración de Estatus"
          visible={showConfig}
          style={{ width: isMobile ? "95vw" : "400px" }}
          onHide={() => setShowConfig(false)}
          modal
          dismissableMask
        >
          {selectedCs && (
            <Estatus
              Id={selectedCs.id}
              onSuccess={() => { 
                setShowConfig(false); 
                reloadData();
                showToast('success', 'Éxito', 'Estatus actualizado correctamente');
              }}
              onCancel={() => setShowConfig(false)}
            />
          )}
        </Dialog>
      )}
    </div>
  );
}

export default Tabla;