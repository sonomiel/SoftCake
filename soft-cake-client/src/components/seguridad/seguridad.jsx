import React, { useState } from "react";
import { TabMenu } from "primereact/tabmenu";
import Roles from "./roles/roles";
import Permisos from "./permisos/permisos";
import Modulos from "./modulos/modulos";

function Seguridad() {
  const [activeIndex, setActiveIndex] = useState(0);

  const items = [
    { label: "Roles", icon: "pi pi-users" },
    { label: "Permisos", icon: "pi pi-lock" },
    { label: "Módulos", icon: "pi pi-list" },
  ];

  const renderContent = () => {
    switch (activeIndex) {
      case 0:
        return <Roles />;
      case 1:
        return <Permisos />;
      case 2:
        return <Modulos />;
      default:
        return null;
    }
  };

  return (
    <div className="card">
      <h3 className="mb-3 font-bold text-lg">Seguridad del Sistema</h3>
      <TabMenu
        model={items}
        activeIndex={activeIndex}
        onTabChange={(e) => setActiveIndex(e.index)}
      />

      <div className="mt-4">{renderContent()}</div>
    </div>
  );
}

export default Seguridad;
