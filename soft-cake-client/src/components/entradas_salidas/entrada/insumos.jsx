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
import AgregarProveedor from "../../catalogos/proveedores/agregar";
import AgregarConcepto from "../../catalogos/conceptos_movimientos/agregar";
import AgregarAlmacen from "../../catalogos/almacenes/agregar";

// Valores iniciales del formulario (sin id_emisor, se inyecta en useEffect)
const FORM_INICIAL = {
  fecha_doc:        new Date().toLocaleDateString("en-CA"),
  id_proveedor:     null,
  id_concepto_mvto: null,
  referencia:       "",
  id_almacen:       null,
  id_ins_gral:        null,
  cantidad:         null,
  precio:           null,
  observaciones:    "",
  
};

const Insumo = forwardRef(function Insumo({ onAgregarItem, onCancel }, ref) {
  const { usuario } = useAuth();
  const id_emisor = usuario?.id_emisor || null;
  const id_usuario = usuario?.id || null
  const [formData, setFormData] = useState({ ...FORM_INICIAL, id_emisor, id_usuario });
  const [submitted, setSubmitted] = useState(false);

  // Catálogos
  const [proveedores,  setProveedores]  = useState([]);
  const [conceptos,    setConceptos]    = useState([]);
  const [almacenes,    setAlmacenes]    = useState([]);
  const [insumos,      setInsumos]      = useState([]);
  const [loadingData,  setLoadingData]  = useState(false);

  // Dialogs de alta rápida
  const [dlgProveedor, setDlgProveedor] = useState(false);
  const [dlgConcepto,  setDlgConcepto]  = useState(false);
  const [dlgAlmacen,   setDlgAlmacen]   = useState(false);
  const [dlgReporte, setDlgReporte] = useState(false);
  const [loadingReporte, setLoadingReporte] = useState(false);
  const [reporteParams, setReporteParams] = useState({
    fecha_inicio: new Date(),
    fecha_fin: new Date(),
    mostrar_concepto: false,
  });

  const toast = useRef(null);

  const API_PR  = `${import.meta.env.VITE_API_URL}catalogos/pr/GET.php?id_emisor=${id_emisor}`;
  const API_CM  = `${import.meta.env.VITE_API_URL}catalogos/cm/GET.php?id_emisor=${id_emisor}`;
  const API_ALM = `${import.meta.env.VITE_API_URL}catalogos/alm/GET.php?id_emisor=${id_emisor}`;
  const API_INS = `${import.meta.env.VITE_API_URL}ins_gral/GET.php?id_emisor=${id_emisor}`;

  useEffect(() => {
    if (id_emisor) setFormData(prev => ({ ...prev, id_emisor }));
  }, [id_emisor]);

  useEffect(() => {
    if (id_emisor) cargarCatalogos();
  }, [id_emisor]);

  const cargarCatalogos = async () => {
    setLoadingData(true);
    try {
      const [resPr, resCm, resAlm, resIns] = await Promise.all([
        axios.get(API_PR),
        axios.get(API_CM),
        axios.get(API_ALM),
        axios.get(API_INS),
      ]);
      setProveedores(Array.isArray(resPr.data)  ? resPr.data  : resPr.data?.data  || []);
      setConceptos(
        (Array.isArray(resCm.data) ? resCm.data : resCm.data?.data || [])
          .filter(c => c.tipo == 1)
      );
      setAlmacenes(Array.isArray(resAlm.data) ? resAlm.data : resAlm.data?.data || []);
      setInsumos(Array.isArray(resIns.data)   ? resIns.data : resIns.data?.data  || []);
    } catch (error) {
      console.error("Error al cargar catálogos:", error);
      toast.current.show({ severity: "error", summary: "Error", detail: "Error al cargar los catálogos", life: 3000 });
    } finally {
      setLoadingData(false);
    }
  };

  useImperativeHandle(ref, () => ({
    recargarInsumos: async () => {
      try {
        const resIns = await axios.get(API_INS);
        setInsumos(Array.isArray(resIns.data) ? resIns.data : resIns.data?.data || []);
      } catch (error) {
        console.error("Error al recargar insumos:", error);
      }
    }
  }));

  const formatFecha = (date) => date.toLocaleDateString("en-CA"); // yyyy-mm-dd

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
      const API_REPORTE = `${import.meta.env.VITE_API_URL}/etrance/GET_REPORTE.php?tipo=insumo&fecha_inicio=${formatFecha(fecha_inicio)}&fecha_fin=${formatFecha(fecha_fin)}&mostrar_concepto=${mostrar_concepto}`;

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

    const columnas = ["Fecha", "Almacén", "Producto", "Cantidad", "Unidad"];
    if (mostrarConcepto) columnas.push("Concepto");

    const filas = data.map((item) => {
      const fila = [
        item.fecha || "",
        item.almacen || "",
        item.producto || item.insumo || "",
        item.cantidad ?? "",
        item.unidad_medida || "",
      ];
      if (mostrarConcepto) fila.push(item.concepto || "");
      return fila;
    });

    doc.setFontSize(14);
    doc.text("Reporte de Entradas de Productos", 14, 15);
    doc.setFontSize(10);
    doc.text(
      `Del ${reporteParams.fecha_inicio.toLocaleDateString("es-MX")} al ${reporteParams.fecha_fin.toLocaleDateString("es-MX")}`,
      14,
      21
    );

    const colWidth = 270 / columnas.length;
    let y = 28;

    // Encabezado
    doc.setFillColor(41, 128, 185);
    doc.setTextColor(255, 255, 255);
    doc.rect(14, y, colWidth * columnas.length, 7, "F");
    columnas.forEach((col, i) => {
      doc.text(String(col), 14 + i * colWidth + 2, y + 5);
    });

    // Filas
    doc.setTextColor(0, 0, 0);
    y += 7;
    filas.forEach((fila, idxFila) => {
      if (y > 190) {
        doc.addPage();
        y = 15;
      }
      if (idxFila % 2 === 0) {
        doc.setFillColor(245, 245, 245);
        doc.rect(14, y, colWidth * columnas.length, 6, "F");
      }
      fila.forEach((celda, i) => {
        doc.text(String(celda), 14 + i * colWidth + 2, y + 4);
      });
      y += 6;
    });

    doc.save(`reporte_entradas_${formatFecha(new Date())}.pdf`);
  };

  const exportarExcel = (data, mostrarConcepto) => {
    const filas = data.map((item) => {
      const fila = {
        Fecha: item.fecha_doc || "",
        Almacén: item.almacen || "",
        Producto: item.producto || item.insumo || "",
        Cantidad: item.cantidad ?? "",
        Unidad: item.unidad_medida || "",
      };
      if (mostrarConcepto) fila.Concepto = item.concepto || "";
      return fila;
    });

    const ws = XLSX.utils.json_to_sheet(filas);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Reporte");
    XLSX.writeFile(wb, `reporte_entradas_${formatFecha(new Date())}.xlsx`);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDropdownChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const isFormValid = () =>
    formData.id_proveedor &&
    formData.id_concepto_mvto &&
    formData.id_almacen &&
    formData.id_ins_gral &&
    formData.cantidad &&
    formData.precio &&
    formData.id_emisor &&
    formData.id_usuario;

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
    const proveedorObj = proveedores.find(p => p.id === formData.id_proveedor);
    const almacenObj   = almacenes.find(a => a.id === formData.id_almacen);
    const insumoObj    = insumos.find(i => i.id === formData.id_ins_gral);
    const conceptoObj  = conceptos.find(c => c.id === formData.id_concepto_mvto);

    const item = {
      ...formData,
      proveedor:      proveedorObj?.nombre      || "",
      almacen:        almacenObj?.descripcion   || "",
      insumo:         insumoObj?.descripcion    || "",
      concepto:       conceptoObj?.descripcion  || "",
      unidad_medida:  insumoObj?.unidad_medida  || "",
    };

    // Pasar el item al padre sin llamar al API
    if (onAgregarItem) onAgregarItem(item);

    // Limpiar campos para capturar el siguiente producto
    //setFormData({ ...FORM_INICIAL, id_emisor, id_usuario });
    setFormData(prev => ({
      ...prev,
      id_ins_gral: null,
      cantidad: null,
      precio: null,
      existencia: 0,
    }));
    setSubmitted(false);

    toast.current.show({
      severity: "success",
      summary: "Agregado",
      detail: "Producto agregado a la lista ✅",
      life: 2000,
    });
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
      <Card title="Entradas de insumos">
        <div className="grid">

          {/* ── Proveedor ── */}
          <div className="col-12 md:col-6">
            <div className="field">
              <label htmlFor="id_proveedor" className="font-bold block">
                Proveedor <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <Dropdown
                  id="id_proveedor"
                  value={formData.id_proveedor}
                  options={proveedores}
                  optionLabel="nombre"
                  optionValue="id"
                  onChange={(e) => handleDropdownChange("id_proveedor", e.value)}
                  placeholder={loadingData ? "Cargando..." : "Seleccione un proveedor"}
                  className={classNames("w-full", { "p-invalid": submitted && !formData.id_proveedor })}
                  disabled={loadingData}
                  filter showClear
                />
                <Button icon="pi pi-plus" className="p-button-success p-button-outlined"
                  tooltip="Agregar proveedor" tooltipOptions={{ position: "top" }}
                  onClick={() => setDlgProveedor(true)} type="button" />
              </div>
            </div>
          </div>

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

          {/* ── Referencia ── */}
          <div className="col-12 md:col-6">
            <div className="field">
              <label htmlFor="referencia" className="font-bold block">Referencia</label>
              <InputText id="referencia" name="referencia" value={formData.referencia}
                onChange={handleChange} className="w-full" placeholder="Opcional" />
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
              <label htmlFor="id_ins_gral" className="font-bold block">
                Insumo <span className="text-red-500">*</span>
              </label>
              <Dropdown
                id="id_ins_gral"
                value={formData.id_ins_gral}
                options={insumos}
                optionLabel="descripcion"
                optionValue="id"
                onChange={(e) => {
                  const insumoSel = insumos.find(i => i.id === e.value);
                  setFormData(prev => ({
                    ...prev,
                    id_ins_gral:    e.value,
                    precio:         insumoSel?.costo_estandar ?? prev.precio,
                    costo_estandar: insumoSel?.costo_estandar ?? null,
                    existencia:     insumoSel?.existencia     ?? 0,
                  }));
                }}
                placeholder={loadingData ? "Cargando..." : "Seleccione un insumo"}
                className={classNames("w-full", { "p-invalid": submitted && !formData.id_ins_gral })}
                disabled={loadingData}
                filter showClear
              />
            </div>
          </div>

          {/* ── Cantidad ── */}
          <div className="col-12 md:col-3">
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

          {/* ── Precio ── */}
          <div className="col-12 md:col-3">
            <div className="field">
              <label htmlFor="precio" className="font-bold block">
                Precio <span className="text-red-500">*</span>
              </label>
              <InputNumber
                id="precio"
                value={formData.precio}
                onValueChange={(e) => handleDropdownChange("precio", e.value)}
                mode="currency"
                currency="MXN"
                locale="es-MX"
                min={0}
                className={classNames("w-full", {
                  "p-invalid": submitted && !formData.precio,
                })}
                inputStyle={
                  formData.costo_estandar != null &&
                  formData.precio > formData.costo_estandar
                    ? { borderColor: "#e53935", boxShadow: "0 0 0 1px #e53935", color: "#e53935" }
                    : {}
                }
              />
              {formData.costo_estandar != null &&
                formData.precio > formData.costo_estandar && (
                  <small className="text-red-500">
                    ⚠ El precio supera el costo estándar (
                    {formData.costo_estandar.toLocaleString("es-MX", {
                      style: "currency",
                      currency: "MXN",
                    })}
                    )
                  </small>
              )}
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

      {/* ── Dialogs alta rápida ── */}
      <Dialog header="Agregar Proveedor" visible={dlgProveedor}
        style={{ width: "50vw" }} onHide={() => setDlgProveedor(false)}>
        <AgregarProveedor
          onSuccess={() => { setDlgProveedor(false); cargarCatalogos(); }}
          onCancel={() => setDlgProveedor(false)} />
      </Dialog>

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

export default Insumo;

