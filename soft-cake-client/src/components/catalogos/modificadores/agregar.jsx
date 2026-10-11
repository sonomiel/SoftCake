import React, { useState, useRef, useEffect } from "react";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";
import { Card } from "primereact/card";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
import { classNames } from "primereact/utils";
import axios from "axios";
import { useAuth } from "../../context/useAuth";

const OPCIONES_CATEGORIA = [
  { label: "Bizcocho", value: 1 },
  { label: "Relleno", value: 2 },
  { label: "Cobertura", value: 3 },
  { label: "Extras", value: 4 },
  { label: "Decoracion", value: 5 },
];

const API_URL = `${import.meta.env.VITE_API_URL}catalogos/md/INSERT.php`;

function Agregar({ onSuccess, onCancel }) {
  const { usuario } = useAuth();
  const id_emisor = usuario?.id_emisor || null;

  const [formData, setFormData] = useState({
    modificador: "",
    id_categoria: null,
    precio: null,
    id_ins_gral: null,
    id_emisor: id_emisor,
  });

  const [loading, setLoading] = useState(false); // guardando
  const [loadingData, setLoadingData] = useState(false); // cargando catálogos
  const [submitted, setSubmitted] = useState(false);
  const [insumos, setInsumos] = useState([]);

  const toast = useRef(null);

  // Sincronizar id_emisor cuando esté disponible
  useEffect(() => {
    if (id_emisor) {
      setFormData((prev) => ({ ...prev, id_emisor }));
    }
  }, [id_emisor]);

  // Cargar catálogos
  useEffect(() => {
    if (!id_emisor) return;

    const cargarDatos = async () => {
      setLoadingData(true);
      try {
        const [resInsumo] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URL}ins_gral/GET.php?id_emisor=${id_emisor}`),
          // aquí puedes agregar más peticiones en paralelo
        ]);

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

  const handleDropChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNumberChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const isFormValid = () => {
    return formData.modificador.trim() !== "" && formData.id_categoria !== null;
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
          {/* Modificador */}
          <div className="col-12">
            <div className="field">
              <label htmlFor="modificador" className="font-bold block">
                Modificador <span className="text-red-500">*</span>
              </label>
              <InputText
                id="modificador"
                name="modificador"
                value={formData.modificador}
                onChange={handleChange}
                className={classNames("w-full", {
                  "p-invalid": submitted && !formData.modificador?.trim(),
                })}
              />
              {submitted && !formData.modificador?.trim() && (
                <small className="p-error block">El modificador es requerido</small>
              )}
            </div>
          </div>

          {/* Categoría */}
          <div className="col-6">
            <div className="field">
              <label htmlFor="id_categoria" className="font-bold block">
                Categoría <span className="text-red-500">*</span>
              </label>
              <Dropdown
                inputId="id_categoria"
                name="id_categoria"
                options={OPCIONES_CATEGORIA}
                value={formData.id_categoria}
                onChange={(e) => handleDropChange("id_categoria", e.value)}
                placeholder="Selecciona una categoría"
                className={classNames("w-full", {
                  "p-invalid": submitted && !formData.id_categoria,
                })}
              />
              {submitted && !formData.id_categoria && (
                <small className="p-error block">La categoría es requerida</small>
              )}
            </div>
          </div>

          {/* Precio */}
          <div className="col-6">
            <div className="field">
              <label htmlFor="precio" className="font-bold block">
                Precio
              </label>
              <InputNumber
                inputId="precio"
                value={formData.precio}
                onValueChange={(e) => handleNumberChange("precio", e.value)}
                mode="currency"
                currency="USD"
                locale="en-US"
                className="w-full"
              />
            </div>
          </div>

          {/* Insumo */}
          <div className="col-12">
            <div className="field">
              <label htmlFor="id_ins_gral" className="font-bold block">
                Insumo
              </label>
              <Dropdown
                inputId="id_ins_gral"
                name="id_ins_gral"
                value={formData.id_ins_gral}
                options={insumos}
                onChange={(e) => handleDropChange("id_ins_gral", e.value)}
                placeholder={loadingData ? "Cargando..." : "Selecciona un insumo"}
                className="w-full"
                disabled={loadingData}
                showClear
                filter
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