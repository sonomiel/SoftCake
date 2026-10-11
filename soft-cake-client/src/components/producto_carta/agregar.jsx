import React, { useState, useRef, useEffect, useMemo } from "react";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";
import { Card } from "primereact/card";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
import { FileUpload } from "primereact/fileupload";
import { Divider } from "primereact/divider";
import { classNames } from "primereact/utils";
import axios from "axios";
import { useAuth } from "../context/useAuth";

// Mismo mapeo usado en el SQL (CASE id_categoria)
const CATEGORIA_LABELS = {
  1: "Bizcocho",
  2: "Relleno",
  3: "Cobertura",
  4: "Extras",
  5: "Decoracion",
};

function Agregar({ onSuccess, onCancel }) {
  const { usuario } = useAuth();
  const id_emisor = usuario?.id_emisor || null;

  const [formData, setFormData] = useState({
    descripcion: "",
    id_almacen: 0,
    id_tipo: 0,
    precio: null,
    precio_desc: null,
    costo_compra: null,
    producto: "",
    txt_img: "",
    nombre_img: "",
    txt_img_nueva: "",
    id_emisor: id_emisor,
    id_subcategoria: 0,
    factor_unitario: 0,
    id_modificadores: [],
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

  const [almacenes, setAlmacenes] = useState([]);
  const [tipos, setTipos] = useState([]);
  const [subcategorias, setCategorias] = useState([]);
  const [modificadores, setModificadores] = useState([]); // objetos completos {id, modificador, id_categoria, precio}

  const toast = useRef(null);

  const API_URL = `${import.meta.env.VITE_API_URL}pc/INSERT.php`;

  useEffect(() => {
    if (id_emisor) setFormData((prev) => ({ ...prev, id_emisor }));
  }, [id_emisor]);

  useEffect(() => {
    if (!id_emisor) return;

    const cargarCatalogos = async () => {
      setLoadingData(true);
      try {
        const [resAlmacen, resTipo, resCategoria, resModificadores] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URL}catalogos/alm/GET.php?id_emisor=${id_emisor}`),
          axios.get(`${import.meta.env.VITE_API_URL}catalogos/tpc/GET.php?id_emisor=${id_emisor}`),
          axios.get(`${import.meta.env.VITE_API_URL}catalogos/sc/GET.php?id_emisor=${id_emisor}`),
          axios.get(`${import.meta.env.VITE_API_URL}catalogos/md/GET.php?id_emisor=${id_emisor}`),
        ]);

        if (Array.isArray(resAlmacen.data))
          setAlmacenes(resAlmacen.data.map((m) => ({ label: m.descripcion, value: m.id })));

        if (Array.isArray(resTipo.data))
          setTipos(resTipo.data.map((m) => ({ label: m.tipo, value: m.id })));

        if (Array.isArray(resCategoria.data))
          setCategorias(resCategoria.data.map((m) => ({ label: m.subcategoria, value: m.id })));

        // Guardamos el objeto completo para poder agrupar y sumar precios
        if (Array.isArray(resModificadores.data))
          setModificadores(resModificadores.data);
      } catch (error) {
        console.error("Error al cargar catálogos:", error);
        toast.current?.show({ severity: "error", summary: "Error", detail: "Error al cargar catálogos", life: 3000 });
      } finally {
        setLoadingData(false);
      }
    };

    cargarCatalogos();
  }, [id_emisor]);

  // Agrupa los modificadores por id_categoria, ordenados, con nombre de categoría
  const modificadoresPorCategoria = useMemo(() => {
    const grupos = {};
    modificadores.forEach((m) => {
      const cat = m.id_categoria ?? 0;
      if (!grupos[cat]) grupos[cat] = [];
      grupos[cat].push(m);
    });

    return Object.keys(grupos)
      .sort((a, b) => Number(a) - Number(b))
      .map((cat) => ({
        id_categoria: Number(cat),
        nombre: CATEGORIA_LABELS[cat] || "Sin categoria",
        items: grupos[cat],
      }));
  }, [modificadores]);


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNumberChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDropdownChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleModificadorToggle = (id) => {
    setFormData((prev) => {
      const yaSeleccionado = prev.id_modificadores.includes(id);
      return {
        ...prev,
        id_modificadores: yaSeleccionado
          ? prev.id_modificadores.filter((m) => m !== id)
          : [...prev.id_modificadores, id],
      };
    });
  };

  const isFormValid = () => {
    return formData.producto?.trim();
  };

  const handleSubmit = async () => {
    setSubmitted(true);

    if (!isFormValid()) {
      toast.current.show({ severity: "warn", summary: "Validación", detail: "Complete los campos requeridos", life: 3000 });
      return;
    }

    try {
      setLoading(true);

      // Un solo POST: el backend guarda el producto y sus modificadores en una transacción
      const response = await axios.post(
        API_URL,
        { ...formData, precio: formData.precio ?? 0 },
        { headers: { "Content-Type": "application/json" } }
      );

      if (!response.data.success) {
        toast.current.show({ severity: "error", summary: "Error", detail: response.data.error || "Error desconocido", life: 3000 });
        return;
      }

      toast.current.show({ severity: "success", summary: "Éxito", detail: "Registro agregado correctamente ✅", life: 3000 });
      if (onSuccess) onSuccess();
    } catch {
      toast.current.show({ severity: "error", summary: "Error", detail: "Error de red", life: 3000 });
    } finally {
      setLoading(false);
    }
  };

  if (!id_emisor) return null;

  return (
    <div className="p-fluid">
      <Toast ref={toast} />
      <Card className="mb-3">
        <div className="grid">
          {/* Producto */}
          <div className="col-12">
            <div className="field">
              <label className="font-bold block">Producto <span className="text-red-500">*</span></label>
              <InputText
                name="producto"
                value={formData.producto}
                onChange={handleChange}
                className={classNames("w-full", { "p-invalid": submitted && !formData.producto?.trim() })}
              />
              {submitted && !formData.producto?.trim() && (
                <small className="p-error block">El producto es requerido</small>
              )}
            </div>
          </div>

          {/* Precio */}
          <div className="col-12 md:col-4">
            <div className="field">
              <label className="font-bold block">Precio</label>
              <InputNumber
                value={formData.precio}
                onValueChange={(e) => handleNumberChange("precio", e.value)}
                mode="currency"
                currency="USD"
                locale="en-US"
                className="w-full"
              />
            </div>
          </div>

          {/* Precio Desc */}
          <div className="col-12 md:col-4">
            <div className="field">
              <label className="font-bold block">Precio Desc.</label>
              <InputNumber
                value={formData.precio_desc}
                onValueChange={(e) => handleNumberChange("precio_desc", e.value)}
                mode="currency"
                currency="USD"
                locale="en-US"
                className="w-full"
              />
            </div>
          </div>

          {/* Costo de Compra */}
          <div className="col-12 md:col-4">
            <div className="field">
              <label className="font-bold block">Costo de Compra</label>
              <InputNumber
                value={formData.costo_compra}
                onValueChange={(e) => handleNumberChange("costo_compra", e.value)}
                mode="currency"
                currency="USD"
                locale="en-US"
                className="w-full"
              />
            </div>
          </div>

          {/* Descripcion */}
          <div className="col-12 md:col-8">
            <div className="field">
              <label className="font-bold block">Descripción <span className="text-red-500">*</span></label>
              <InputText
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                className={classNames("w-full", { "p-invalid": submitted && !formData.descripcion?.trim() })}
              />
            </div>
          </div>

          {/* F. Unitario */}
          <div className="col-12 md:col-4">
            <div className="field">
              <label className="font-bold block">F. Unitario</label>
              <InputNumber
                value={formData.factor_unitario}
                onValueChange={(e) => handleNumberChange("factor_unitario", e.value)}
                className="w-full"
              />
            </div>
          </div>

          {/* Almacen */}
          <div className="col-12 md:col-4">
            <div className="field">
              <label className="font-bold block">Almacén</label>
              <Dropdown
                value={formData.id_almacen}
                options={almacenes}
                onChange={(e) => handleDropdownChange("id_almacen", e.value)}
                placeholder={loadingData ? "Cargando..." : "Seleccione un almacén"}
                className="w-full"
                disabled={loadingData}
                showClear
              />
            </div>
          </div>

          {/* Tipo */}
          <div className="col-12 md:col-4">
            <div className="field">
              <label className="font-bold block">Tipo</label>
              <Dropdown
                value={formData.id_tipo}
                options={tipos}
                onChange={(e) => handleDropdownChange("id_tipo", e.value)}
                placeholder={loadingData ? "Cargando..." : "Seleccione un tipo"}
                className="w-full"
                disabled={loadingData}
                showClear
              />
            </div>
          </div>

          {/* Subcategoria */}
          <div className="col-12 md:col-4">
            <div className="field">
              <label className="font-bold block">Subcategoria</label>
              <Dropdown
                value={formData.id_subcategoria}
                options={subcategorias}
                onChange={(e) => handleDropdownChange("id_subcategoria", e.value)}
                placeholder={loadingData ? "Cargando..." : "Seleccione una subcategoria"}
                className="w-full"
                disabled={loadingData}
                showClear
              />
            </div>
          </div>

          {/* Modificadores agrupados por categoría */}
          <div className="col-12">
            <div className="field">
              <label className="font-bold block">Modificadores</label>

              {loadingData ? (
                <small className="text-500">Cargando modificadores...</small>
              ) : modificadoresPorCategoria.length === 0 ? (
                <small className="text-500">No hay modificadores disponibles</small>
              ) : (
                modificadoresPorCategoria.map((grupo, idx) => (
                  <div key={grupo.id_categoria}>
                    {idx > 0 && <Divider />}
                    <span className="font-semibold text-600 block mb-2">{grupo.nombre}</span>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {grupo.items.map((m) => {
                        const seleccionado = formData.id_modificadores.includes(m.id);
                        return (
                          <div
                            key={m.id}
                            onClick={() => handleModificadorToggle(m.id)}
                            className={classNames(
                              "flex align-items-center gap-2 px-3 py-2 border-round cursor-pointer select-none transition-colors transition-duration-150",
                              {
                                "bg-primary border-1 border-primary": seleccionado,
                                "surface-100 border-1 border-300 hover:surface-200": !seleccionado,
                              }
                            )}
                            style={{ minWidth: "120px" }}
                          >
                            {seleccionado && <i className="pi pi-check text-sm" />}
                            <span className="text-sm">{m.modificador}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Imagen */}
          <div className="col-12">
            <div className="field">
              <label className="font-bold block">Imagen del producto</label>
              <FileUpload
                mode="basic"
                accept="image/*"
                maxFileSize={5000000}
                chooseLabel="Seleccionar imagen"
                className="w-full"
                auto={false}
                customUpload
                onSelect={(e) => {
                  const file = e.files[0];
                  if (!file) return;

                  const reader = new FileReader();
                  reader.onloadend = () => {
                    const base64 = reader.result.split(",")[1];
                    setFormData((prev) => ({
                      ...prev,
                      txt_img: base64,
                      nombre_img: file.name,
                      txt_img_nueva: URL.createObjectURL(file),
                    }));
                  };
                  reader.readAsDataURL(file);
                }}
              />

              {formData.txt_img_nueva && (
                <div className="mt-2">
                  <img
                    src={formData.txt_img_nueva}
                    alt="Preview"
                    style={{ maxHeight: "120px", borderRadius: "6px", objectFit: "cover" }}
                  />
                  <small className="text-500 block mt-1">Imagen seleccionada</small>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Botones */}
        <div className="flex justify-content-end mt-4 gap-2">
          {onCancel && (
            <Button label="Cancelar" icon="pi pi-times" className="p-button-secondary" onClick={onCancel} disabled={loading} />
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