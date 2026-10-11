import React, { useState, useRef, useEffect } from "react";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";
import { Card } from "primereact/card";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
import { classNames } from "primereact/utils";
import axios from "axios";
import { useAuth } from '../../context/useAuth';

function Agregar({ onSuccess, onCancel }) {
  const { usuario } = useAuth();
  const id_emisor = usuario?.id_emisor || null;

  const [formData, setFormData] = useState({
    subcategoria: "",
    id_categoria: 0,
    id_padre: "",
    id_emisor: id_emisor
  
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [categoria, setCategoria] = useState([]);
  const [subcategoria, setSubcategoria] = useState([]);

  const [loadingData, setLoadingData] = useState(false);

  const toast = useRef(null);

  const API_URL = `${import.meta.env.VITE_API_URL}catalogos/sc/INSERT.php`;

  // Sincronizar id_emisor cuando esté disponible
  useEffect(() => {
    if (id_emisor) {
      setFormData(prev => ({ ...prev, id_emisor }));
    }
  }, [id_emisor]);

  useEffect(() => {
    if (!id_emisor) return;
      const cargarCategorias = async () => {
        try {
          setLoadingData(true);
          const API_GET = `${import.meta.env.VITE_API_URL}catalogos/cat/GET.php?id_emisor=${id_emisor}`;
          const response = await axios.get(API_GET);

          const data = response.data;

        if (Array.isArray(data)) {
          setCategoria(
            data.map(m => ({
              label: m.categoria,
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

      const cargarSubcategorias = async () => {
        try {
          setLoadingData(true);
          const API_GET = `${import.meta.env.VITE_API_URL}catalogos/sc/GET.php?id_emisor=${id_emisor}`;
          const response = await axios.get(API_GET);

          const data = response.data;

        if (Array.isArray(data)) {
          setSubcategoria(
            data.map(m => ({
              label: m.subcategoria,
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

    cargarCategorias();
    cargarSubcategorias();
  }, [id_emisor]);


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDropdownChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const isFormValid = () => {
    return formData.subcategoria?.trim() && formData.id_categoria;
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
            {/* Subcategoria */}
            <div className="col-12 md:col-6">
              <div className="field">
                <label htmlFor="subcategoria" className="font-bold block">
                  Subcategoria <span className="text-red-500">*</span>
                </label>
                <InputText
                  id="subcategoria"
                  name="subcategoria"
                  value={formData.subcategoria}
                  onChange={handleChange}
                  className={classNames("w-full", {
                    "p-invalid": submitted && !formData.subcategoria?.trim()
                  })}
                />
              </div>
            </div>

          {/* Categoria */}
          <div className="col-12 md:col-6">
            <div className="field">
              <label htmlFor="id_categoria" className="font-bold block">
                Categoria
              </label>
              <Dropdown
                id="id_categoria"
                name="id_categoria"
                value={formData.id_categoria}
                options={categoria}
                onChange={(e) => handleDropdownChange("id_categoria", e.value)}
                placeholder={loadingData ? "Cargando..." : "Seleccione una categoria"}
                className="w-full"
                disabled={loadingData}
                showClear
              />
            </div>
          </div>

            {/* Id Padre */}
            <div className="col-12 md:col-6">
              <div className="field">
                <label htmlFor="id_padre" className="font-bold block">
                  Despues de 
                </label>
                <Dropdown
                id="id_padre"
                name="id_padre"
                value={formData.id_padre}
                options={subcategoria}
                onChange={(e) => handleDropdownChange("id_padre", e.value)}
                placeholder={loadingData ? "Cargando..." : "Seleccione una subcategoria"}
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
