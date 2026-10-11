import React, { useState, useRef, useEffect } from "react";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";
import { Card } from "primereact/card";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
import { InputTextarea } from "primereact/inputtextarea";
import { classNames } from "primereact/utils";
import axios from "axios";
import { useAuth } from '../context/useAuth';

function Editar({ cs, onSuccess, onCancel }) {
  const { usuario } = useAuth();
  const id_emisor = usuario?.id_emisor || null;

  const [formData, setFormData] = useState({ ...cs });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loadingData, setLoadingData] = useState(false); 
  const [proveedores, setProveedores] = useState([]);
  const [conceptos, setConceptos] = useState([]);  
  const toast = useRef(null);

  const API_URL = `${import.meta.env.VITE_API_URL}g/UPDATE.php`;

  // Sincronizar formData si cambia el registro seleccionado
  useEffect(() => {
    if (cs) {
      setFormData({ ...cs, id_emisor });
      setSubmitted(false);
    }
  }, [cs, id_emisor]);

    useEffect(() => {
    if (!id_emisor) return;

    const cargarProveedor = async () => {
      try {
        setLoadingData(true);
        const API_GET = `${import.meta.env.VITE_API_URL}catalogos/pr/GET.php?id_emisor=${id_emisor}`;
        const response = await axios.get(API_GET);

        const data = response.data;

      if (Array.isArray(data)) {
        setProveedores(
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

    const cargarConcepto = async () => {
      try {
        setLoadingData(true);
        const API_GET = `${import.meta.env.VITE_API_URL}catalogos/cm/GET.php?id_emisor=${id_emisor}`;
        const response = await axios.get(API_GET);

        const data = response.data;

      if (Array.isArray(data)) {
        setConceptos(
          data
            .filter(m => m.tipo === 3)
            .map(m => ({
              label: m.clave,
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

    cargarProveedor();
    cargarConcepto();
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
    return formData.id_proveedor && formData.id_concepto_mvto && formData.importe;
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
                options={proveedores}
                onChange={(e) => handleDropdownChange("id_proveedor", e.value)}
                placeholder={loadingData ? "Cargando..." : "Seleccione un proveedor"}
                className="w-full"
                disabled={loadingData}
                showClear
              />
            </div>
          </div>

          {/* Concepto de Movimiento */}
          <div className="col-12 md:col-6">
            <div className="field">
              <label htmlFor="id_concepto_mvto" className="font-bold block">
                Concepto
              </label>
              <Dropdown
                id="id_concepto_mvto"
                name="id_concepto_mvto"
                value={formData.id_concepto_mvto}
                options={conceptos}
                onChange={(e) => handleDropdownChange("id_concepto_mvto", e.value)}
                placeholder={loadingData ? "Cargando..." : "Seleccione un concepto"}
                className="w-full"
                disabled={loadingData}
                showClear
              />
            </div>
          </div>

          {/* ── Comentarios ── */}
          <div className="col-12">
            <div className="field">
              <label htmlFor="comentarios" className="font-bold block">Observaciones</label>
              <InputTextarea id="comentarios" name="comentarios"
                value={formData.comentarios} onChange={handleChange}
                rows={3} className="w-full" placeholder="Opcional" />
            </div>
          </div>

          {/* Referencia */}
          <div className="col-12 md:col6">
            <div className="field">
              <label htmlFor="referencia" className="font-bold block">
                Referencia <span className="text-red-500">*</span>
              </label>
              <InputText
                id="referencia"
                name="referencia"
                value={formData.referencia}
                onChange={handleChange}
                className={classNames("w-full", {
                  "p-invalid": submitted && !formData.referencia?.trim()
                })}
              />
            </div>
          </div>

          {/* Importe */}
          <div className="col-12 ">
            <div className="field">
              <label htmlFor="importe" className="font-bold block">
                Importe
              </label>
              <InputNumber
                id="importe"
                value={formData.importe}
                onValueChange={(e) => handleNumberChange("importe", e.value)}
                className="w-full"
                mode="currency"
                currency="USD"
                locale="en-US"
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