import React, { useState, useRef, useEffect } from "react";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";
import { Card } from "primereact/card";
import { Dropdown } from "primereact/dropdown";
import { classNames } from "primereact/utils";
import axios from "axios";
import { useAuth } from '../../context/useAuth';
import { InputNumber } from "primereact/inputnumber";

function Agregar({ onSuccess, onCancel }) {
  const { usuario } = useAuth();
  const id_emisor = usuario?.id_emisor || null;

  const [formData, setFormData] = useState({
    ciudad: "",
    clave_proveedor: "",
    codigo_postal: "",
    colonia: "",
    correo_electronico: "",
    credito: 0.00,
    direccion: "",
    estado_provincia: "",
    nombre: "",
    no_exterior: "",
    no_interior: "",
    pais: "",
    rfc: "",
    telefono1: "",
    telefono2: "",
    tipo: "",
    id_emisor: ""
  
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [tipo_proveedor,setTiposProveedor] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  const toast = useRef(null);

  const API_URL = `${import.meta.env.VITE_API_URL}catalogos/pr/INSERT.php`;

  // Sincronizar id_emisor cuando esté disponible
  useEffect(() => {
    if (id_emisor) {
      setFormData(prev => ({ ...prev, id_emisor }));
    }
  }, [id_emisor]);

  useEffect(() => {
    if (!id_emisor) return;
  
    const cargarDatos = async () => {
      try {
        setLoadingData(true);
        const API_GET = `${import.meta.env.VITE_API_URL}catalogos/tp/GET.php?id_emidor=${id_emisor}`;
        const response = await axios.get(API_GET);

        const data = response.data;

      if (Array.isArray(data)) {
        setTiposProveedor(
          data.map(m => ({
            label: m.descripcion,
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

    const handleNumberChange = (e) => {
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
                Nombre
              </label>
              <InputText
                id="nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                className="w-full"
              />
            </div>
          </div>

          {/* Clave Proveedor */}
          <div className="col-12 md:col-6">
            <div className="field">
              <label htmlFor="clave_proveedor" className="font-bold block">
                Clave Proveedor <span className="text-red-500">*</span>
              </label>
              <InputText
                id="clave_proveedor"
                name="clave_proveedor"
                value={formData.clave_proveedor}
                onChange={handleChange}
                className={classNames("w-full", {
                  "p-invalid": submitted && !formData.clave_proveedor?.trim()
                })}
              />
              {submitted && !formData.clave_proveedor?.trim() && (
                <small className="p-error block">La clave es requerida</small>
              )}
            </div>
          </div>


          {/* Tipo Proveedor */}
          <div className="col-12 md:col-6">
            <div className="field">
              <label htmlFor="tipo" className="font-bold block">
                Tipo Proveedor
              </label>
              <Dropdown
                id="tipo"
                name="tipo"
                value={formData.tipo}
                options={tipo_proveedor}
                onChange={(e) => handleDropdownChange("tipo", e.value)}
                placeholder={loadingData ? "Cargando..." : "Seleccione un proveedor"}
                className="w-full"
                disabled={loadingData}
                showClear
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

          {/* Correo electronico */}
          <div className="col-12">
            <div className="field">
              <label htmlFor="correo_electronico" className="font-bold block">
                Correo Electronico
              </label>
              <InputText
                id="correo_electronico"
                name="correo_electronico"
                value={formData.correo_electronico}
                onChange={handleChange}
                className="w-full"
              />
            </div>
          </div>

          {/* Credito */}
          <div className="col-12 md:col-6">
            <div className="field">
              <label htmlFor="credito" className="font-bold block">
                Credito
              </label>
              <InputNumber
                id="credito"
                currency="USD"
                name="credito"
                value={formData.credito}
                onChange={handleNumberChange}
                className="w-full"
              />
            </div>
          </div>

          {/* CP */}
          <div className="col-12 md:col-6">
            <div className="field">
              <label htmlFor="codigo_postal" className="font-bold block">
                Codigo Postal
              </label>
              <InputNumber
                id="codigo_postal"
                name="codigo_postal"
                value={formData.codigo_postal}
                onChange={handleChange}
                className="w-full"
              />
            </div>
          </div>

          {/* Dirección  */}
          <div className="col-12">
            <div className="field">
              <label htmlFor="direccion" className="font-bold block">
                Dirección 
              </label>
              <InputText
                id="direccion"
                name="direccion"
                value={formData.direccion}
                onChange={handleChange}
                className="w-full"
              />
            </div>
          </div>

          {/* Estado */}
          <div className="col-12 md:col-6">
            <div className="field">
              <label htmlFor="estado_provincia" className="font-bold block">
                Estado / Provincia
              </label>
              <InputText
                id="estado_provincia"
                name="estado_provincia"
                value={formData.estado_provincia}
                onChange={handleChange}
                className="w-full"
              />
            </div>
          </div>

          {/* Ciudad */}
          <div className="col-12 md:col-6">
            <div className="field">
              <label htmlFor="ciudad" className="font-bold block">
                Ciudad <span className="text-red-500">*</span>
              </label>
              <InputText
                id="ciudad"
                name="ciudad"
                value={formData.ciudad}
                onChange={handleChange}
                className={classNames("w-full", {
                  "p-invalid": submitted && !formData.ciudad?.trim()
                })}
              />
              {submitted && !formData.ciudad?.trim() && (
                <small className="p-error block">La ciudad es requerido</small>
              )}
            </div>
          </div>

          {/* No. Exterior */}
          <div className="col-12 md:col-6">
            <div className="field">
              <label htmlFor="no_exterior" className="font-bold block">
                No. Exterior
              </label>
              <InputText
                id="no_exterior"
                name="no_exterior"
                value={formData.no_exterior}
                onChange={handleChange}
                className="w-full"
              />
            </div>
          </div>

          {/* No. Interior */}
          <div className="col-12 md:col-6">
            <div className="field">
              <label htmlFor="no_interior" className="font-bold block">
                No. Interior
              </label>
              <InputText
                id="no_interior"
                name="no_interior"
                value={formData.no_interior}
                onChange={handleChange}
                className="w-full"
              />
            </div>
          </div>

          {/* Pais */}
          <div className="col-12 md:col-6">
            <div className="field">
              <label htmlFor="pais" className="font-bold block">
                Pais
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

          {/* RFC */}
          <div className="col-12 md:col-6">
            <div className="field">
              <label htmlFor="rfc" className="font-bold block">
                RFC
              </label>
              <InputText
                id="rfc"
                name="rfc"
                value={formData.rfc}
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
                value={formData.telefono1}
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
                value={formData.telefono2}
                onChange={handleChange}
                className="w-full"
                keyfilter="int"
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
