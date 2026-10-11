import { InputText } from "primereact/inputtext";
import { Calendar } from "primereact/calendar";
import { useRef, useState, useEffect } from "react";
import { useAuth } from "../../context/useAuth";
import { InputTextarea } from "primereact/inputtextarea";
import axios from "axios";
import { Toast } from "primereact/toast";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";

function Formulario({ id, importe, onSuccess, fechaCierreExistente }) {
    const { usuario } = useAuth();
    const username = usuario?.username || "";

    const [formData, setFormData] = useState({
        id: id ?? "",
        importe: importe ?? 0,
        fecha_cierre: null,
        comentarios: ""
    });

    // ✅ Estado para saber si ya tiene fecha de cierre
    const [tieneFechaCierre, setTieneFechaCierre] = useState(false);

    // ✅ Sincronizar cuando cambia la fila seleccionada
    useEffect(() => {
        // Verificar si tiene fecha de cierre
        const hasFechaCierre = fechaCierreExistente !== null && 
                              fechaCierreExistente !== undefined && 
                              fechaCierreExistente !== "";
        
        setTieneFechaCierre(hasFechaCierre);
        
        setFormData(prev => ({
            ...prev,
            id: id ?? "",
            importe: importe ?? 0,
            fecha_cierre: hasFechaCierre ? new Date(fechaCierreExistente) : null,
            comentarios: ""
        }));
    }, [id, importe, fechaCierreExistente]);

    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const toast = useRef(null);

    const API_URL = `${import.meta.env.VITE_API_URL}cie/INSERT.php`;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const isFormValid = () => {
        return formData.id && formData.fecha_cierre && formData.importe;
    };

    const handleSubmit = async () => {
        setSubmitted(true);

        // ✅ Si ya tiene fecha de cierre, no permitir registrar
        if (tieneFechaCierre) {
            toast.current.show({
                severity: "warn",
                summary: "Ya cerrado",
                detail: "Este corte ya tiene fecha de cierre registrada",
                life: 3000
            });
            return;
        }

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
                    detail: "Cierre registrado correctamente ✅",
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
            console.error("Error al guardar cierre:", error);
            toast.current.show({
                severity: "error",
                summary: "Error",
                detail: "Error de red al guardar",
                life: 3000
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-fluid">
            <Toast ref={toast} />

            {/* ✅ Alerta si ya está cerrado */}
            {tieneFechaCierre && (
                <div className="mb-3 p-3 bg-red-100 border-round text-red-700 flex align-items-center gap-2">
                    <i className="pi pi-lock" style={{ fontSize: '1.5rem' }} />
                    <div>
                        <strong>Este corte ya está cerrado</strong>
                        <br />
                        <span className="text-sm">
                            Fecha de cierre: {new Date(fechaCierreExistente).toLocaleString("es-MX")}
                        </span>
                    </div>
                </div>
            )}

            <div className="grid" style={{ rowGap: "0.5rem" }}>

                {/* Fecha de Cierre */}
                <div className="field col-12 md:col-4">
                    <label htmlFor="fecha_cierre">Fecha de Cierre</label>
                    <Calendar
                        id="fecha_cierre"
                        name="fecha_cierre"
                        value={formData.fecha_cierre}
                        onChange={(e) => setFormData(prev => ({ ...prev, fecha_cierre: e.value }))}
                        dateFormat="dd/mm/yy"
                        showIcon
                        disabled={tieneFechaCierre} // ✅ Deshabilitar si ya está cerrado
                        className={submitted && !formData.fecha_cierre && !tieneFechaCierre ? "p-invalid" : ""}
                    />
                    {submitted && !formData.fecha_cierre && !tieneFechaCierre && (
                        <small className="p-error">Campo requerido</small>
                    )}
                    {tieneFechaCierre && (
                        <small className="text-500">Campo deshabilitado - Corte ya cerrado</small>
                    )}
                </div>

                {/* Usuario */}
                <div className="field col-12 md:col-4">
                    <label htmlFor="username">Usuario</label>
                    <InputText
                        id="username"
                        value={username}
                        disabled
                    />
                </div>

                {/* Importe — solo lectura */}
                <div className="field col-12 md:col-4">
                    <label htmlFor="importe">Importe (saldo final)</label>
                    <InputText
                        id="importe"
                        value={`$${Number(formData.importe).toFixed(2)}`}
                        disabled
                        style={{ fontWeight: 600, color: "var(--green-600)" }}
                    />
                </div>

                {/* Comentarios */}
                <div className="field col-12">
                    <label htmlFor="comentarios">Comentarios</label>
                    <InputTextarea
                        id="comentarios"
                        name="comentarios"
                        value={formData.comentarios}
                        onChange={handleChange}
                        rows={3}
                        disabled={tieneFechaCierre} // ✅ Deshabilitar si ya está cerrado
                    />
                </div>
            </div>

            <div className="flex justify-content-end mt-2 gap-2">
                <Button
                    label={loading ? "Guardando..." : "Registrar cierre"}
                    icon="pi pi-check"
                    className={tieneFechaCierre ? "p-button-secondary" : "p-button-success"}
                    onClick={handleSubmit}
                    disabled={loading || !id || tieneFechaCierre} // ✅ Deshabilitar si tiene fecha de cierre
                />
                {tieneFechaCierre && (
                    <Tag 
                        value="Cerrado" 
                        severity="danger" 
                        icon="pi pi-lock"
                        className="ml-2"
                    />
                )}
            </div>
        </div>
    );
}

export default Formulario;