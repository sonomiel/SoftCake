import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Toolbar } from "primereact/toolbar";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { useAuth } from '../context/useAuth';

import Agregar from "./agregar";
import Eliminar from "./eliminar";

import { usePermisos } from "../context/permisoscontext";
import { PERMISOS, MODULOS, ROLES } from "../constants/permisos";
import EstatusCs from "./estatus";

function Tabla({ onReloadOrdenes }) {
  const { usuario } = useAuth();

  const id_emisor  = usuario?.id_emisor  || "";
  const id_usuario = usuario?.id_usuario || "";
  const { tieneModulo, tienePermiso, tieneRol } = usePermisos();

  const isAdmin = tieneRol(ROLES.ADMIN);
  const accesoModulo  = tieneModulo(MODULOS.TRANSFERENCIAS);
  const accesoPV      = tieneModulo(MODULOS.PUNTO_DE_VENTA);   // ← módulo segunda tabla
  const canAgregar    = accesoModulo && tienePermiso(PERMISOS.AGREGAR);
  const canEliminar   = accesoModulo && tienePermiso(PERMISOS.ELIMINAR);
  const canConfigurar = accesoModulo && tienePermiso(PERMISOS.CONFIGURAR);

  const [data, setData]             = useState([]);
  const [selectedCs, setSelectedCs] = useState(null);

  const [showAgregar,  setShowAgregar]  = useState(false);
  const [showEliminar, setShowEliminar] = useState(false);
  const [showConfi,    setShowConfi]    = useState(false);

  const [globalFilter,    setGlobalFilter]    = useState("");
  const [globalFilterPV,  setGlobalFilterPV]  = useState("");
  const [loading,         setLoading]         = useState(false);

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const [filtroEmpleado, setFiltroEmpleado] = useState(null);
  const [filtroFecha,    setFiltroFecha]    = useState(hoy);
  const [filtroFechaPV,  setFiltroFechaPV]  = useState(hoy);
  const [opcsEmpleado,   setOpcsEmpleado]   = useState([]);

  useEffect(() => {
    if (!id_emisor) return;
    fetchData();
    fetchEmpleados();
  }, [id_emisor]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}trans/GET.php?id_emisor=${id_emisor}`
      );
      setData(res.data);
    } catch (error) {
      console.error("Error al obtener los datos:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmpleados = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}catalogos/us/GET.php`);
      const opciones = res.data
        .filter(item => item.id_emisor === id_emisor)
        .map(item => ({ label: item.username, value: item.id }));
      setOpcsEmpleado(opciones);
    } catch (error) {
      console.error("Error al obtener empleados:", error);
    }
  };

  const reloadData = async () => {
    if (!id_emisor) return;
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}trans/GET.php?id_emisor=${id_emisor}`
      );
      setData(res.data);
      onReloadOrdenes?.();
    } catch (error) {
      console.error("Error al recargar datos:", error);
    }
  };

  // ── Datos filtrados — tabla principal (todos) ─────────────────────────────
  const filteredData = useMemo(() => {
    return data.filter(item => {
      const passText = !globalFilter.trim() ||
        Object.values(item).some(v =>
          v !== null && v !== undefined &&
          v.toString().toLowerCase().includes(globalFilter.toLowerCase())
        );
      const passEmpleado = !filtroEmpleado || item.id_empleado_recibe === filtroEmpleado;
      const passFecha = (() => {
        if (!filtroFecha) return true;
        const f = new Date(item.fecha_emision);
        f.setHours(0, 0, 0, 0);
        return f.getTime() === filtroFecha.getTime();
      })();
      return passText && passEmpleado && passFecha;
    });
  }, [data, globalFilter, filtroEmpleado, filtroFecha]);

  // ── Datos filtrados — tabla PV (todos si es admin, si no solo del usuario logueado) ───────────────
  const filteredDataPV = useMemo(() => {
    return data.filter(item => {
      // Si es admin ve todo; si no, solo donde el empleado que recibe es el usuario actual
      const passUsuario = isAdmin || item.id_empleado_recibe === id_usuario;
      const passText = !globalFilterPV.trim() ||
        Object.values(item).some(v =>
          v !== null && v !== undefined &&
          v.toString().toLowerCase().includes(globalFilterPV.toLowerCase())
        );
      const passFecha = (() => {
        if (!filtroFechaPV) return true;
        const f = new Date(item.fecha_emision);
        f.setHours(0, 0, 0, 0);
        return f.getTime() === filtroFechaPV.getTime();
      })();
      return passUsuario && passText && passFecha;
    });
  }, [data, id_usuario, isAdmin, globalFilterPV, filtroFechaPV]);

  if (!accesoModulo) {
    return (
      <div className="p-4">
        
      </div>
    );
  }

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

  // ── Templates toolbar ─────────────────────────────────────────────────────
  const leftToolbar = () => (
    <div className="flex gap-2">
      {canAgregar && (
        <Button icon="pi pi-plus" label="Agregar"
          className="p-button-success" onClick={() => setShowAgregar(true)} />
      )}
    </div>
  );

  const rightToolbar = () => (
    <div className="flex flex-wrap gap-2 align-items-center">
      <span className="p-input-icon-left">
        <i className="pi pi-search" />
        <InputText value={globalFilter} onChange={e => setGlobalFilter(e.target.value)}
          placeholder="Buscar..." className="p-inputtext-sm" />
      </span>
      {globalFilter && (
        <Button icon="pi pi-times" className="p-button-text p-button-sm"
          tooltip="Limpiar búsqueda" tooltipOptions={{ position: "bottom" }}
          onClick={() => setGlobalFilter("")} />
      )}
      <Dropdown value={filtroEmpleado} options={opcsEmpleado}
        onChange={e => setFiltroEmpleado(e.value)}
        placeholder="Empleado recibe" className="p-inputtext-sm"
        style={{ minWidth: 180 }} showClear filter />
      <Calendar value={filtroFecha} onChange={e => setFiltroFecha(e.value)}
        dateFormat="dd/mm/yy" placeholder="Fecha" className="p-inputtext-sm"
        style={{ width: 130 }} showIcon showButtonBar />
    </div>
  );

  // Toolbar segunda tabla — solo búsqueda + fecha
  const rightToolbarPV = () => (
    <div className="flex flex-wrap gap-2 align-items-center">
      <span className="p-input-icon-left">
        <i className="pi pi-search" />
        <InputText value={globalFilterPV} onChange={e => setGlobalFilterPV(e.target.value)}
          placeholder="Buscar..." className="p-inputtext-sm" />
      </span>
      {globalFilterPV && (
        <Button icon="pi pi-times" className="p-button-text p-button-sm"
          onClick={() => setGlobalFilterPV("")} />
      )}
      <Calendar value={filtroFechaPV} onChange={e => setFiltroFechaPV(e.value)}
        dateFormat="dd/mm/yy" placeholder="Fecha" className="p-inputtext-sm"
        style={{ width: 130 }} showIcon showButtonBar />
    </div>
  );

  const actionBodyTemplate = (rowData) => (
    <div className="flex gap-2" onClick={e => e.stopPropagation()}>
      {canEliminar && (
        <Button icon="pi pi-times" rounded text severity="warning"
          onClick={() => { setSelectedCs(rowData); setShowEliminar(true); }} />
      )}
      {canConfigurar && (
        <Button icon="pi pi-cog" rounded text severity="warning"
          onClick={() => { setSelectedCs(rowData); setShowConfi(true); }} />
      )}
    </div>
  );

  return (
    <div className="p-4">

      {/* ── Tabla principal ───────────────────────────────────────────────── */}
      <Card title="Transferencias" className="shadow-3 mb-4">
        <Toolbar className="mb-4 p-3" left={leftToolbar} right={rightToolbar} />
        <div className="mb-3 text-sm text-500">
          {filteredData.length} de {data.length} items encontrados
          {globalFilter && <span className="ml-2">- Buscando: "<strong>{globalFilter}</strong>"</span>}
          {filtroFecha  && <span className="ml-2">· Fecha: <strong>{filtroFecha.toLocaleDateString("es-MX")}</strong></span>}
        </div>
        <DataTable value={filteredData} paginator rows={20}
          rowsPerPageOptions={[20, 40, 60]}
          responsiveLayout="scroll" scrollable scrollHeight="600px"
          emptyMessage={filtroEmpleado || filtroFecha || globalFilter
            ? "No hay transferencias con esos filtros" : "No hay datos disponibles"}
          className="p-datatable-sm" stripedRows showGridlines selectionMode="single"
        >
          <Column field="id"                  header="Id"           sortable />
          <Column field="descripcion_pedido"  header="Pedido"       sortable />
          <Column field="almacen"             header="Alm Destino"  sortable />
          <Column field="manda"               header="Emp Manda"    sortable />
          <Column field="recibe"              header="Emp Recibe"   sortable />
        </DataTable>
      </Card>

      {/* ── Tabla Punto de Venta — solo si tiene acceso al módulo ─────────── */}
      {accesoPV && (
        <Card title="Mis Transferencias" className="shadow-3">
          <Toolbar className="mb-4 p-3" right={rightToolbarPV} />
          <div className="mb-3 text-sm text-500">
            {filteredDataPV.length} transferencia{filteredDataPV.length !== 1 ? "s" : ""} encontrada{filteredDataPV.length !== 1 ? "s" : ""}
            {filtroFechaPV && <span className="ml-2">· Fecha: <strong>{filtroFechaPV.toLocaleDateString("es-MX")}</strong></span>}
          </div>
          <DataTable value={filteredDataPV} paginator rows={20}
            rowsPerPageOptions={[20, 40, 60]}
            responsiveLayout="scroll" scrollable scrollHeight="400px"
            emptyMessage="No tienes transferencias con esos filtros"
            className="p-datatable-sm" stripedRows showGridlines selectionMode="single"
          >
            <Column field="id"                 header="Id"          sortable />
            <Column field="descripcion_pedido" header="Pedido"      sortable />
            <Column field="almacen"            header="Alm Destino" sortable />
            <Column field="recibe"             header="Emp Recibe"  sortable />
            {(canEliminar || canConfigurar) && (
            <Column header="Acciones" body={actionBodyTemplate} />
          )}
          </DataTable>
        </Card>
      )}

      {/* ── Dialogs ───────────────────────────────────────────────────────── */}
      {canAgregar && (
        <Dialog header="Agregar" visible={showAgregar}
          onHide={() => setShowAgregar(false)}
          style={{ width: "95vw", maxWidth: "800px" }}
          breakpoints={{ "960px": "95vw", "640px": "100vw" }}
          modal className="p-fluid" draggable={false} resizable={false}
        >
          <Agregar
            onSuccess={() => { setShowAgregar(false); reloadData(); }}
            onCancel={() => setShowAgregar(false)}
          />
        </Dialog>
      )}

      {canEliminar && (
        <Dialog header="Eliminar" visible={showEliminar}
          onHide={() => setShowEliminar(false)}
          style={{ width: "95vw", maxWidth: "400px" }}
          breakpoints={{ "640px": "100vw" }}
          modal draggable={false} resizable={false}
        >
          {selectedCs && (
            <Eliminar
              Id={selectedCs.id}
              id_pedido={selectedCs.id_pedido}
              onSuccess={() => { setShowEliminar(false); reloadData(); }}
            />
          )}
        </Dialog>
      )}

      {canConfigurar && (
        <Dialog header="Estatus" visible={showConfi}
          onHide={() => setShowConfi(false)}
          style={{ width: "95vw", maxWidth: "400px" }}
          breakpoints={{ "640px": "100vw" }}
          modal draggable={false} resizable={false}
        >
          {selectedCs && (
            <EstatusCs Id={selectedCs.id}
              onSuccess={() => { setShowConfi(false); reloadData(); }}
            />
          )}
        </Dialog>
      )}

    </div>
  );
}

export default Tabla;