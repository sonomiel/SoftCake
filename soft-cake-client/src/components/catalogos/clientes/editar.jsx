import React, { useState, useRef, useEffect } from "react";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Toast } from "primereact/toast";
import { Card } from "primereact/card";
import { classNames } from "primereact/utils";
import axios from "axios";
import { useAuth } from '../../context/useAuth';

function Editar({ cs, onSuccess, onCancel }) {
  const { usuario } = useAuth();
  const id_emisor = usuario?.id_emisor || null;

  const [formData, setFormData] = useState({ ...cs });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [metodosPago, setMetodosPago] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  const toast = useRef(null);

  const API_URL = `${import.meta.env.VITE_API_URL}catalogos/cl/UPDATE.php`;

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

    const cargarDatos = async () => {
      try {
        setLoadingData(true);
        const API_GET = `${import.meta.env.VITE_API_URL}catalogos/mp/GET.php`;
        const response = await axios.get(API_GET);
        const data = response.data;

        // Adaptar según la estructura que devuelva tu GET.php
        if (Array.isArray(data)) {
        setMetodosPago(
          data.map(m => ({
            label: m.metodo_pago,
            value: m.id
          }))
        );
      }
      } catch (error) {
        console.error("Error al cargar catálogos:", error);
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: "Error al cargar los catálogos",
          life: 3000
        });
      } finally {
        setLoadingData(false);
      }
    };

    cargarDatos();
  }, [id_emisor]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDropdownChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const isFormValid = () => {
    return formData.nombre?.trim() && formData.id_emisor;
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
          detail: "Cliente actualizado correctamente ✅",
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
              <p className="mt-2">Cargando datos de la clínica...</p>
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

          {/* Nombre */}
          <div className="col-12 md:col-6">
            <div className="field">
              <label htmlFor="nombre" className="font-bold block">
                Nombre <span className="text-red-500">*</span>
              </label>
              <InputText
                id="nombre"
                name="nombre"
                value={formData.nombre || ""}
                onChange={handleChange}
                className={classNames("w-full", {
                  "p-invalid": submitted && !formData.nombre?.trim()
                })}
              />
              {submitted && !formData.nombre?.trim() && (
                <small className="p-error block">El nombre es requerido</small>
              )}
            </div>
          </div>

          {/* RFC */}
          <div className="col-12 md:col-6">
            <div className="field">
              <label htmlFor="rfc" className="font-bold block">
                RFC <span className="text-red-500">*</span>
              </label>
              <InputText
                id="rfc"
                name="rfc"
                value={formData.rfc || ""}
                onChange={handleChange}
                className={classNames("w-full", {
                  "p-invalid": submitted && !formData.rfc?.trim()
                })}
              />
            </div>
          </div>

          {/* CFDI */}
          <div className="col-12 md:col-6">
            <div className="field">
              <label htmlFor="cdfi" className="font-bold block">
                CFDI
              </label>
              <InputText
                id="cdfi"
                name="cdfi"
                value={formData.cdfi || ""}
                onChange={handleChange}
                className="w-full"
              />
            </div>
          </div>

          {/* Régimen Fiscal */}
          <div className="col-12 md:col-6">
            <div className="field">
              <label htmlFor="regimen_fiscal" className="font-bold block">
                Régimen Fiscal
              </label>
              <InputText
                id="regimen_fiscal"
                name="regimen_fiscal"
                value={formData.regimen_fiscal || ""}
                onChange={handleChange}
                className="w-full"
              />
            </div>
          </div>

          {/* Correo electrónico */}
          <div className="col-12 md:col-6">
            <div className="field">
              <label htmlFor="correo_electronico" className="font-bold block">
                Correo Electrónico
              </label>
              <InputText
                id="correo_electronico"
                name="correo_electronico"
                value={formData.correo_electronico || ""}
                onChange={handleChange}
                className="w-full"
                keyfilter="email"
              />
            </div>
          </div>

          {/* Clave */}
          <div className="col-12 md:col-6">
            <div className="field">
              <label htmlFor="clave" className="font-bold block">
                Clave
              </label>
              <InputText
                id="clave"
                name="clave"
                value={formData.clave || ""}
                onChange={handleChange}
                className="w-full"
              />
            </div>
          </div>

          {/* Teléfono 1 */}
          <div className="col-12 md:col-6">
            <div className="field">
              <label htmlFor="telefono1" className="font-bold block">
                Teléfono 1
              </label>
              <InputText
                id="telefono1"
                name="telefono1"
                value={formData.telefono1 || ""}
                onChange={handleChange}
                className="w-full"
                keyfilter="int"
              />
            </div>
          </div>

          {/* Teléfono 2 */}
          <div className="col-12 md:col-6">
            <div className="field">
              <label htmlFor="telefono2" className="font-bold block">
                Teléfono 2
              </label>
              <InputText
                id="telefono2"
                name="telefono2"
                value={formData.telefono2 || ""}
                onChange={handleChange}
                className="w-full"
                keyfilter="int"
              />
            </div>
          </div>

          {/* Método de Pago */}
          <div className="col-12 md:col-6">
            <div className="field">
              <label htmlFor="id_metodopago" className="font-bold block">
                Método de Pago
              </label>
              <Dropdown
                id="id_metodopago"
                name="id_metodopago"
                value={formData.id_metodopago || null}
                options={metodosPago}
                onChange={(e) => handleDropdownChange("id_metodopago", e.value)}
                placeholder={loadingData ? "Cargando..." : "Seleccione un método"}
                className="w-full"
                disabled={loadingData}
                showClear
              />
            </div>
          </div>

          {/* País */}
          <div className="col-12 md:col-6">
            <div className="field">
              <label htmlFor="pais" className="font-bold block">
                País
              </label>
              <InputText
                id="pais"
                name="pais"
                value={formData.pais || ""}
                onChange={handleChange}
                className="w-full"
              />
            </div>
          </div>

          {/* Estado / Provincia */}
          <div className="col-12 md:col-6">
            <div className="field">
              <label htmlFor="estado_provincia" className="font-bold block">
                Estado / Provincia
              </label>
              <InputText
                id="estado_provincia"
                name="estado_provincia"
                value={formData.estado_provincia || ""}
                onChange={handleChange}
                className="w-full"
              />
            </div>
          </div>

          {/* Municipio */}
          <div className="col-12 md:col-6">
            <div className="field">
              <label htmlFor="municipio" className="font-bold block">
                Municipio
              </label>
              <InputText
                id="municipio"
                name="municipio"
                value={formData.municipio || ""}
                onChange={handleChange}
                className="w-full"
              />
            </div>
          </div>

          {/* Localidad */}
          <div className="col-12 md:col-6">
            <div className="field">
              <label htmlFor="localidad" className="font-bold block">
                Localidad
              </label>
              <InputText
                id="localidad"
                name="localidad"
                value={formData.localidad || ""}
                onChange={handleChange}
                className="w-full"
              />
            </div>
          </div>

          {/* Colonia */}
          <div className="col-12 md:col-6">
            <div className="field">
              <label htmlFor="colonia" className="font-bold block">
                Colonia
              </label>
              <InputText
                id="colonia"
                name="colonia"
                value={formData.colonia || ""}
                onChange={handleChange}
                className="w-full"
              />
            </div>
          </div>

          {/* Código Postal */}
          <div className="col-12 md:col-4">
            <div className="field">
              <label htmlFor="codigo_postal" className="font-bold block">
                Código Postal
              </label>
              <InputText
                id="codigo_postal"
                name="codigo_postal"
                value={formData.codigo_postal || ""}
                onChange={handleChange}
                className="w-full"
                keyfilter="int"
              />
            </div>
          </div>

          {/* No. Exterior */}
          <div className="col-12 md:col-4">
            <div className="field">
              <label htmlFor="no_exterior" className="font-bold block">
                No. Exterior
              </label>
              <InputText
                id="no_exterior"
                name="no_exterior"
                value={formData.no_exterior || ""}
                onChange={handleChange}
                className="w-full"
              />
            </div>
          </div>

          {/* No. Interior */}
          <div className="col-12 md:col-4">
            <div className="field">
              <label htmlFor="no_interior" className="font-bold block">
                No. Interior
              </label>
              <InputText
                id="no_interior"
                name="no_interior"
                value={formData.no_interior || ""}
                onChange={handleChange}
                className="w-full"
              />
            </div>
          </div>

          {/* Dirección */}
          <div className="col-12">
            <div className="field">
              <label htmlFor="direccion" className="font-bold block">
                Dirección
              </label>
              <InputText
                id="direccion"
                name="direccion"
                value={formData.direccion || ""}
                onChange={handleChange}
                className="w-full"
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
