import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { InputNumber } from "primereact/inputnumber";
import { Toast } from "primereact/toast";
import { Card } from "primereact/card";
import { Dropdown } from "primereact/dropdown";
import { Dialog } from "primereact/dialog";
import { classNames } from "primereact/utils";
import axios from "axios";
import { useAuth } from '../../context/useAuth';
import { Calendar } from "primereact/calendar";
import { Checkbox } from "primereact/checkbox";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";
import AgregarConcepto from "../../catalogos/conceptos_movimientos/agregar";
import AgregarAlmacen from "../../catalogos/almacenes/agregar";

// Valores iniciales del formulario (sin id_emisor, se inyecta en useEffect)
const FORM_INICIAL = {
  fecha_doc:        new Date().toLocaleDateString("en-CA"),
  id_concepto_mvto: null,
  id_almacen:       null,
  id_prod_carta:        null,
  cantidad:         null,
  observaciones:    "",
  
};

const Productos_carta = forwardRef(function Productos_carta({ onAgregarItem, onCancel }, ref) {
  const { usuario } = useAuth();
  const id_emisor = usuario?.id_emisor || null;
  const id_usuario = usuario?.id_usuario || null
  const [formData, setFormData] = useState({ ...FORM_INICIAL, id_emisor, id_usuario });
  const [submitted, setSubmitted] = useState(false);

  // Catálogos
  const [conceptos,    setConceptos]    = useState([]);
  const [almacenes,    setAlmacenes]    = useState([]);
  const [productos_carta,      setProductos_carta]      = useState([]);
  const [loadingData,  setLoadingData]  = useState(false);
  const [dlgReporte, setDlgReporte] = useState(false);
  const [loadingReporte, setLoadingReporte] = useState(false);
  const [reporteParams, setReporteParams] = useState({
    fecha_inicio: new Date(),
    fecha_fin: new Date(),
    mostrar_concepto: false,
  });

  // Dialogs de alta rápida
  const [dlgConcepto,  setDlgConcepto]  = useState(false);
  const [dlgAlmacen,   setDlgAlmacen]   = useState(false);

  const toast = useRef(null);

  const API_CM  = `${import.meta.env.VITE_API_URL}catalogos/cm/GET.php?id_emisor=${id_emisor}`;
  const API_ALM = `${import.meta.env.VITE_API_URL}catalogos/alm/GET.php?id_emisor=${id_emisor}`;
  const API_INS = `${import.meta.env.VITE_API_URL}pc/GET.php?id_emisor=${id_emisor}`;

  useEffect(() => {
    if (id_emisor) setFormData(prev => ({ ...prev, id_emisor }));
  }, [id_emisor]);

  useEffect(() => {
    if (id_emisor) cargarCatalogos();
  }, [id_emisor]);

  const cargarCatalogos = async () => {
    setLoadingData(true);
    try {
      const [resCm, resAlm, resIns] = await Promise.all([
        axios.get(API_CM),
        axios.get(API_ALM),
        axios.get(API_INS),
      ]);
      setConceptos(
        (Array.isArray(resCm.data) ? resCm.data : resCm.data?.data || [])
          .filter(c => c.tipo == 1)
      );
      setAlmacenes(Array.isArray(resAlm.data) ? resAlm.data : resAlm.data?.data || []);
      setProductos_carta(Array.isArray(resIns.data)   ? resIns.data : resIns.data?.data  || []);
    } catch (error) {
      console.error("Error al cargar catálogos:", error);
      toast.current.show({ severity: "error", summary: "Error", detail: "Error al cargar los catálogos", life: 3000 });
    } finally {
      setLoadingData(false);
    }
  };

  useImperativeHandle(ref, () => ({
    recargarProductos_carta: async () => {
      try {
        const resIns = await axios.get(API_INS);
        setProductos_carta(Array.isArray(resIns.data) ? resIns.data : resIns.data?.data || []);
      } catch (error) {
        console.error("Error al recargar productos_carta:", error);
      }
    }
  }));

const formatFecha = (date) => date.toLocaleDateString("en-CA"); // yyyy-mm-dd

const formatFechaDisplay = (fechaStr) => {
  if (!fechaStr) return "";
  const [y, m, d] = fechaStr.split("-");
  return `${d}/${m}/${y}`;
};

const calcularCantidadReal = (cantidad, factorUnitario) => {
  const factor = Number(factorUnitario) || 1;
  if (factor === 0) return cantidad;
  return cantidad / factor;
};

const handleGenerarReporte = async (formato) => {
  const { fecha_inicio, fecha_fin, mostrar_concepto } = reporteParams;

  if (!fecha_inicio || !fecha_fin) {
    toast.current.show({
      severity: "warn",
      summary: "Validación",
      detail: "Seleccione el rango de fechas",
      life: 3000,
    });
    return;
  }

  setLoadingReporte(true);
  try {
    const API_REPORTE = `${import.meta.env.VITE_API_URL}etrance/GET_REPORTE.php?tipo=producto&fecha_inicio=${formatFecha(fecha_inicio)}&fecha_fin=${formatFecha(fecha_fin)}&mostrar_concepto=${mostrar_concepto}`;

    const res = await axios.get(API_REPORTE);
    const data = Array.isArray(res.data) ? res.data : res.data?.data || [];

    if (data.length === 0) {
      toast.current.show({
        severity: "info",
        summary: "Sin datos",
        detail: "No hay movimientos en el rango seleccionado",
        life: 3000,
      });
      return;
    }

    if (formato === "pdf") {
      exportarPDF(data, mostrar_concepto);
    } else {
      exportarExcel(data, mostrar_concepto);
    }

    setDlgReporte(false);
  } catch (error) {
    console.error("Error al generar el reporte:", error);
    toast.current.show({
      severity: "error",
      summary: "Error",
      detail: "No se pudo generar el reporte",
      life: 3000,
    });
  } finally {
    setLoadingReporte(false);
  }
};

const exportarPDF = (data, mostrarConcepto) => {
  const doc = new jsPDF({ orientation: "landscape" });
  const PAGE_BOTTOM = 190;
  const MARGIN_X = 14;
  const FONT_SIZE = 8;
  const LINE_HEIGHT = 3.8; // alto aprox. de cada línea de texto con FONT_SIZE 8
  const CELL_PADDING = 2;

  // ── Definición de columnas (clave del dato + ancho en mm) ──
  const columnas = [
    { key: "fecha", header: "Fecha", width: 22 },
    { key: "almacen", header: "Almacén", width: 32 },
  ];
  if (mostrarConcepto) {
    columnas.push({ key: "concepto_movimiento", header: "Concepto", width: 32 });
  }
  columnas.push(
    { key: "producto", header: "Producto", width: 70 },
    { key: "cantidad", header: "Cantidad", width: 20 },
    { key: "nombre_usuario", header: "Usuario", width: 30 },
    { key: "observaciones", header: "Observaciones", width: 45 }
  );

  // Posición X acumulada de cada columna
  let accX = MARGIN_X;
  const columnasConX = columnas.map((col) => {
    const x = accX;
    accX += col.width;
    return { ...col, x };
  });
  const totalWidth = accX - MARGIN_X;

  // Obtiene el valor "crudo" para una celda según su key
  const getValor = (item, key) => {
    if (key === "fecha") return formatFechaDisplay(item.fecha);
    if (key === "cantidad") {
      const cantidadReal = calcularCantidadReal(item.cantidad, item.factor_unitario);
      return Number.isFinite(cantidadReal) ? cantidadReal.toFixed(2) : String(item.cantidad ?? "");
    }
    return item[key] != null ? String(item[key]) : "";
  };

  doc.setFontSize(14);
  doc.text("Reporte de Entradas de Productos", MARGIN_X, 15);
  doc.setFontSize(10);
  doc.text(
    `Del ${reporteParams.fecha_inicio.toLocaleDateString("es-MX")} al ${reporteParams.fecha_fin.toLocaleDateString("es-MX")}`,
    MARGIN_X,
    21
  );

  doc.setFontSize(FONT_SIZE);

  let y = 28;

  const dibujarEncabezado = () => {
    doc.setFillColor(41, 128, 185);
    doc.setTextColor(255, 255, 255);
    doc.rect(MARGIN_X, y, totalWidth, 7, "F");
    columnasConX.forEach((col) => {
      doc.text(col.header, col.x + CELL_PADDING, y + 5);
    });
    doc.setTextColor(0, 0, 0);
    y += 7;
  };

  dibujarEncabezado();

  data.forEach((item, idxFila) => {
    // Partir el texto de cada celda según el ancho de su columna
    const celdas = columnasConX.map((col) => {
      const valor = getValor(item, col.key);
      const lineas = doc.splitTextToSize(valor, col.width - CELL_PADDING * 2);
      return { ...col, lineas };
    });

    // La altura de la fila depende de la celda con más líneas (ej. Producto largo)
    const maxLineas = Math.max(...celdas.map((c) => c.lineas.length), 1);
    const rowHeight = maxLineas * LINE_HEIGHT + 2;

    // Salto de página si no entra la fila completa
    if (y + rowHeight > PAGE_BOTTOM) {
      doc.addPage();
      y = 15;
      dibujarEncabezado();
    }

    if (idxFila % 2 === 0) {
      doc.setFillColor(245, 245, 245);
      doc.rect(MARGIN_X, y, totalWidth, rowHeight, "F");
    }

    celdas.forEach((celda) => {
      doc.text(celda.lineas, celda.x + CELL_PADDING, y + 4);
    });

    y += rowHeight;
  });

  doc.save(`reporte_entradas_producto_${formatFecha(new Date())}.pdf`);
};

const exportarExcel = (data, mostrarConcepto) => {
  const filas = data.map((item) => {
    const cantidadReal = calcularCantidadReal(item.cantidad, item.factor_unitario);
    const fila = {
      Fecha: formatFechaDisplay(item.fecha),
      Almacén: item.almacen || "",
    };
    if (mostrarConcepto) fila.Concepto = item.concepto_movimiento || "";
    fila.Producto = item.producto || "";
    fila.Cantidad = Number.isFinite(cantidadReal) ? Number(cantidadReal.toFixed(2)) : item.cantidad;
    fila.Usuario = item.nombre_usuario || "";
    fila.Observaciones = item.observaciones || "";
    return fila;
  });

  const ws = XLSX.utils.json_to_sheet(filas);

  // Anchos de columna para que Excel no se vea apretado (Producto/Observaciones más anchos)
  ws["!cols"] = [
    { wch: 12 }, // Fecha
    { wch: 18 }, // Almacén
    ...(mostrarConcepto ? [{ wch: 18 }] : []),
    { wch: 35 }, // Producto
    { wch: 10 }, // Cantidad
    { wch: 18 }, // Usuario
    { wch: 30 }, // Observaciones
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Reporte");
  XLSX.writeFile(wb, `reporte_entradas_producto_${formatFecha(new Date())}.xlsx`);
};

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDropdownChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

 const isFormValid = () => {
    const campos = {
      id_almacen:    formData.id_almacen,
      id_prod_carta: formData.id_prod_carta,
      cantidad:      formData.cantidad,
      id_emisor:     formData.id_emisor,
      id_usuario:    formData.id_usuario,
    };

    const faltantes = Object.entries(campos)
      .filter(([_, v]) => !v)
      .map(([k]) => k);

    if (faltantes.length > 0) {
      console.log("❌ Campos faltantes:", faltantes);
    } else {
    }

    return faltantes.length === 0;
  };

  const handleAgregar = () => {
    setSubmitted(true);

    if (!isFormValid()) {
      toast.current.show({
        severity: "warn",
        summary: "Validación",
        detail: "Por favor complete los campos requeridos",
        life: 3000,
      });
      return;
    }

    // Buscar los labels para mostrarlos en la tabla
    const almacenObj   = almacenes.find(a => a.id === formData.id_almacen);
    const insumoObj    = productos_carta.find(i => i.id === formData.id_prod_carta);
    const conceptoObj  = conceptos.find(c => c.id === formData.id_concepto_mvto);

    const item = {
      ...formData,
      almacen:        almacenObj?.descripcion   || "",
      insumo:         insumoObj?.producto    || "",
      concepto:       conceptoObj?.descripcion  || "",
      unidad_medida:  insumoObj?.unidad_medida  || "",
    };

    // Pasar el item al padre sin llamar al API
    if (onAgregarItem) onAgregarItem(item);

    // Limpiar campos para capturar el siguiente producto
    //setFormData({ ...FORM_INICIAL, id_emisor, id_usuario });
    setFormData(prev => ({
      ...prev,
      id_prod_carta: null,
      cantidad: null,
      existencia: 0,
    }));
    
    setSubmitted(false);

    return faltantes.length === 0;
  };

  if (!id_emisor) {
    return (
      <div className="p-fluid">
        <Card>
          <div className="flex justify-content-center align-items-center py-4">
            <div className="text-center">
              <i className="pi pi-spin pi-spinner" style={{ fontSize: "2rem" }} />
              <p className="mt-2">Cargando datos...</p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-fluid">
      <Toast ref={toast} />
      <Button
        label="Generar Reporte"
        icon="pi pi-file-export"
        className="p-button-help"
        onClick={() => setDlgReporte(true)}
        type="button"
      />
      <Card title="Entradas de Productos">
        <div className="grid">


          {/* ── Concepto de movimiento ── */}
          <div className="col-12 md:col-6">
            <div className="field">
              <label htmlFor="id_concepto_mvto" className="font-bold block">
                Concepto de movimiento <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <Dropdown
                  id="id_concepto_mvto"
                  value={formData.id_concepto_mvto}
                  options={conceptos}
                  optionLabel="descripcion"
                  optionValue="id"
                  onChange={(e) => handleDropdownChange("id_concepto_mvto", e.value)}
                  placeholder={loadingData ? "Cargando..." : "Seleccione un concepto"}
                  className={classNames("w-full", { "p-invalid": submitted && !formData.id_concepto_mvto })}
                  disabled={loadingData}
                  filter showClear
                />
                <Button icon="pi pi-plus" className="p-button-success p-button-outlined"
                  tooltip="Agregar concepto" tooltipOptions={{ position: "top" }}
                  onClick={() => setDlgConcepto(true)} type="button" />
              </div>
            </div>
          </div>

          {/* ── Almacén ── */}
          <div className="col-12 md:col-6">
            <div className="field">
              <label htmlFor="id_almacen" className="font-bold block">
                Almacén <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <Dropdown
                  id="id_almacen"
                  value={formData.id_almacen}
                  options={almacenes}
                  optionLabel="descripcion"
                  optionValue="id"
                  onChange={(e) => handleDropdownChange("id_almacen", e.value)}
                  placeholder={loadingData ? "Cargando..." : "Seleccione un almacén"}
                  className={classNames("w-full", { "p-invalid": submitted && !formData.id_almacen })}
                  disabled={loadingData}
                  filter showClear
                />
                <Button icon="pi pi-plus" className="p-button-success p-button-outlined"
                  tooltip="Agregar almacén" tooltipOptions={{ position: "top" }}
                  onClick={() => setDlgAlmacen(true)} type="button" />
              </div>
            </div>
          </div>

          {/* ── Insumo ── */}
          <div className="col-12 md:col-6">
            <div className="field">
              <label htmlFor="id_prod_carta" className="font-bold block">
                Producto <span className="text-red-500">*</span>
              </label>
              <Dropdown
                id="id_prod_carta"
                value={formData.id_prod_carta}
                options={productos_carta}
                optionLabel="producto"
                optionValue="id"
                onChange={(e) => {
                  const insumoSel = productos_carta.find(i => i.id === e.value);
                  setFormData(prev => ({
                    ...prev,
                    id_prod_carta:  e.value,
                    existencia: insumoSel?.existencia     ?? 0,
                    precio:        insumoSel?.precio     ?? 0,
                  }));
                }}
                placeholder={loadingData ? "Cargando..." : "Seleccione un producto"}
                className={classNames("w-full", { "p-invalid": submitted && !formData.id_prod_carta })}
                disabled={loadingData}
                filter showClear
              />
            </div>
          </div>

          {/* ── Cantidad ── */}
          <div className="col-12 md:col-6">
            <div className="field">
              <label htmlFor="cantidad" className="font-bold block">
                Cantidad <span className="text-red-500">*</span>
              </label>
              <InputNumber
                id="cantidad"
                value={formData.cantidad}
                onValueChange={(e) => handleDropdownChange("cantidad", e.value)}
                min={0}
                className={classNames("w-full", { "p-invalid": submitted && !formData.cantidad })}
              />
            </div>
          </div>

          {/* ── Observaciones ── */}
          <div className="col-12">
            <div className="field">
              <label htmlFor="observaciones" className="font-bold block">Observaciones</label>
              <InputTextarea id="observaciones" name="observaciones"
                value={formData.observaciones} onChange={handleChange}
                rows={3} className="w-full" placeholder="Opcional" />
            </div>
          </div>

        </div>

        {/* ── Botón agregar a la lista ── */}
        <div className="flex justify-content-end mt-4 gap-2">
          {onCancel && (
            <Button label="Cancelar" icon="pi pi-times" className="p-button-secondary"
              onClick={onCancel} type="button" />
          )}
          <Button
            label="Agregar a la lista"
            icon="pi pi-plus"
            className="p-button-success"
            onClick={handleAgregar}
            type="button"
          />
        </div>
      </Card>

      <Dialog header="Agregar Concepto de Movimiento" visible={dlgConcepto}
        style={{ width: "50vw" }} onHide={() => setDlgConcepto(false)}>
        <AgregarConcepto
          onSuccess={() => { setDlgConcepto(false); cargarCatalogos(); }}
          onCancel={() => setDlgConcepto(false)} />
      </Dialog>

      <Dialog header="Agregar Almacén" visible={dlgAlmacen}
        style={{ width: "50vw" }} onHide={() => setDlgAlmacen(false)}>
        <AgregarAlmacen
          onSuccess={() => { setDlgAlmacen(false); cargarCatalogos(); }}
          onCancel={() => setDlgAlmacen(false)} />
      </Dialog>

      <Dialog
        header="Generar Reporte de Entradas"
        visible={dlgReporte}
        style={{ width: "30vw" }}
        onHide={() => setDlgReporte(false)}
      >
        <div className="p-fluid">
          <div className="field">
            <label className="font-bold block">Fecha inicio</label>
            <Calendar
              value={reporteParams.fecha_inicio}
              onChange={(e) => setReporteParams((prev) => ({ ...prev, fecha_inicio: e.value }))}
              dateFormat="dd/mm/yy"
              showIcon
            />
          </div>
          <div className="field">
            <label className="font-bold block">Fecha fin</label>
            <Calendar
              value={reporteParams.fecha_fin}
              onChange={(e) => setReporteParams((prev) => ({ ...prev, fecha_fin: e.value }))}
              dateFormat="dd/mm/yy"
              showIcon
            />
          </div>
          <div className="field-checkbox flex align-items-center gap-2">
            <Checkbox
              inputId="mostrar_concepto"
              checked={reporteParams.mostrar_concepto}
              onChange={(e) => setReporteParams((prev) => ({ ...prev, mostrar_concepto: e.checked }))}
            />
            <label htmlFor="mostrar_concepto">Mostrar concepto de movimiento</label>
          </div>
        </div>

        <div className="flex justify-content-end gap-2 mt-4">
          <Button label="Cancelar" className="p-button-secondary" onClick={() => setDlgReporte(false)} type="button" />
          <Button
            label="Exportar PDF"
            icon="pi pi-file-pdf"
            className="p-button-danger"
            loading={loadingReporte}
            onClick={() => handleGenerarReporte("pdf")}
            type="button"
          />
          <Button
            label="Exportar Excel"
            icon="pi pi-file-excel"
            className="p-button-success"
            loading={loadingReporte}
            onClick={() => handleGenerarReporte("excel")}
            type="button"
          />
        </div>
      </Dialog>

    </div>
  );
});

export default Productos_carta;

