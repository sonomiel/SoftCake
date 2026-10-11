import axios from "axios";
import { useEffect, useRef, useState } from "react";
import { InputNumber } from "primereact/inputnumber";
import { useAuth } from "../context/useAuth";
import { Toast } from "primereact/toast";
import { MultiSelect } from 'primereact/multiselect';

function Recetas({ value, onChange }) {
    const { usuario } = useAuth();
    const id_emisor = usuario?.id_emisor || null;
    const [loading, setLoading] = useState(false);
    const [rcp, setRcp] = useState([]);
    const toast = useRef(null);

    useEffect(() => {
        if (!id_emisor) return;
        cargarDatos();
    }, [id_emisor]);

    const cargarDatos = async () => {
        try {
            setLoading(true);
            const [resRcp] = await Promise.all([
                axios.get(`${import.meta.env.VITE_API_URL}rcp/GET.php?id_emisor=${id_emisor}`),
            ]);
            setRcp(
                resRcp.data
                    ?.filter(item => item.id_tipo_prod === 2)
                    ?.map(item => ({ label: item.clave, value: item.id })) ?? []
            );
        } catch (err) {
            console.error("Error al cargar datos: ", err);
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: 'Error al cargar datos',
                life: 3000
            });
        } finally {
            setLoading(false);
        }
    };

    // ids actualmente seleccionados (para el value del MultiSelect)
    const idsSeleccionados = value.map(v => v.id_prod);

    const handleSelectChange = (nuevosIds) => {
        const nuevoValue = nuevosIds.map(id_prod => {
            const existente = value.find(v => v.id_prod === id_prod);
            return existente ?? { id_prod, cantidad: 1 };
        });
        onChange(nuevoValue);
    };

    const handleCantidadChange = (id_prod, cantidad) => {
        onChange(value.map(v => v.id_prod === id_prod ? { ...v, cantidad: cantidad ?? 1 } : v));
    };

    return (
        <>
            <Toast ref={toast} />

            <MultiSelect
                value={idsSeleccionados}
                onChange={(e) => handleSelectChange(e.value)}
                options={rcp}
                placeholder={loading ? "Cargando..." : "Seleccione una subreceta"}
                className="w-full"
                filter
            />

            {value.length > 0 && (
                <div className="flex flex-column gap-2 mt-2">
                    {value.map(({ id_prod, cantidad }) => {
                        const opt = rcp.find(o => o.value === id_prod);
                        return (
                            <div key={id_prod} className="flex align-items-center justify-content-between gap-2 px-2 py-1"
                                style={{ border: "1px solid #ddd", borderRadius: 6 }}>
                                <span className="text-sm">{opt?.label ?? id_prod}</span>
                                <div className="flex align-items-center gap-2">
                                    <label className="text-xs text-500">Cantidad</label>
                                    <InputNumber
                                        value={cantidad}
                                        onValueChange={(e) => handleCantidadChange(id_prod, e.value)}
                                        min={1}
                                        showButtons
                                        buttonLayout="horizontal"
                                        decrementButtonClassName="p-button-secondary"
                                        incrementButtonClassName="p-button-secondary"
                                        incrementButtonIcon="pi pi-plus"
                                        decrementButtonIcon="pi pi-minus"
                                        style={{ width: "8rem" }}
                                        inputStyle={{ width: "3rem", textAlign: "center" }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </>
    );
}
export default Recetas;