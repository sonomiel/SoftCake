import { useRef } from "react";
import Tabla from "./tabla";
import { MODULOS } from "../constants/permisos";
import { usePermisos } from "../context/permisoscontext";
// import Ordenes from "./ordenes/ordenes";

function Receta() {
    const { tieneModulo } = usePermisos();

    // ✅ Ref para llamar reloadData de Ordenes desde Tabla
    const ordenesRef = useRef(null);

    const handleReloadOrdenes = () => {
        ordenesRef.current?.reloadData();
    };

    return (
        <>
            <Tabla onReloadOrdenes={handleReloadOrdenes} />

        {/*
            {tieneModulo(MODULOS.AREA_PRODUCCION) && (
                <Ordenes ref={ordenesRef} />
            )}
        */}
        </>
    );
}

export default Receta;
