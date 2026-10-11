import React, { useState, useRef, useEffect } from "react";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from 'primereact/inputnumber';
import { classNames } from "primereact/utils";
import axios from "axios";
import { useAuth } from '../../context/useAuth';

function Agregar({ clave, onSuccess, onCancel }) {
  const { usuario } = useAuth();
  const id_emisor = usuario?.id_emisor || null;

  const [formData, setFormData] = useState({
    clave_rcp: clave, 
    descripcion: "",
    id_ins_gral: null,
    id_subreceta: null,
    cantidad: 0.00,
    id_almacen: null,
    item: 1
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

  const [insumos, setInsumos] = useState([]);
  const [almacenes, setAlmacenes] = useState([]);
  const [rcp, setRcp] = useState([]);

  const toast = useRef(null);

  const API_URL = `${import.meta.env.VITE_API_URL}rcp/items/INSERT.php`;

  const opcItem = [
    { label: 'Insumo', value: 1},
    { label: 'Subreceta', value: 2},
  ]

  // Sincronizar id_emisor cuando esté disponible
  useEffect(() => {
    if (id_emisor) {
      setFormData(prev => ({ ...prev, clave_rcp: clave }));
    }
  }, [id_emisor]);

  useEffect(() => {
    if (!id_emisor) return;

    cargarDatos();

  }, [id_emisor]);


  const cargarDatos = async () => {

    try {
      setLoading(true);

      const [resIns, resAlm, resRcp] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}ins_gral/GET.php?id_emisor=${id_emisor}`),
        axios.get(`${import.meta.env.VITE_API_URL}catalogos/alm/GET.php?id_emisor=${id_emisor}`),
        axios.get(`${import.meta.env.VITE_API_URL}rcp/GET.php?id_emisor=${id_emisor}`),
      ]);

      setInsumos(
        resIns.data
        ?.map(item => ({ label: item.descripcion, value: item.id}))
      );

      setAlmacenes(
        resAlm.data
          ?.map(item => ({ label: item.descripcion, value: item.id })) ?? []
      );

      setRcp(
        resRcp.data 
          ?.filter( item => item.id_tipo_prod === 2)
          ?.map(item => ({ label: item.descripcion, value: item.id })) ?? []
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

  const handleChangeNumber = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDropdownChange = (name, value) => {
    if (name === "item") {
      setFormData(prev => ({
        ...prev,
        item: value,
        id_ins_gral: value === 1 ? prev.id_ins_gral : null,
        id_subreceta: value === 2 ? prev.id_subreceta : null,
      }));
      return;
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const isFormValid = () => {
    const tieneReferencia = formData.item === 1
      ? formData.id_ins_gral !== null
      : formData.id_subreceta !== null;
    return formData.cantidad && formData.clave_rcp && tieneReferencia;
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

      <div className="grid">

        {/* Item */}
        <div className="col-4">
          <div className="field">
            <label htmlFor="item" className="font-bold block">
              Tipo
            </label>
            <Dropdown
              id="item"
              name="item"
              value={formData.item}
              options={opcItem}
              onChange={(e) => handleDropdownChange("item", e.value)}
              placeholder={loadingData ? "Cargando..." : "Seleccione un tipo"}
              className="w-full"
              disabled={loadingData}
              showClear
            />
          </div>
        </div>

        {/* Insumo */}
        { formData.item === 1 && (
          <div className="col-4">
            <div className="field">
              <label htmlFor="id_ins_gral" className="font-bold block">
                Insumo
              </label>
              <Dropdown
                id="id_ins_gral"
                name="id_ins_gral"
                value={formData.id_ins_gral}
                options={insumos}
                onChange={(e) => handleDropdownChange("id_ins_gral", e.value)}
                placeholder={loadingData ? "Cargando..." : "Seleccione un insumo"}
                className="w-full"
                disabled={loadingData}
                showClear
                filter
              />
            </div>
          </div>          
        )}

        {/* Receta */}
        { formData.item === 2 && (
          <div className="col-4">
            <div className="field">
              <label htmlFor="id_subreceta" className="font-bold block">
                Subreceta
              </label>
              <Dropdown
                id="id_subreceta"
                name="id_subreceta"
                value={formData.id_subreceta}
                options={rcp}
                onChange={(e) => handleDropdownChange("id_subreceta", e.value)}
                placeholder={loadingData ? "Cargando..." : "Seleccione una subreceta"}
                className="w-full"
                disabled={loadingData}
                showClear
                filter
              />
            </div>
          </div>          
        )}

        {/* Cantidad */}
        <div className="col-4">
          <div className="field">
            <label htmlFor="cantidad" className="font-bold block">
              Cantidad <span className="text-red-500">*</span>
            </label>
            <InputNumber
              id="cantidad"
              value={formData.cantidad}
              onValueChange={(e) => handleChangeNumber("cantidad", e.value ?? 0)}
              showButtons
              buttonLayout="stacked"
              min={0}
              minFractionDigits={2}  
              maxFractionDigits={4}  
              className={classNames("w-full", {
                "p-invalid": submitted && !formData.cantidad
              })}
            />
          </div>
        </div>

        {/* Descripcion */}
        <div className="col-12">
          <div className="field">
            <label htmlFor="descripcion" className="font-bold block">
              Descripcion
            </label>
            <InputText
              id="descripcion"
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              className="w-full"
            />
          </div>
        </div>

        {/* Almacen */}
          <div className="col-12">
            <div className="field">
              <label htmlFor="id_almacen" className="font-bold block">
                Almacen
              </label>
              <Dropdown
                id="id_almacen"
                name="id_almacen"
                value={formData.id_almacen}
                options={almacenes}
                onChange={(e) => handleDropdownChange("id_almacen", e.value)}
                placeholder={loadingData ? "Cargando..." : "Seleccione un almacen"}
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
            disabled={loading}
          />
        </div>
    </div>
  );
}

export default Agregar;
