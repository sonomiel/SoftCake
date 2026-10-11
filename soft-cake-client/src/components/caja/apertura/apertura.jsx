import React from "react";
import { Toast } from "primereact/toast";
import Abierta from "./abierta";

function Apertura() {
  return (
    <div className="p-fluid">
      {/* ✅ Abierta verifica si hay caja:
          - Si puede abrir → muestra el formulario
          - Si ya tiene caja → muestra el mensaje con los datos */}
      <Abierta />
    </div>
  );
}

export default Apertura;
