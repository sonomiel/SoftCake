import { useState } from "react";
import Filtro from "./filtro";
import Tabla from "./tabla";
import { useAuth } from "../context/useAuth";

function Inventario() {
  const { usuario } = useAuth();
  const id_emisor = usuario?.id_emisor || "";
  const [inventario, setInventario] = useState("1");
  const [seleccion, setSeleccion] = useState("1");

  return (
    <>
      <Filtro
        inventario={inventario}
        setInventario={setInventario}
        seleccion={seleccion}
        setSeleccion={setSeleccion}
      />
      {id_emisor && (
        <Tabla
          inventario={inventario}
          seleccion={seleccion}
          id_emisor={id_emisor}      // ← prop directo
        />
      )}
    </>
  );
}

export default Inventario;
