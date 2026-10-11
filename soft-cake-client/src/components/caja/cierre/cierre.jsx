import { useState } from "react";
import Formulario from "./formulario";
import Lista from "./lista";
import Tabla from "./tabla";

function Cierre() {
    const [selected, setSelected] = useState(null);
    const [saldoFinal, setSaldoFinal] = useState(0);
    const [refreshKey, setRefreshKey] = useState(0);
    const [fechaCierre, setFechaCierre] = useState(null); // ✅ Nuevo estado

    const handleSelect = (row) => {
        setSelected(row);
        setSaldoFinal(0);
        // ✅ Guardar la fecha de cierre si existe
        setFechaCierre(row?.fecha_cierre || null);
    };

    const handleSuccess = () => {
        setRefreshKey(prev => prev + 1);
        setSelected(null);
        setSaldoFinal(0);
        setFechaCierre(null);
    };

    return (
        <div className="grid nested-grid">
            <div className="col-12">
                <Formulario
                    id={selected?.id}
                    importe={saldoFinal}
                    onSuccess={handleSuccess}
                    fechaCierreExistente={fechaCierre} // ✅ Pasar fecha de cierre
                />
            </div>
            <div className="col-12">
                <div className="grid">
                    <div className="col-6">
                        <Tabla
                            onSelect={handleSelect}
                            refreshKey={refreshKey}
                        />
                    </div>
                    <div className="col-6">
                        {selected ? (
                            <Lista
                                id={selected.id}
                                onSaldoCalculado={setSaldoFinal}
                            />
                        ) : (
                            <div className="flex justify-content-center align-items-center p-5 text-500">
                                <i className="pi pi-arrow-left mr-2" />
                                Selecciona un registro
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Cierre;