import { useState, useEffect, useRef } from "react";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { useAuth } from "../context/useAuth";
import axios from "axios";
import InfoPedido from "./editar";
import SelectorProducto from "./agregar";

const FORM_INICIAL = {
  fecha_emision:     new Date(),
  fecha_entrega:     null,
  destinatario:      "",
  direccion_entrega: "",
  id_prod:           null,
  tipo:              null,
  importe:           null,
  descripcion:       ""
};

function FormularioPedido({ pedido, modoEditar, onSuccess, onCancel }) {
  const { usuario } = useAuth();
  const id_emisor   = usuario?.id_emisor || null;

  const [formData, setFormData]     = useState(FORM_INICIAL);
  const [submitted, setSubmitted]   = useState(false);
  const [loading, setLoading]       = useState(false);
  const [complementos, setComplementos]   = useState([]);
  const [modificadores, setModificadores] = useState([]);
  const toast = useRef(null);

  useEffect(() => {
    if (modoEditar && pedido) {
      setFormData({
        fecha_emision:     new Date(pedido.fecha_emision),
        fecha_entrega:     pedido.fecha_entrega ? new Date(pedido.fecha_entrega) : null,
        destinatario:      pedido.destinatario      ?? "",
        direccion_entrega: pedido.direccion_entrega ?? "",
        id_prod:           pedido.id_prod,
        tipo:              pedido.tipo,
        importe:           pedido.importe,
        descripcion:       pedido.descripcion       ?? ""
      });
    } else {
      setFormData(FORM_INICIAL);
      setComplementos([]);
      setModificadores([]);
    }
  }, [pedido, modoEditar]);

  const isValid = () =>
    formData.fecha_emision &&
    formData.fecha_entrega &&
    formData.destinatario  &&
    formData.direccion_entrega &&
    formData.id_prod &&
    formData.importe;

  const handleGuardar = async () => {
    setSubmitted(true);
    if (!isValid()) {
      toast.current?.show({ severity: "warn", summary: "Validación", detail: "Complete todos los campos requeridos", life: 3000 });
      return;
    }
    try {
      setLoading(true);
      const toDate = (d) => d instanceof Date ? d.toLocaleDateString("en-CA") : d;

      const items = [
        { id_prod: formData.id_prod, tipo: "P", importe: formData.importe },
        ...complementos.map(c  => ({ id_prod: c.value, tipo: "C", importe: Number(c.importe) })),
        ...modificadores.map(m => ({ id_prod: m.value, tipo: "M", importe: 0 }))
      ];

      const base = {
        fecha_emision:     toDate(formData.fecha_emision),
        fecha_entrega:     toDate(formData.fecha_entrega),
        destinatario:      formData.destinatario,
        direccion_entrega: formData.direccion_entrega,
        id_emisor,
        items
      };

      if (modoEditar) {
        const res = await axios.put(`${import.meta.env.VITE_API_URL}pe/UPDATE.php`, { id: pedido.id, ...base });
        if (res.data.success) {
          toast.current?.show({ severity: "success", summary: "Actualizado", detail: "Pedido actualizado ✅", life: 2000 });
          setTimeout(onSuccess, 500);
        } else throw new Error(res.data.error);
      } else {
        const res = await axios.post(`${import.meta.env.VITE_API_URL}pe/INSERT.php`, base);
        if (res.data.success) {
          toast.current?.show({ severity: "success", summary: "Guardado", detail: "Pedido creado ✅", life: 2000 });
          setTimeout(onSuccess, 500);
        } else throw new Error(res.data.error);
      }
    } catch (e) {
      toast.current?.show({ severity: "error", summary: "Error", detail: e.message ?? "Error de red", life: 3000 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-fluid">
      <Toast ref={toast} />

      <InfoPedido
        formData={formData}
        setFormData={setFormData}
        submitted={submitted}
      />

      <SelectorProducto
        formData={formData}
        setFormData={setFormData}
        submitted={submitted}
        onComplementosChange={setComplementos}
        onModificadoresChange={setModificadores}
      />

      {/* Acciones */}
      <div className="flex gap-2 justify-content-end mt-2">
        <Button
          label="Cancelar"
          icon="pi pi-times"
          outlined severity="secondary"
          onClick={onCancel}
          type="button"
        />
        <Button
          label={modoEditar ? "Actualizar" : "Guardar"}
          icon="pi pi-check"
          style={{ background: "rgba(196,130,60,1)", border: "none" }}
          loading={loading}
          onClick={handleGuardar}
          type="button"
        />
      </div>
    </div>
  );
}

export default FormularioPedido;