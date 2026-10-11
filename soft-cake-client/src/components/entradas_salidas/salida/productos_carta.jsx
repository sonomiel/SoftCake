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

  // Dialogs de alta rápida
  const [dlgConcepto,  setDlgConcepto]  = useState(false);
  const [dlgAlmacen,   setDlgAlmacen]   = useState(false);

  const toast = useRef(null);

  const API_CM  = `${import.meta.env.VITE_API_URL}catalogos/cm/GET.php?id_emisor=${id_emisor}`;
  const API_ALM = `${import.meta.env.VITE_API_URL}catalogos/alm/GET.php?id_emisor=${id_emisor}`;
  //const API_INS = `${import.meta.env.VITE_API_URL}output/GET_PROD.php?id_almacen=${id_almacen}`;

  useEffect(() => {
    if (id_emisor) setFormData(prev => ({ ...prev, id_emisor }));
  }, [id_emisor]);

  useEffect(() => {
    if (id_emisor) cargarCatalogos();
  }, [id_emisor]);

  const cargarCatalogos = async () => {
    setLoadingData(true);
    try {
      const [resCm, resAlm] = await Promise.all([
        axios.get(API_CM),
        axios.get(API_ALM),
        //axios.get(API_INS),
      ]);
      setConceptos(
        (Array.isArray(resCm.data) ? resCm.data : resCm.data?.data || [])
          .filter(c => c.tipo == 2)
      );
      setAlmacenes(Array.isArray(resAlm.data) ? resAlm.data : resAlm.data?.data || []);
    } catch (error) {
      console.error("Error al cargar catálogos:", error);
      toast.current.show({ severity: "error", summary: "Error", detail: "Error al cargar los catálogos", life: 3000 });
    } finally {
      setLoadingData(false);
    }
  };

 useEffect(() => {
  if (!formData.id_almacen || !id_emisor) return;

  const cargarInsumos = async () => {
    try {
      const res = await axios.get(
      `${import.meta.env.VITE_API_URL}output/GET_PROD.php?id_almacen=${formData.id_almacen}&id_emisor=${id_emisor}`
      );
      setProductos_carta(Array.isArray(res.data) ? res.data : res.data?.data || []);
    } catch (error) {
      toast.current?.show({ severity: "error", summary: "Error", detail: "Error al cargar insumos", life: 3000 });
    }
  };
  cargarInsumos();
}, [formData.id_almacen]); 

  useImperativeHandle(ref, () => ({
    recargarProductos_carta: async () => {
      if (!formData.id_almacen) return;
      try {
      const res = await axios.get(
      `${import.meta.env.VITE_API_URL}output/GET_PROD.php?id_almacen=${formData.id_almacen}&id_emisor=${id_emisor}`
      );
      setProductos_carta(Array.isArray(res.data) ? res.data : res.data?.data || []);
      } catch (error) {
        console.error("Error al recargar productos_carta:", error);
      }
    }
  }));

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDropdownChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const isFormValid = () =>
    formData.id_concepto_mvto &&
    formData.id_almacen &&
    formData.id_prod_carta &&
    formData.cantidad &&
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
    setFormData(prev => ({
      ...prev,
      id_prod_carta: null,
      cantidad: null,
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

      <Card title="Salidas de Productos">
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
                  onChange={(e) => {
                    handleDropdownChange("id_almacen", e.value);
                    // Limpiar producto al cambiar almacén
                    setFormData(prev => ({
                      ...prev,
                      id_almacen:   e.value,
                      id_prod_carta: null,  
                      existencia:   0
                    }));
                  }}
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
                  }));
                }}
                placeholder={loadingData ? "Cargando..." : "Seleccione un insumo"}
                className={classNames("w-full", { "p-invalid": submitted && !formData.id_prod_carta })}
                  disabled={loadingData || !formData.id_almacen}  
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

    </div>
  );
});

export default Productos_carta;

