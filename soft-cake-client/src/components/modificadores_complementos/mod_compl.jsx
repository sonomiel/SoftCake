import { useState } from "react";
import { Button } from "primereact/button";
import Modificadores from "./modificadores/modificadores";
import Complementos from "./complementos/complementos";

function Mod_compl() {
  const [vista, setVista] = useState(null);

  if (vista === "modificadores") return <Modificadores onBack={() => setVista(null)} />;
  if (vista === "complementos") return <Complementos onBack={() => setVista(null)} />;

  return (
    <div
    className="flex justify-content-center align-items-center gap-4"
    style={{ height: "calc(100vh - 100px)" }}
    >
        <Button
        label="Modificadores"
        icon="pi pi-sliders-h"
        className="p-button-lg p-button-outlined"
        style={{ width: "200px", height: "120px", fontSize: "1.1rem" }}
        onClick={() => setVista("modificadores")}
      />
      <Button
        label="Complementos"
        icon="pi pi-plus-circle"
        className="p-button-lg p-button-outlined p-button-success"
        style={{ width: "200px", height: "120px", fontSize: "1.1rem" }}
        onClick={() => setVista("complementos")}
      />
    </div>
  );
}

export default Mod_compl;