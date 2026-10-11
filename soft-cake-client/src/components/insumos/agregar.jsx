import React, { useState, useRef, useEffect } from "react";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";
import { Card } from "primereact/card";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from 'primereact/inputnumber';
import { classNames } from "primereact/utils";
import axios from "axios";
import { useAuth } from '../context/useAuth';

function Agregar({ onSuccess, onCancel }) {
  const { usuario } = useAuth();
  const id_emisor = usuario?.id_emisor || null;

  const [formData, setFormData] = useState({
    costo_estandar: 0.00, 
    descripcion: "",
    id_grupo: 0, 
    id_proveedor: 0, 
    inventariable: "", 
    iva_causado: 0.00,
    id_unidad_medida: "",
    id_emisor: id_emisor
  
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [proveedor, setProveedor] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [unidad, setUnidad] = useState([]);
  const toast = useRef(null);

  const opcInv = [
    {label: 'Si', value: 'S'},
    {label: 'No', value: 'N'}
  ]


  const API_URL = `${import.meta.env.VITE_API_URL}ins_gral/INSERT.php`;

  // Sincronizar id_emisor cuando esté disponible
  useEffect(() => {
    if (id_emisor) {
      setFormData(prev => ({ ...prev, id_emisor }));
    }
  }, [id_emisor]);

  useEffect(() => {
    if (!id_emisor) return;

    const cargarProveedores = async () => {
      try {
        setLoadingData(true);
        const API_GET = `${import.meta.env.VITE_API_URL}catalogos/pr/GET.php?id_emisor=${id_emisor}`;
        const response = await axios.get(API_GET);

        const data = response.data;

      if (Array.isArray(data)) {
        setProveedor(
          data.map(m => ({
            label: m.nombre,
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

    const cargarGrupos = async () => {
      try {
        setLoadingData(true);
        const API_GET = `${import.meta.env.VITE_API_URL}catalogos/fam/GET.php?id_emisor=${id_emisor}`;
        const response = await axios.get(API_GET);

        const data = response.data;

      if (Array.isArray(data)) {
        setGrupos(
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

    const cargarUnidades = async () => {
      try {
        setLoadingData(true);
        const API_GET = `${import.meta.env.VITE_API_URL}catalogos/um/GET.php`;
        const response = await axios.get(API_GET);

        const data = response.data;

      if (Array.isArray(data)) {
        setUnidad(
          data.map(m => ({
            label: m.unidad_medida,
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

    cargarProveedores();
    cargarGrupos();
    cargarUnidades();
  }, [id_emisor]);

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
    return formData.id_grupo && formData.id_proveedor;
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

          {/* Descripcion */}
          <div className="col-12">
            <div className="field">
              <label htmlFor="descripcion" className="font-bold block">
                Descripcion <span className="text-red-500">*</span>
              </label>
              <InputText
                id="descripcion"
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                className={classNames("w-full", {
                  "p-invalid": submitted && !formData.descripcion?.trim()
                })}
              />
            </div>
          </div>

          {/* Grupo */}
          <div className="col-12 md:col-6">
            <div className="field">
              <label htmlFor="id_grupo" className="font-bold block">
                Grupo / Familia
              </label>
              <Dropdown
                id="id_grupo"
                name="id_grupo"
                value={formData.id_grupo}
                options={grupos}
                onChange={(e) => handleDropdownChange("id_grupo", e.value)}
                placeholder={loadingData ? "Cargando..." : "Seleccione un grupo"}
                className="w-full"
                disabled={loadingData}
                showClear
              />
            </div>
          </div>

          {/* Proveedor */}
          <div className="col-12 md:col-6">
            <div className="field">
              <label htmlFor="id_proveedor" className="font-bold block">
                Proveedor
              </label>
              <Dropdown
                id="id_proveedor"
                name="id_proveedor"
                value={formData.id_proveedor}
                options={proveedor}
                onChange={(e) => handleDropdownChange("id_proveedor", e.value)}
                placeholder={loadingData ? "Cargando..." : "Seleccione un proveedor"}
                className="w-full"
                disabled={loadingData}
                showClear
              />
            </div>
          </div>

          {/* Inevntariable */}
          <div className="col-12 md:col-6">
            <div className="field">
              <label htmlFor="inventariable" className="font-bold block">
                Inventariable
              </label>
              <Dropdown
                id="inventariable"
                name="inventariable"
                value={formData.inventariable}
                options={opcInv}
                onChange={(e) => handleDropdownChange("inventariable", e.value)}
                placeholder={loadingData ? "Cargando..." : "Seleccione un método"}
                className="w-full"
                disabled={loadingData}
                showClear
              />
            </div>
          </div>


          {/* Costo estandar */}
          <div className="col-12 md:col-6">
            <div className="field">
              <label htmlFor="costo_estandar" className="font-bold block">
                C. Estandar
              </label>
              <InputNumber
                id="costo_estandar"
                value={formData.costo_estandar}
                onValueChange={(e) => handleNumberChange("costo_estandar", e.value)}
                className="w-full"
                mode="currency"
                currency="USD"
                locale="en-US"
              />
            </div>
          </div>

          {/* Iva */}
          <div className="col-12 md:col-6">
            <div className="field">
              <label htmlFor="iva_causado" className="font-bold block">
                IVA
              </label>
              <InputNumber
                id="iva_causado"
                value={formData.iva_causado}
                onValueChange={(e) => handleNumberChange("iva_causado", e.value)}
                className="w-full"
                mode="currency"
                currency="USD"
                locale="en-US"
              />
            </div>
          </div>

          {/* Unidad Medida */}
          <div className="col-12 md:col-6">
            <div className="field">
              <label htmlFor="id_unidad_medida" className="font-bold block">
                Unidad Medida
              </label>
              <Dropdown
                id="id_unidad_medida"
                name="id_unidad_medida"
                value={formData.id_unidad_medida}
                options={unidad}
                onChange={(e) => handleDropdownChange("id_unidad_medida", e.value)}
                placeholder={loadingData ? "Cargando..." : "Seleccione una unidad"}
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
            disabled={loading}
          />
        </div>
      </Card>
    </div>
  );
}

export default Agregar;
