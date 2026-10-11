import { useState } from "react";
import BtnRegresar from "../btnregresar";
import Agregar from "./agregar";
import Items from "../item";

function Complementos({ onBack }) {
  const [selectedId, setSelectedId] = useState(null);

  return (
    <div style={{ display: "flex", height: "calc(100vh - 80px)" }}>

      {/* Panel izquierdo */}
      <div style={{ width: "33%", display: "flex", flexDirection: "column", padding: "1rem" }}>
        <BtnRegresar onBack={onBack} />
        <div style={{ flex: 1, overflow: "hidden", marginTop: "1rem", height: "100%" }}>
          <Agregar id_prod_carta={selectedId} />
        </div>
      </div>

      {/* Panel derecho — Items */}
      <div style={{ width: "67%", overflowY: "auto" }}>
        <Items onSelect={setSelectedId} selectedId={selectedId} />
      </div>

    </div>
  );
}

export default Complementos;