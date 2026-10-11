import React, { useEffect, useState } from "react";
import axios from "axios";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { useAuth } from '../../context/useAuth';
import { Tag } from "primereact/tag";

function Tabla({ onSelect, refreshKey }) {
    const { usuario } = useAuth();
    const id_usuario = usuario?.id || "";

    const [data, setData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [globalFilter, setGlobalFilter] = useState("");
    const [loading, setLoading] = useState(false);

    const fetchData = async () => {
        if (!id_usuario) return;
        setLoading(true);
        try {
            const API_URL = `${import.meta.env.VITE_API_URL}cie/GET.php?id_usuario=${id_usuario}`;
            const response = await axios.get(API_URL);
            setData(response.data);
            setFilteredData(response.data);
        } catch (error) {
            console.error("Error al obtener los datos:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [id_usuario, refreshKey]);

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

    // ✅ Template para mostrar el estatus con Tag
    const statusBodyTemplate = (rowData) => {
        const hasFechaCierre = rowData.fecha_cierre !== null && rowData.fecha_cierre !== "";
        return (
            <Tag 
                value={hasFechaCierre ? "Cerrado" : "Abierto"}
                severity={hasFechaCierre ? "danger" : "success"}
                icon={hasFechaCierre ? "pi pi-lock" : "pi pi-unlock"}
                rounded
            />
        );
    };

    // ✅ Template para la fecha de cierre con formato
    const fechaCierreBodyTemplate = (rowData) => {
        if (!rowData.fecha_cierre) {
            return <span className="text-500">—</span>;
        }
        const date = new Date(rowData.fecha_cierre);
        return date.toLocaleDateString("es-MX", {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

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

    if (loading) return (
        <div className="p-4">
            <div className="flex justify-content-center align-items-center p-5">
                <i className="pi pi-spin pi-spinner text-4xl mr-2"></i>
                <span>Cargando datos...</span>
            </div>
        </div>
    );

    return (
        <div className="p-fluid">
            <div className="mb-2">
                {rightToolbarTemplate()}
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
                onRowClick={(e) => {
                    // ✅ Pasar la fila completa incluyendo fecha_cierre
                    if (onSelect) onSelect(e.data);
                }}
                selectionMode="single"
                rowClassName={(rowData) => {
                    // Resaltar filas cerradas
                    return rowData.fecha_cierre ? "row-cerrado" : "";
                }}
            >
                <Column field="id" header="Id" sortable style={{ width: '60px' }} />
                <Column field="fecha_apertura" header="F. Apertura" sortable 
                    body={(rowData) => {
                        const date = new Date(rowData.fecha_apertura);
                        return date.toLocaleDateString("es-MX", {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        });
                    }}
                />
                <Column field="fecha_cierre" header="F. Cierre" sortable 
                    body={fechaCierreBodyTemplate}
                />
                <Column header="Estatus" body={statusBodyTemplate} style={{ width: '100px' }} />
            </DataTable>
        </div>
    );
}

export default Tabla;