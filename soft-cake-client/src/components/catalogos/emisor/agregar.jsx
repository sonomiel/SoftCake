import React, { useState, useRef, useEffect } from "react";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";
import { Card } from "primereact/card";
import { classNames } from "primereact/utils";
import axios from "axios";
import { useAuth } from '../../context/useAuth';

function Agregar({ onSuccess, onCancel }) {
  const { usuario } = useAuth();
  const id_emisor = usuario?.id_emisor || null;

  const [formData, setFormData] = useState({
    ciudad: "",
    colonia: "",
    cp: "",
    cp_lugar_expedicion: "",
    dir_matriz: "",
    dir_sucursal: "",
    estado: "",
    localidad: "",
    logo_empresa: "",
    nombre: "",
    nombre_comercial: "",
    num_exterior: "",
    num_interior: "",
    pais: "",
    regimen_fiscal: "",
    rfc: ""
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

  const toast = useRef(null);

  const API_URL = `${import.meta.env.VITE_API_URL}catalogos/em/INSERT.php`;

  // Sincronizar id_emisor cuando esté disponible
  useEffect(() => {
    if (id_emisor) {
      setFormData(prev => ({ ...prev, id_emisor }));
    }
  }, [id_emisor]);

  useEffect(() => {
    if (!id_emisor) return;

  }, [id_emisor]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };


  const isFormValid = () => {
    return formData.nombre?.trim() && formData.rfc?.trim() && formData.id_emisor;
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

      const response = await axios.post(API_URL, formData, {
        headers: { "Content-Type": "application/json" }
      });

      if (response.data.success) {
        toast.current.show({
          severity: "success",
          summary: "Éxito",
          detail: "Cliente agregado correctamente ✅",
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
      console.error("Error al agregar:", error);
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Error de red al agregar",
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
                value={formData.nombre}
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
                value={formData.rfc}
                onChange={handleChange}
                className={classNames("w-full", {
                  "p-invalid": submitted && !formData.rfc?.trim()
                })}
              />
              {submitted && !formData.rfc?.trim() && (
                <small className="p-error block">El RFC es requerido</small>
              )}
            </div>
          </div>

          {/* Nombre Comercial */}
          <div className="col-12 md:col-6">
            <div className="field">
              <label htmlFor="nombre_comercial" className="font-bold block">
                Nombre Comercial
              </label>
              <InputText
                id="nombre_comercial"
                name="nombre_comercialfi"
                value={formData.nombre_comercial}
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
                value={formData.regimen_fiscal}
                onChange={handleChange}
                className="w-full"
              />
            </div>
          </div>


          {/* País */}
          <div className="col-12 md:col-4">
            <div className="field">
              <label htmlFor="pais" className="font-bold block">
                País
              </label>
              <InputText
                id="pais"
                name="pais"
                value={formData.pais}
                onChange={handleChange}
                className="w-full"
              />
            </div>
          </div>

          {/* Estado */}
          <div className="col-12 md:col-4">
            <div className="field">
              <label htmlFor="estado" className="font-bold block">
                Estado 
              </label>
              <InputText
                id="estado"
                name="estado"
                value={formData.estado}
                onChange={handleChange}
                className="w-full"
              />
            </div>
          </div>

          {/* Ciudad */}
          <div className="col-12 md:col-4">
            <div className="field">
              <label htmlFor="ciudad" className="font-bold block">
                Ciudad 
              </label>
              <InputText
                id="ciudad"
                name="ciudad"
                value={formData.ciudad}
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
                value={formData.localidad}
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
                value={formData.colonia}
                onChange={handleChange}
                className="w-full"
              />
            </div>
          </div>

          {/* Código Postal */}
          <div className="col-12 md:col-6">
            <div className="field">
              <label htmlFor="cp" className="font-bold block">
                Código Postal
              </label>
              <InputText
                id="cp"
                name="cp"
                value={formData.cp}
                onChange={handleChange}
                className="w-full"
                keyfilter="int"
              />
            </div>
          </div>

          {/* Código Postal Expedicion*/}
          <div className="col-12 md:col-6">
            <div className="field">
              <label htmlFor="cp_lugar_expedicion" className="font-bold block">
                Código Postal de Expedicion
              </label>
              <InputText
                id="cp_lugar_expedicion"
                name="cp_lugar_expedicion"
                value={formData.cp_lugar_expedicion}
                onChange={handleChange}
                className="w-full"
                keyfilter="int"
              />
          </div>
          
          </div>
          
          {/* No. Exterior */}
          <div className="col-12 md:col-6">
            <div className="field">
              <label htmlFor="num_exterior" className="font-bold block">
                No. Exterior
              </label>
              <InputText
                id="num_exterior"
                name="num_exterior"
                value={formData.num_exterior}
                onChange={handleChange}
                className="w-full"
              />
            </div>
          </div>

          {/* No. Interior */}
          <div className="col-12 md:col-6">
            <div className="field">
              <label htmlFor="num_interior" className="font-bold block">
                No. Interior
              </label>
              <InputText
                id="num_interior"
                name="num_interior"
                value={formData.num_interior}
                onChange={handleChange}
                className="w-full"
              />
            </div>
          </div>

          {/* Dirección Matriz */}
          <div className="col-12">
            <div className="field">
              <label htmlFor="dir_matriz" className="font-bold block">
                Dirección Matriz
              </label>
              <InputText
                id="dir_matriz"
                name="dir_matriz"
                value={formData.dir_matriz}
                onChange={handleChange}
                className="w-full"
              />
            </div>
          </div>

          {/* Dirección Sucursal */}
          <div className="col-12">
            <div className="field">
              <label htmlFor="dir_sucursal" className="font-bold block">
                Dirección Sucursal
              </label>
              <InputText
                id="dir_sucursal"
                name="dir_sucursal"
                value={formData.dir_sucursal}
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
            label={loading ? "Guardando..." : "Agregar"}
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

export default Agregar;
