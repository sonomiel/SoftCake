import React, { useState, useRef, useEffect } from "react";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { Toast } from "primereact/toast";
import { Card } from "primereact/card";
import { Dropdown } from "primereact/dropdown";
import { classNames } from "primereact/utils";
import axios from "axios";
import { useAuth } from "../../context/useAuth";

function Agregar({ onSuccess, onCancel }) {
  const { usuario } = useAuth();
  const id_emisor = usuario?.id_emisor || null;

  const [formData, setFormData] = useState({
    complemento: "",
    importe: null,
    id_almacen: 0,
    factor_unitario: null,
    id_ins_gral: 0,
    id_emisor: id_emisor,
  });

  const [loading, setLoading] = useState(false); // guardando
  const [loadingData, setLoadingData] = useState(false); // cargando catálogos
  const [submitted, setSubmitted] = useState(false);
  const [almacenes, setAlmacenes] = useState([]);
  const [insumos, setInsumos] = useState([]);

  const toast = useRef(null);

  const API_URL = `${import.meta.env.VITE_API_URL}catalogos/comp/INSERT.php`;

  // Sincronizar id_emisor cuando esté disponible
  useEffect(() => {
    if (id_emisor) {
      setFormData((prev) => ({ ...prev, id_emisor }));
    }
  }, [id_emisor]);

  // Cargar catálogos (todas las peticiones en paralelo)
  useEffect(() => {
    if (!id_emisor) return;

    const cargarDatos = async () => {
      setLoadingData(true);
      try {
        const [resAlmacen, resInsumo] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URL}catalogos/alm/GET.php?id_emisor=${id_emisor}`),
          axios.get(`${import.meta.env.VITE_API_URL}ins_gral/GET.php?id_emisor=${id_emisor}`),
        ]);

        if (Array.isArray(resAlmacen.data))
          setAlmacenes(resAlmacen.data.map((m) => ({ label: m.descripcion, value: m.id })));

        if (Array.isArray(resInsumo.data))
          setInsumos(resInsumo.data.map((m) => ({ label: m.descripcion, value: m.id })));
      } catch (error) {
        console.error("Error al cargar catálogos:", error);
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: "Error al cargar datos",
          life: 3000,
        });
      } finally {
        setLoadingData(false);
      }
    };

    cargarDatos();
  }, [id_emisor]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleChangeNumber = (name) => (e) => {
    setFormData((prev) => ({ ...prev, [name]: e.value }));
  };

  const handleDropdownChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const importeInvalido = formData.importe === null || formData.importe <= 0;
  const factorInvalido = formData.factor_unitario === null || formData.factor_unitario <= 0;

  const isFormValid = () => {
    return !!formData.complemento?.trim() && !importeInvalido && !factorInvalido;
  };

  const handleSubmit = async () => {
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

    try {
      setLoading(true);

      const response = await axios.post(API_URL, formData, {
        headers: { "Content-Type": "application/json" },
      });

      if (response.data.success) {
        toast.current.show({
          severity: "success",
          summary: "Éxito",
          detail: "Agregado correctamente ✅",
          life: 3000,
        });
        if (onSuccess) onSuccess();
      } else {
        toast.current.show({
          severity: "error",
          summary: "Error",
          detail: response.data.error || "Error desconocido",
          life: 3000,
        });
      }
    } catch (error) {
      console.error("Error al agregar:", error);
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Error de red al agregar",
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
              <p className="mt-2">Cargando ...</p>
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
                  "p-invalid": submitted && !formData.complemento?.trim(),
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
                inputId="importe"
                name="importe"
                value={formData.importe}
                onValueChange={handleChangeNumber("importe")}
                mode="currency"
                currency="MXN"
                locale="es-MX"
                minFractionDigits={2}
                className={classNames("w-full", {
                  "p-invalid": submitted && importeInvalido,
                })}
              />
              {submitted && importeInvalido && (
                <small className="p-error block">El importe es requerido</small>
              )}
            </div>
          </div>

          {/* F. Unitario */}
          <div className="col-12 md:col-6">
            <div className="field">
              <label htmlFor="factor_unitario" className="font-bold block">
                Factor Unitario <span className="text-red-500">*</span>
              </label>
              <InputNumber
                inputId="factor_unitario"
                name="factor_unitario"
                value={formData.factor_unitario}
                onValueChange={handleChangeNumber("factor_unitario")}
                minFractionDigits={2}
                className={classNames("w-full", {
                  "p-invalid": submitted && factorInvalido,
                })}
              />
              {submitted && factorInvalido && (
                <small className="p-error block">El factor unitario es requerido</small>
              )}
            </div>
          </div>

          {/* Almacén */}
          <div className="col-12 md:col-6">
            <div className="field">
              <label htmlFor="id_almacen" className="font-bold block">
                Almacén
              </label>
              <Dropdown
                inputId="id_almacen"
                name="id_almacen"
                value={formData.id_almacen}
                options={almacenes}
                onChange={(e) => handleDropdownChange("id_almacen", e.value)}
                placeholder={loadingData ? "Cargando..." : "Selecciona un almacén"}
                className="w-full"
                disabled={loadingData}
                showClear
              />
            </div>
          </div>

          {/* Insumo */}
          <div className="col-12">
            <div className="field">
              <label htmlFor="id_ins_gral" className="font-bold block">
                Insumo <span className="text-red-500">*</span>
              </label>
              <Dropdown
                inputId="id_ins_gral"
                name="id_ins_gral"
                value={formData.id_ins_gral}
                options={insumos}
                onChange={(e) => handleDropdownChange("id_ins_gral", e.value)}
                placeholder={loadingData ? "Cargando..." : "Selecciona un insumo"}
                className="w-full"
                disabled={loadingData}
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
            label={loading ? "Guardando..." : "Agregar"}
            icon="pi pi-check"
            className="p-button-success"
            onClick={handleSubmit}
            disabled={loading || loadingData}
          />
        </div>
      </Card>
    </div>
  );
}

export default Agregar;