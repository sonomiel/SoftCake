import React, { useState, useRef, useEffect } from "react";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";
import { Card } from "primereact/card";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
import { classNames } from "primereact/utils";
import { useAuth } from '../context/useAuth';
import { InputTextarea } from "primereact/inputtextarea";
import { MultiSelect } from 'primereact/multiselect';
import axios from "axios";


function Editar({ cs, onSuccess, onCancel }) {
  const { usuario } = useAuth();
  const id_emisor = usuario?.id_emisor || null;

  const [formData, setFormData]     = useState({ ...cs });

  const [loading, setLoading]       = useState(false);
  const [submitted, setSubmitted]   = useState(false);
  const [loadingData, setLoadingData] = useState(false);

  const [productos, setProductos] = useState([]);
  const [insumos, setInsumos] = useState([]);

  const toast = useRef(null);

  const opcInv = [
    { label: 'Receta',    value: 1 },
    { label: 'Subreceta',    value: 2 },
  ];

  const API_URL = `${import.meta.env.VITE_API_URL}rcp/UPDATE.php`;

  useEffect(() => {
    if (cs) {
      setFormData({ ...cs, id_emisor });
      setSubmitted(false);
    }
  }, [cs, id_emisor]);

  useEffect(() => {
    if (id_emisor) fetchProductos();
  }, [id_emisor]);

  const fetchProductos = async () => {

    try {
    setLoading(true);

      const [resPro, resIns] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}pc/GET.php?id_emisor=${id_emisor}`),
        axios.get(`${import.meta.env.VITE_API_URL}ins_gral/GET.php?id_emisor=${id_emisor}`),
      ]);

      setProductos(
        resPro.data
          ?.map(item => ({ label: item.producto, value: item.id})) ?? []
      );

      setInsumos(
        resIns.data
        ?.map(item => ({ label: item.descripcion, value: item.id}))
      );

    } catch (err) {
      console.error("Error al cargar catalogos: ", err);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudieron cargar los catalogos",
        life: 3000
      });
    } finally {
      setLoading(false);
    }

  };


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNumberChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDropdownChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const isFormValid = () => {
    return formData.id_tipo_prod && formData.clave?.trim();
  };

  const handleSubmit = async () => {
    setSubmitted(true);

    if (!isFormValid()) {
      toast.current?.show({
        severity: "warn",
        summary: "Validación",
        detail: "Por favor complete los campos requeridos",
        life: 3000,
      });
      return;
    }

    try {
      setLoading(true);

      const payload = { ...formData, id_emisor };

      const response = await axios.put(API_URL, payload, {
        headers: { "Content-Type": "application/json" },
      });

      if (response.data.success) {
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Producto actualizado correctamente ✅", // ✅ Fix: decía "Cliente"
          life: 3000,
        });
        if (onSuccess) onSuccess();
      } else {
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: response.data.error || "Error desconocido",
          life: 3000,
        });
      }
    } catch (error) {
      console.error("Error al actualizar:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: error.response?.data?.error || "Error de red al actualizar",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
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
        <div className="grid">

          {/* Tipo Producto */}
          <div className="col-12">
            <div className="field">
              <label htmlFor="id_tipo_prod" className="font-bold block">
                Tipo Producto <span className="text-red-500">*</span>
              </label>
              <Dropdown
                id="id_tipo_prod"
                value={formData.id_tipo_prod}
                options={opcInv}
                onChange={(e) => handleTipoProdChange(e.value)} 
                placeholder="Seleccione un tipo"
                className={classNames("w-full", {
                  "p-invalid": submitted && !formData.id_tipo_prod
                })}
                showClear
              />
              {submitted && !formData.id_tipo_prod && (
                <small className="p-error">El tipo de producto es requerido</small>
              )}
            </div>
          </div>


          {/* Descripcion */}
          <div className="col-12">
            <div className="field">
              <label htmlFor="descripcion" className="font-bold block">
                Descripción
              </label>
              <InputTextarea
                id="descripcion"
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                className="w-full"
                rows={3}
              />
            </div>
          </div>

        {/* Producto carta */}
        {formData.id_tipo_prod === 1 && (
          <div className="col-6">
            <div className="field">
              <label htmlFor="id_prod_carta" className="font-bold block">
                Articulo 1
              </label>
              <Dropdown
                id="id_prod_carta"
                value={formData.id_prod_carta}
                options={productos}
                onChange={(e) => handleDropdownChange("id_prod_carta", e.value)}
                placeholder={loadingData ? "Cargando..." : "Seleccione un producto"}
                className="w-full"
                disabled={loadingData}
                showClear
                filter
              />
            </div>
          </div>
        )}

          {/* Producto carta */}
        {formData.id_tipo_prod === 1 && (
          <div className="col-6">
            <div className="field">
              <label htmlFor="id_prod_carta_2" className="font-bold block">
                Articulo 2 (Opcional)
              </label>
              <Dropdown
                id="id_prod_carta_2"
                value={formData.id_prod_carta_2}
                options={productos}
                onChange={(e) => handleDropdownChange("id_prod_carta_2", e.value)}
                placeholder={loadingData ? "Cargando..." : "Seleccione un producto"}
                className="w-full"
                disabled={loadingData}
                showClear
                filter
              />
            </div>
          </div>
        )}

          {/* Insumo */}
        {formData.id_tipo_prod === 2 && (
          <div className="col-12">
            <div className="field">
              <label htmlFor="id_insumo" className="font-bold block">
                Insumos
              </label>
              <Dropdown
                id="id_insumo"
                value={formData.id_insumo}
                options={insumos}
                onChange={(e) => handleDropdownChange("id_insumo", e.value)}
                placeholder={loadingData ? "Cargando..." : "Seleccione un insumo"}
                className="w-full"
                disabled={loadingData}
                showClear
                filter
              />
            </div>
          </div>
        )}


        </div>

        {/* Botones */}
        <div className="flex justify-content-end mt-4 gap-2">
          {onCancel && (
            <Button
              label="Cancelar"
              icon="pi pi-times"
              className="p-button-secondary"
              onClick={onCancel}
              disabled={loading}
            />
          )}
          <Button
            label="Guardar Cambios"
            icon="pi pi-check"
            className="p-button-success"
            onClick={handleSubmit}
            loading={loading} // ✅ Fix: usar prop loading de PrimeReact
          />
        </div>
    </div>
  );
}

export default Editar;