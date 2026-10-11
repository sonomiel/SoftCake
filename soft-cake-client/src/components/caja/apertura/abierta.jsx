import React, { useEffect, useState, useRef } from "react";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { InputNumber } from "primereact/inputnumber";
import { InputTextarea } from "primereact/inputtextarea";
import { Message } from "primereact/message";
import { Toast } from "primereact/toast";
import axios from "axios";
import { useAuth } from "../../context/useAuth";

function Abierta() {
  const { usuario } = useAuth();
  const id_usuario = usuario?.id        || null;
  const id_emisor  = usuario?.id_emisor || null;

  const [puedeAbrir, setPuedeAbrir] = useState(null);
  const [apertura,   setApertura]   = useState(null);
  const [mensaje,    setMensaje]    = useState("");
  const [loading,    setLoading]    = useState(true);

  // Estados del formulario
  const [formData,   setFormData]   = useState({ saldo_inicial: null, observaciones: "" });
  const [submitted,  setSubmitted]  = useState(false);
  const [saving,     setSaving]     = useState(false);

  const toast = useRef(null);

  const getFechaHoy = () => {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  };

  const getFechaLocal = () => {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ` +
           `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  };

  const verificarCaja = async () => {
    if (!id_usuario) return;
    setLoading(true);
    try {
      const API_URL = `${import.meta.env.VITE_API_URL}ape/GET.php` +
                      `?id_usuario=${id_usuario}&fecha=${getFechaHoy()}`;
      const response = await axios.get(API_URL);

      if (response.data.success) {
        setPuedeAbrir(response.data.puede_abrir);
        setApertura(response.data.apertura);
        setMensaje(response.data.mensaje);
      }
    } catch (error) {
      console.error("Error al verificar caja:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    verificarCaja();
  }, [id_usuario]);

  const isFormValid = () =>
    formData.saldo_inicial !== null && formData.saldo_inicial >= 0;

  const handleSubmit = async () => {
    setSubmitted(true);

    if (!isFormValid()) {
      toast.current?.show({
        severity: "warn",
        summary: "Validación",
        detail: "El saldo inicial es requerido",
        life: 3000,
      });
      return;
    }

    if (!id_emisor || !id_usuario) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "No se pudo obtener la sesión del usuario",
        life: 3000,
      });
      return;
    }

    try {
      setSaving(true);
      const payload = {
        fecha_apertura: getFechaLocal(),
        saldo_inicial:  formData.saldo_inicial,
        observaciones:  formData.observaciones,
        id_emisor,
        id_usuario,
      };

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}ape/INSERT.php`,
        payload,
        { headers: { "Content-Type": "application/json" } }
      );

      if (response.data.success) {
        toast.current?.show({
          severity: "success",
          summary: "Éxito",
          detail: "Apertura de caja registrada ✅",
          life: 3000,
        });
        // ✅ Recargar estado para mostrar el mensaje de caja abierta
        setTimeout(() => verificarCaja(), 1000);
      } else {
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: response.data.error || "Error desconocido",
          life: 3000,
        });
      }
    } catch (error) {
      console.error("Error al registrar apertura:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error de red al registrar la apertura",
        life: 3000,
      });
    } finally {
      setSaving(false);
    }
  };

  // ── Cargando ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex justify-content-center align-items-center p-5">
        <i className="pi pi-spin pi-spinner text-4xl mr-2" />
        <span>Verificando estado de caja...</span>
      </div>
    );
  }

  // ── Puede abrir — mostrar formulario ──────────────────────────────────────
  if (puedeAbrir) {
    return (
      <div className="p-4">
        <Toast ref={toast} />
        <Card title="Apertura de Caja" className="shadow-3">
          <div className="grid">

            {/* Saldo inicial */}
            <div className="col-12">
              <div className="field">
                <label htmlFor="saldo_inicial" className="font-bold block mb-1">
                  Saldo inicial <span className="text-red-500">*</span>
                </label>
                <InputNumber
                  id="saldo_inicial"
                  value={formData.saldo_inicial}
                  onValueChange={(e) =>
                    setFormData(prev => ({ ...prev, saldo_inicial: e.value }))
                  }
                  mode="currency"
                  currency="MXN"
                  locale="es-MX"
                  minFractionDigits={2}
                  min={0}
                  className={`w-full ${submitted && formData.saldo_inicial === null ? "p-invalid" : ""}`}
                  placeholder="$0.00"
                />
                {submitted && formData.saldo_inicial === null && (
                  <small className="p-error">El saldo inicial es requerido</small>
                )}
              </div>
            </div>

            {/* Observaciones */}
            <div className="col-12">
              <div className="field">
                <label htmlFor="observaciones" className="font-bold block mb-1">
                  Observaciones
                </label>
                <InputTextarea
                  id="observaciones"
                  value={formData.observaciones}
                  onChange={(e) =>
                    setFormData(prev => ({ ...prev, observaciones: e.target.value }))
                  }
                  rows={3}
                  autoResize
                  className="w-full"
                  placeholder="Notas u observaciones (opcional)"
                  maxLength={500}
                />
                <small className="text-color-secondary">
                  {formData.observaciones.length}/500
                </small>
              </div>
            </div>

          </div>

          {/* Botones */}
          <div className="flex justify-content-end mt-4 gap-2">
            <Button
              label={saving ? "Guardando..." : "Registrar Apertura"}
              icon={saving ? "pi pi-spin pi-spinner" : "pi pi-check"}
              className="p-button-success"
              onClick={handleSubmit}
              disabled={saving}
            />
          </div>
        </Card>
      </div>
    );
  }

  // ── Ya tiene caja abierta — mostrar mensaje ────────────────────────────────
  return (
    <div className="p-4">
      <Toast ref={toast} />
      <Card className="shadow-3">
        <div className="flex flex-column align-items-center gap-3 py-3">

          <i className="pi pi-lock-open text-green-500" style={{ fontSize: "3rem" }} />

          <Message
            severity="success"
            text={mensaje || "Ya tienes una caja en curso el día de hoy"}
            className="w-full"
          />

          <div className="w-full border-round border-1 surface-border p-3 surface-50">
            <div className="grid">
              <div className="col-12 md:col-6">
                <span className="font-bold">Fecha apertura: </span>
                <span>{apertura?.fecha_apertura}</span>
              </div>
              <div className="col-12 md:col-6">
                <span className="font-bold">Saldo inicial: </span>
                <span>
                  {apertura?.saldo_inicial !== undefined && apertura?.saldo_inicial !== null
                    ? new Intl.NumberFormat("es-MX", {
                        style: "currency",
                        currency: "MXN",
                      }).format(apertura.saldo_inicial)
                    : "—"}
                </span>
              </div>
              {apertura?.observaciones && (
                <div className="col-12">
                  <span className="font-bold">Observaciones: </span>
                  <span>{apertura.observaciones}</span>
                </div>
              )}
            </div>
          </div>

        </div>
      </Card>
    </div>
  );
}

export default Abierta;
