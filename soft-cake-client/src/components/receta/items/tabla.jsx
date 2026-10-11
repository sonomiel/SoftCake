import React, { useEffect, useState } from "react";
import axios from "axios";
import { DataView } from "primereact/dataview";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Toolbar } from "primereact/toolbar";
import { InputText } from "primereact/inputtext";
import { Tag } from "primereact/tag";
import { useAuth } from '../../context/useAuth';

import Agregar from "./agregar";
import Editar from "./editar";
import Eliminar from "./eliminar";

function Tabla({ clave }) {
  const { usuario } = useAuth();
  const id_emisor = usuario?.id_emisor || "";

  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [selectedCs, setSelectedCs] = useState(null);

  const [showAgregar, setShowAgregar] = useState(false);
  const [showEditar, setShowEditar] = useState(false);
  const [showEliminar, setShowEliminar] = useState(false);

  const [globalFilter, setGlobalFilter] = useState("");
  const [loading, setLoading] = useState(false);

  // ── Fetch ──
  useEffect(() => {
    if (!id_emisor || !clave) return;
    fetchData();
  }, [id_emisor, clave]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const API_URL = `${import.meta.env.VITE_API_URL}rcp/items/GET.php?clave=${clave}`;
      const response = await axios.get(API_URL);
      setData(response.data);
      setFilteredData(response.data);
    } catch (error) {
      console.error("Error al obtener los datos:", error);
    } finally {
      setLoading(false);
    }
  };

  const reloadData = () => fetchData();

  // ── Filtro local ──
  useEffect(() => {
    if (!globalFilter.trim()) {
      setFilteredData(data);
      return;
    }
    const filterValue = globalFilter.toLowerCase();
    setFilteredData(
      data.filter(item =>
        Object.values(item).some(value =>
          value !== null &&
          value !== undefined &&
          value.toString().toLowerCase().includes(filterValue)
        )
      )
    );
  }, [globalFilter, data]);

  // ── Toolbar ──
  const leftToolbarTemplate = () => (
    <Button
      icon="pi pi-plus"
      label="Agregar"
      className="p-button-success"
      onClick={() => setShowAgregar(true)}
    />
  );

  const rightToolbarTemplate = () => (
    <div className="flex gap-2 align-items-center">
      <div className="p-inputgroup">
        <span className="p-inputgroup-addon">
          <i className="pi pi-search" />
        </span>
        <InputText
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder="Buscar..."
        />
        {globalFilter && (
          <Button
            icon="pi pi-times"
            className="p-button-text p-button-sm"
            onClick={() => setGlobalFilter("")}
            tooltip="Limpiar"
          />
        )}
      </div>
    </div>
  );

  // ── Item template del DataView ──
const itemTemplate = (item) => {
  return (
    <div className="col-12">
      <div
        className="flex align-items-center justify-content-between p-3 border-bottom-1 surface-border"
        style={{ gap: "1rem" }}
      >
        {/* Ícono */}
        <div
          className="flex align-items-center justify-content-center border-round"
          style={{
            width: "42px",
            height: "42px",
            minWidth: "42px",
            background: "rgba(196,130,60,0.12)",
          }}
        >
          <i className="pi pi-box" style={{ color: "var(--color-primary, #c4823c)", fontSize: "1.2rem" }} />
        </div>

        {/* Info principal */}
        <div className="flex flex-column gap-1 flex-1">
          <span className="font-bold" style={{ fontSize: "0.9rem" }}>
            {item.insumo_o_subreceta}
          </span>
          <div className="flex align-items-center gap-3">
            <span className="text-500 text-xs">Cantidad: {item.cantidad}</span>
            <span className="text-500 text-xs">UM: {item.unidad_medida}</span>
            <span className="text-500 text-xs">Almacen: {item.almacen}</span>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex gap-1">
          <Button
            icon="pi pi-pencil"
            rounded text severity="info"
            tooltip="Editar"
            tooltipOptions={{ position: "top" }}
            onClick={() => { setSelectedCs(item); setShowEditar(true); }}
          />
          <Button
            icon="pi pi-trash"
            rounded text severity="danger"
            tooltip="Eliminar"
            tooltipOptions={{ position: "top" }}
            onClick={() => { setSelectedCs(item); setShowEliminar(true); }}
          />
        </div>
      </div>
    </div>
  );
};
  return (
    <div className="p-fluid">

      <Toolbar
        className="mb-3"
        left={leftToolbarTemplate}
        right={rightToolbarTemplate}
      />

      {/* Contador */}
      <div className="mb-2 text-sm text-500">
        {filteredData.length} de {data.length} items
        {globalFilter && <span className="ml-2">— Buscando: <strong>{globalFilter}</strong></span>}
      </div>

      <DataView
        value={filteredData}
        itemTemplate={itemTemplate}
        paginator
        rows={10}
        rowsPerPageOptions={[10, 20, 30]}
        loading={loading}
        emptyMessage={loading ? "Cargando..." : "No hay items para esta receta"}
        className="dataview-items"
      />

      {/* Modales */}
      <Dialog
        header="Agregar Item"
        visible={showAgregar}
        onHide={() => setShowAgregar(false)}
        style={{ width: "800px" }}
        modal
        draggable={false}
        resizable={false}
      >
        <Agregar
          clave={clave}
          onSuccess={() => { setShowAgregar(false); reloadData(); }}
          onCancel={() => setShowAgregar(false)}
        />
      </Dialog>

      <Dialog
        header="Editar Item"
        visible={showEditar}
        onHide={() => setShowEditar(false)}
        style={{ width: "800px" }}
        modal
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

      <Dialog
        header="Eliminar Item"
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

    </div>
  );
}

export default Tabla;
