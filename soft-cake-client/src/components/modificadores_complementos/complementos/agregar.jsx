import { useEffect, useRef, useState } from "react";
import { Checkbox } from 'primereact/checkbox';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { InputText } from 'primereact/inputtext';
import { useAuth } from "../../context/useAuth";
import axios from "axios";

function Agregar({ onSuccess, onCancel, id_prod_carta }) {
    const { usuario } = useAuth();
    const id_emisor = usuario?.id_emisor || null;

    const [formData, setFormData] = useState({
        id_prod_carta: null,
        id_complementos: [],
        id_emisor: id_emisor
    });

    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(false);
    const [loadingAsignados, setLoadingAsignados] = useState(false);
    const [productos, setProductos] = useState([]);
    const [busqueda, setBusqueda] = useState("");

    const toast = useRef(null);

    const API_URL = `${import.meta.env.VITE_API_URL}comp_c/INSERT.php`;

    useEffect(() => {
        if (id_emisor) setFormData(prev => ({ ...prev, id_emisor }));
    }, [id_emisor]);

    // Cargar todos los complementoes disponibles
    useEffect(() => {
        if (!id_emisor) return;
        const cargarDatos = async () => {
            setLoadingData(true);
            try {
                const res = await axios.get(`${import.meta.env.VITE_API_URL}catalogos/comp/GET.php?id_emisor=${id_emisor}`);
                if (Array.isArray(res.data))
                    setProductos(res.data
                        .filter(m => m.estatus === 1)
                        .map(m => ({ label: m.complemento, value: m.id }))
                    );
            } catch (error) {
                toast.current?.show({ severity: "error", summary: "Error", detail: "Error al cargar catálogos", life: 3000 });
            } finally {
                setLoadingData(false);
            }
        };
        cargarDatos();
    }, [id_emisor]);

    // Cuando se selecciona un item, consultar sus complementoes asignados
    useEffect(() => {
        if (!id_prod_carta || !id_emisor) {
            setFormData(prev => ({ ...prev, id_prod_carta: null, id_complementos: [] }));
            return;
        }

        const cargarAsignados = async () => {
            setLoadingAsignados(true);
            try {
                const res = await axios.get(
                    `${import.meta.env.VITE_API_URL}comp_c/GET.php?id_prod_carta=${id_prod_carta}&id_emisor=${id_emisor}`
                );
                const asignados = Array.isArray(res.data)
                    ? res.data.map(m => m.id_complemento ?? m.id)
                    : [];
                setFormData(prev => ({
                    ...prev,
                    id_prod_carta,
                    id_complementos: asignados
                }));
            } catch (error) {
                toast.current?.show({ severity: "error", summary: "Error", detail: "Error al cargar asignados", life: 3000 });
            } finally {
                setLoadingAsignados(false);
            }
        };

        cargarAsignados();
    }, [id_prod_carta, id_emisor]);

        const productosFiltrados = productos.filter(p =>
            p.label.toLowerCase().includes(busqueda.toLowerCase())
        );

    const handleCheckbox = (value) => {
        setFormData(prev => {
            const ya = prev.id_complementos.includes(value);
            return {
                ...prev,
                id_complementos: ya
                    ? prev.id_complementos.filter(v => v !== value)
                    : [...prev.id_complementos, value]
            };
        });
    };

    const handleSubmit = async () => {
        if (!formData.id_prod_carta) {
            toast.current.show({ severity: "warn", summary: "Validación", detail: "Seleccione un producto primero", life: 3000 });
            return;
        }
        if (formData.id_complementos.length === 0) {
            toast.current.show({ severity: "warn", summary: "Validación", detail: "Seleccione al menos un complemento", life: 3000 });
            return;
        }
        try {
            setLoading(true);
            const response = await axios.post(API_URL, formData, {
                headers: { "Content-Type": "application/json" }
            });
            if (response.data.success) {
                toast.current.show({ severity: "success", summary: "Éxito", detail: "Guardado correctamente ✅", life: 3000 });
                if (onSuccess) onSuccess();
            } else {
                toast.current.show({ severity: "error", summary: "Error", detail: response.data.error || "Error desconocido", life: 3000 });
            }
        } catch (error) {
            toast.current.show({ severity: "error", summary: "Error", detail: "Error de red", life: 3000 });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-fluid" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
            <Toast ref={toast} />

            {!id_prod_carta && (
                <div className="flex align-items-center gap-2 p-3 border-round mb-3"
                    style={{ background: "rgba(196,130,60,0.08)", border: "1px dashed rgba(196,130,60,0.4)" }}>
                    <i className="pi pi-info-circle" style={{ color: "rgba(196,130,60,0.8)" }} />
                    <span className="text-sm text-500">Selecciona un producto para ver sus complementoe</span>
                </div>
            )}

            <div className="field">
                <label className="font-bold block mb-3">Complementos</label>

                <div className="p-inputgroup mb-3">
                    <span className="p-inputgroup-addon">
                        <i className="pi pi-search" />
                    </span>
                    <InputText
                        placeholder="Buscar complemento..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                    />
                    {busqueda && (
                        <Button
                            icon="pi pi-times"
                            className="p-button-text p-button-sm"
                            onClick={() => setBusqueda("")}
                        />
                    )}
                </div>

                {loadingData || loadingAsignados ? (
                    <div className="flex align-items-center justify-content-center gap-2" 
                        style={{ height: "450px" }}>
                        <i className="pi pi-spin pi-spinner" />
                        <span>Cargando...</span>
                    </div>
                ) : (
                    <div className="grid" style={{ height: "450px", alignContent: "flex-start" }}>
                        {productosFiltrados.map(p => (
                            <div key={p.value} className="col-12">
                                <div
                                    className="flex align-items-center gap-2 p-2 border-round cursor-pointer"
                                    style={{
                                        background: formData.id_complementos.includes(p.value)
                                            ? "rgba(196,130,60,0.1)" : "transparent",
                                        border: "1px solid rgba(196,130,60,0.2)",
                                        transition: "background 0.2s",
                                        opacity: !id_prod_carta ? 0.5 : 1
                                    }}
                                >
                                    <Checkbox
                                        inputId={`mod_${p.value}`}
                                        value={p.value}
                                        checked={formData.id_complementos.includes(p.value)}
                                        onChange={() => handleCheckbox(p.value)}
                                        disabled={!id_prod_carta}
                                    />
                                    <label htmlFor={`mod_${p.value}`} className="cursor-pointer w-full">
                                        {p.label}
                                    </label>
                                </div>
                            </div>
                        ))}

                        {productosFiltrados.length === 0 && (
                            <div className="col-12">
                                <span className="text-500">
                                    {busqueda ? "No se encontraron complementoes" : "No hay complementoes disponibles"}
                                </span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="flex justify-content-end mt-4 gap-2"
                style={{ position: "sticky", bottom: 0, background: "#fff", paddingTop: "0.5rem" }}>
                {onCancel && (
                    <Button label="Cancelar" icon="pi pi-times" className="p-button-secondary" onClick={onCancel} disabled={loading} />
                )}
                <Button
                    label={loading ? "Guardando..." : "Guardar"}
                    className="p-button-success"
                    onClick={handleSubmit}
                    disabled={loading || !id_prod_carta}
                />
            </div>
        </div>
    );
}

export default Agregar;