import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { useAuth } from '../context/useAuth';

// Librerías de exportación — instalar con:
// npm install xlsx jspdf jspdf-autotable
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function Tabla({ inventario, seleccion, id_emisor  }) {
  const { usuario } = useAuth();
  const dt = useRef(null);

  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [loading, setLoading] = useState(false);

  // Columnas según tipo de inventario
  const columnas = inventario === "1"
    ? [
        { field: "id",              header: "ID" },
        { field: "almacen",         header: "Almacén" },
        { field: "descripcion",     header: "Insumo" },
        { field: "cantidad", header: "Existencia" },
      ]
    : [
        { field: "clave_rcp",        header: "ID" },
        { field: "almacen",          header: "Almacén" },
        { field: "receta",           header: "Producto" },
        { field: "piezas_completas", header: "Completo" },
        { field: "sobrante",         header: "Individual" },
      ];

  const titulo = inventario === "1" ? "Inventario de Insumos" : "Inventario de Carta";

  // ── Fetch ──
  useEffect(() => {
      if (!id_emisor || !inventario || !seleccion) return;

      const fetchData = async () => {
        setLoading(true);
        setData([]);           // limpiar datos anteriores
        setFilteredData([]);
        try {
          const API_URL = `${import.meta.env.VITE_API_URL}inv/GET.php?inv=${inventario}&sel=${seleccion}&id_emisor=${id_emisor}`;
          const response = await axios.get(API_URL);
          setData(response.data);
          setFilteredData(response.data);
          setGlobalFilter("");
        } catch (error) {
          console.error("Error al obtener los datos:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    }, [id_emisor, inventario, seleccion]);  // ← id_emisor en dependencias ya estaba, pero verifica esto

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

  // ── Exportar Excel ──
  const exportExcel = () => {
    const exportData = filteredData.map(row =>
      columnas.reduce((acc, col) => {
        acc[col.header] = row[col.field] ?? "";
        return acc;
      }, {})
    );
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inventario");

    // Ajustar ancho de columnas automáticamente
    const colWidths = columnas.map(col => ({
      wch: Math.max(col.header.length, 15)
    }));
    ws["!cols"] = colWidths;

    XLSX.writeFile(wb, `${titulo}.xlsx`);
  };

  // ── Exportar PDF ──
  const exportPDF = () => {
    const doc = new jsPDF({ orientation: "landscape" });

    doc.setFontSize(14);
    doc.text(titulo, 14, 15);
    doc.setFontSize(10);
    doc.text(`Generado: ${new Date().toLocaleDateString("es-MX")}`, 14, 22);

    autoTable(doc, {
      startY: 28,
      head: [columnas.map(col => col.header)],
      body: filteredData.map(row =>
        columnas.map(col => row[col.field] ?? "")
      ),
      styles: {
        fontSize: 9,
        cellPadding: 4,
      },
      headStyles: {
        fillColor: [44, 26, 14],   // color oscuro del tema
        textColor: [245, 230, 208],
        fontStyle: "bold",
      },
      alternateRowStyles: {
        fillColor: [253, 246, 238],
      },
    });

    doc.save(`${titulo}.pdf`);
  };

  // ── Toolbar derecho ──
  const rightToolbar = (
    <div className="flex gap-2 align-items-center">
      {/* Buscador */}
      <div className="p-inputgroup">
        <span className="p-inputgroup-addon">
          <i className="pi pi-search" />
        </span>
        <InputText
          placeholder="Buscar..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
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

      {/* Botón Excel */}
      <Button
        icon="pi pi-file-excel"
        label="Excel"
        className="p-button-success p-button-outlined"
        onClick={exportExcel}
        disabled={filteredData.length === 0}
        tooltip="Exportar a Excel"
        tooltipOptions={{ position: "top" }}
      />

      {/* Botón PDF */}
      <Button
        icon="pi pi-file-pdf"
        label="PDF"
        className="p-button-danger p-button-outlined"
        onClick={exportPDF}
        disabled={filteredData.length === 0}
        tooltip="Exportar a PDF"
        tooltipOptions={{ position: "top" }}
      />
    </div>
  );

  return (
    <div className="p-4">
      <Card title={titulo} className="shadow-3">

        {/* Toolbar */}
        <div className="flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
          <span className="text-sm text-500">
            {filteredData.length} de {data.length} registros
            {globalFilter && <span className="ml-2">— Buscando: <strong>{globalFilter}</strong></span>}
          </span>
          {rightToolbar}
        </div>

        <DataTable
          ref={dt}
          value={filteredData}
          paginator
          rows={20}
          rowsPerPageOptions={[20, 40, 60]}
          loading={loading}
          responsiveLayout="scroll"
          scrollable
          scrollHeight="500px"
          emptyMessage={loading ? "Cargando..." : "No hay datos disponibles"}
          className="p-datatable-sm"
          stripedRows
          showGridlines
        >
         {columnas.map(col => (
          <Column
            key={col.field}
            field={col.field}
            header={col.header}
            sortable
            headerStyle={col.field === "cantidad" ? { textAlign: "center" } : undefined}
            bodyStyle={col.field === "cantidad" ? { textAlign: "center" } : undefined}
            body={col.field === "cantidad"
              ? (rowData) => Number(rowData.cantidad ?? 0).toFixed(3)
              : undefined
            }
          />
        ))}
        </DataTable>

      </Card>
    </div>
  );
}

export default Tabla;
