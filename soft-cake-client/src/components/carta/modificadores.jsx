import { useEffect, useRef, useState } from "react";
import { Checkbox } from 'primereact/checkbox';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { InputText } from 'primereact/inputtext';
import { useAuth } from "../context/useAuth";
import axios from "axios";

function Modificadores({ id_prod_carta, onSeleccionChange, defaultValue = [] }) {
    const { usuario } = useAuth();
    const id_emisor = usuario?.id_emisor || null;

    const [loading, setLoading]             = useState(false);
    const [catalogo, setCatalogo]           = useState([]); // solo los del producto
    const [seleccionados, setSeleccionados] = useState([]);
    const [busqueda, setBusqueda]           = useState("");
    const toast = useRef(null);

    useEffect(() => {
        if (!id_prod_carta || !id_emisor) {
            setCatalogo([]);
            setSeleccionados([]);
            return;
        }

        const cargar = async () => {
            setLoading(true);
            try {
                const res = await axios.get(
                    `${import.meta.env.VITE_API_URL}md_c/GET.php?id_emisor=${id_emisor}&id_prod_carta=${id_prod_carta}`
                );
                if (Array.isArray(res.data)) {
                    setCatalogo(res.data.map(m => ({
                        label: m.modificador,
                        value: m.id_modificador ?? m.id
                    })));
                    // ← Inicializar con los valores del pedido
                    setSeleccionados(defaultValue.map(m => m.value));
                }
            } catch {
                toast.current?.show({ severity: "error", summary: "Error", detail: "Error al cargar modificadores", life: 3000 });
            } finally {
                setLoading(false);
            }
        };
        cargar();
    }, [id_prod_carta, id_emisor]);

    useEffect(() => {
        const seleccionadosCompletos = catalogo.filter(c => seleccionados.includes(c.value));
        onSeleccionChange?.(seleccionadosCompletos); // [{ label, value }]
    }, [seleccionados, catalogo]);

    const handleCheckbox = (value) => {
        setSeleccionados(prev =>
            prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
        );
    };

    const filtrados = catalogo.filter(p =>
        p.label.toLowerCase().includes(busqueda.toLowerCase())
    );

    if (!id_prod_carta) return null;

    return (
        <div className="p-fluid">
            <Toast ref={toast} />

            <div className="field">
                <label className="font-bold block mb-3">Modificadores</label>

                <div className="p-inputgroup mb-3">
                    <span className="p-inputgroup-addon"><i className="pi pi-search" /></span>
                    <InputText
                        placeholder="Buscar modificador..."
                        value={busqueda}
                        onChange={e => setBusqueda(e.target.value)}
                    />
                    {busqueda && (
                        <Button icon="pi pi-times" className="p-button-text p-button-sm" onClick={() => setBusqueda("")} />
                    )}
                </div>

                {loading ? (
                    <div className="flex align-items-center justify-content-center gap-2" style={{ height: "100px" }}>
                        <i className="pi pi-spin pi-spinner" /><span>Cargando...</span>
                    </div>
                ) : (
                    <div className="grid" style={{ maxHeight: "200px", overflowY: "auto", alignContent: "flex-start" }}>
                        {filtrados.map(p => (
                            <div key={p.value} className="col-12">
                                <div
                                    className="flex align-items-center gap-2 p-2 border-round cursor-pointer"
                                    style={{
                                        background: seleccionados.includes(p.value) ? "rgba(196,130,60,0.1)" : "transparent",
                                        border: "1px solid rgba(196,130,60,0.2)",
                                        transition: "background 0.2s"
                                    }}
                                >
                                    <Checkbox
                                        inputId={`mod_${p.value}`}
                                        value={p.value}
                                        checked={seleccionados.includes(p.value)}
                                        onChange={() => handleCheckbox(p.value)}
                                    />
                                    <label htmlFor={`mod_${p.value}`} className="cursor-pointer w-full">
                                        {p.label}
                                    </label>
                                </div>
                            </div>
                        ))}
                        {filtrados.length === 0 && (
                            <div className="col-12">
                                <span className="text-500">
                                    {busqueda ? "No se encontraron modificadores" : "Este producto no tiene modificadores"}
                                </span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default Modificadores;