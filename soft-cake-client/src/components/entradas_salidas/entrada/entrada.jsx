import { useState, useRef } from "react";
import { SelectButton } from "primereact/selectbutton";
import Insumos from "./insumos";
import Productos_carta from "./productos_carta"; 
import Productos from "./productos";

const opciones = [
  { label: "Insumo",   value: "insumo"   },
  { label: "Producto", value: "producto" }
];

function Entrada() {
  const [tipo, setTipo]     = useState("insumo");
  const [lista, setLista]   = useState([]);
  const encabezadoRef       = useRef();

  const handleAgregarItem = (item) => {
    setLista(prev => [...prev, { ...item, _key: Date.now() }]);
  };

  return (
    <div className="grid m-2">

      {/* Selector tipo */}
      <div className="col-12 flex justify-content-center mb-2">
        <SelectButton
          value={tipo}
          options={opciones}
          onChange={e => {
            if (e.value) {
              setTipo(e.value);
              setLista([]); // limpia lista al cambiar tipo
            }
          }}
        />
      </div>

      {/* Componente según tipo */}
      <div className="col-12">
        {tipo === "insumo" ? (
          <Insumos onAgregarItem={handleAgregarItem} ref={encabezadoRef} />
        ) : (
          <Productos_carta onAgregarItem={handleAgregarItem} ref={encabezadoRef} />
        )}
      </div>

      <div className="col-12">
        <Productos
          lista={lista}
          setLista={setLista}
          tipo={tipo}
          onGuardadoExitoso={() => {
            if (tipo === "insumo") {
              encabezadoRef.current?.recargarInsumos();
            } else {
              encabezadoRef.current?.recargarProductos_carta();
            }
          }}
        />
      </div>

    </div>
  );
}

export default Entrada;