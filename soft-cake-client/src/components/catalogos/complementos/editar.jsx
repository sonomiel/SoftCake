import React, { useState, useRef, useEffect } from "react";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { Toast } from "primereact/toast";
import { Card } from "primereact/card";
import { Dropdown } from "primereact/dropdown";
import { classNames } from "primereact/utils";
import axios from "axios";
import { useAuth } from '../../context/useAuth';

function Editar({ cs, onSuccess, onCancel }) {
  const { usuario } = useAuth();
  const id_emisor = usuario?.id_emisor || null;

  const [formData, setFormData] = useState({ ...cs });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [almaces, SetAlmacen] = useState([]);
  const [insumo, setInsumo] = useState([]);


  const toast = useRef(null);

  const API_URL = `${import.meta.env.VITE_API_URL}catalogos/comp/UPDATE.php`;

  // Sincronizar formData si cambia el registro seleccionado
  useEffect(() => {
    if (cs) {
      setFormData({ ...cs, id_emisor });
      setSubmitted(false);
    }
  }, [cs, id_emisor]);

  // Cargar catálogos desde GET.php
  useEffect(() => {
    if (!id_emisor) return;
    cargarAlmacen();
    cargarInsumos();
  }, [id_emisor]);

    const cargarAlmacen = async () => {
    try {
      setLoading(true);
      const API_ALM = `${import.meta.env.VITE_API_URL}catalogos/alm/GET.php?id_emisor=${id_emisor}`;
      const response = await axios.get(API_ALM);

      const data = response.data;

      if (Array.isArray(data)) {
        SetAlmacen(
          data.map(m => ({
            label: m.descripcion,
            value: m.id
          }))
        );
      }
    } catch (error) {
      console.error("Error al caragra catalogo: ", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar datos",
        life: 3000
      });
    } finally {
      setLoading(false);
    }
  };

    const cargarInsumos = async () => {
    try {
      setLoading(true);
      const API_INS = `${import.meta.env.VITE_API_URL}ins_gral/GET.php?id_emisor=${id_emisor}`;
      const response = await axios.get(API_INS);

      const data = response.data;

      if (Array.isArray(data)) {
          setInsumo(
            data.map(m => ({
              label: m.descripcion,
              value: m.id
            }))
          );
      }
    } catch(error) {
      console.error("Error al cargar catalogo: ", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error al cargar datos",
        life: 3000
      });
    } finally {
      setLoading(false);
    }
  }
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleChangeNumber = (name) => (e) => {
  setFormData(prev => ({ ...prev, [name]: e.value }));
  };

  const handleDropdownChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value}));
  }

  const isFormValid = () => {
    return formData.complemento?.trim() && formData.importe !== null && formData.importe > 0;
  };

  const handleSubmit = async () => {
    setSubmitted(true);

    if (!isFormValid()) {
      toast.current.show({
        severity: "warn",
        summary: "Validación",
        detail: "Por favor complete los campos requeridos",
        life: 3000
      });
      return;
    }

    try {
      setLoading(true);

      const payload = {
        ...formData,
        id_emisor
      };

      const response = await axios.put(API_URL, payload, {
        headers: { "Content-Type": "application/json" }
      });

      if (response.data.success) {
        toast.current.show({
          severity: "success",
          summary: "Éxito",
          detail: "actualizado correctamente ✅",
          life: 3000
        });
        if (onSuccess) onSuccess();
      } else {
        toast.current.show({
          severity: "error",
          summary: "Error",
          detail: response.data.error || "Error desconocido",
          life: 3000
        });
      }
    } catch (error) {
      console.error("Error al actualizar:", error);
      const errorMessage = error.response?.data?.error || "Error de red al actualizar";
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: errorMessage,
        life: 3000
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

      <Card className="mb-3">

        <div className="grid">


          {/* Complemento */}
          <div className="col-12 md:col-6">
            <div className="field">
              <label htmlFor="complemento" className="font-bold block">
                Complemento <span className="text-red-500">*</span>
              </label>
              <InputText
                id="complemento"
                name="complemento"
                value={formData.complemento}
                onChange={handleChange}
                className={classNames("w-full", {
                  "p-invalid": submitted && !formData.complemento?.trim()
                })}
              />
              {submitted && !formData.complemento?.trim() && (
                <small className="p-error block">El complemento es requerido</small>
              )}
            </div>
          </div>

          {/* Importe */}
          <div className="col-12 md:col-6">
            <div className="field">
              <label htmlFor="importe" className="font-bold block">
                Importe <span className="text-red-500">*</span>
              </label>
              <InputNumber
                id="importe"
                name="importe"
                value={formData.importe}
                onValueChange={handleChangeNumber("importe")}
                mode="currency"
                currency="MXN"
                locale="es-MX"
                minFractionDigits={2}
                className={classNames("w-full", {
                  "p-invalid": submitted && (formData.importe === null || formData.importe <= 0)
                })}
              />
              {submitted && (formData.importe === null || formData.importe <= 0) && (
                <small className="p-error block">El importe es requerido</small>
              )}
            </div>
          </div>

          {/* F. Unitario */}
          <div className="col-12 md:col-6">
            <div className="field">
              <label htmlFor="factor_unitario" className="font-bold block">
                Factor Unitarioo <span className="text-red-500">*</span>
              </label>
              <InputNumber
                id="factor_unitario"
                name="factor_unitario"
                value={formData.factor_unitario}
                onValueChange={handleChangeNumber("factor_unitario")}
                minFractionDigits={2}
                className={classNames("w-full", {
                  "p-invalid": submitted && (formData.importe === null || formData.importe <= 0)
                })}
              />
              {submitted && (formData.importe === null || formData.importe <= 0) && (
                <small className="p-error block">El importe es requerido</small>
              )}
            </div>
          </div>

          { /* Almacen */}
          <div className="col-12 md:col-6">
            <div className="field">
              <label htmlFor="id_almacen" className="font-bold block">
                Almacen *
              </label> 
              <Dropdown 
                id="id_almacen"
                name="id_almacen"
                value={formData.id_almacen}
                options={almaces}
                onChange={(e) => handleDropdownChange("id_almacen", e.value)}
                placeholder={loading ? "Cargando...": "Selecciona un almacen"}
                className="w-full"
                disabled={loading}
                showClear
              /> 
            </div> 
          </div>

          { /* Insumo */}
          <div className="col-12">
            <div className="field">
              <label htmlFor="id_ins_gral" className="font-bold block">
                Insumo *
              </label> 
              <Dropdown 
                id="id_ins_gral"
                name="id_ins_gral"
                value={formData.id_ins_gral}
                options={insumo}
                onChange={(e) => handleDropdownChange("id_ins_gral", e.value)}
                placeholder={loading ? "Cargando...": "Selecciona un insumo"}
                className="w-full"
                disabled={loading}
                showClear
              /> 
            </div> 
          </div>

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
            label={loading ? "Guardando..." : "Guardar Cambios"}
            icon="pi pi-check"
            className="p-button-success"
            onClick={handleSubmit}
            disabled={loading}
          />
        </div>
      </Card>
    </div>
  );
}

export default Editar;
