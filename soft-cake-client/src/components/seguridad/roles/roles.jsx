import React, { useState } from "react";
import { TabMenu } from "primereact/tabmenu";
import Tabla from "./tabla";
import RolPermiso from "./rol_permiso/rolpermiso";
import RolModulo from "./rol_modulo/rolmodulo";
import RolUsuario from "./rol_usuario/rolusuario";

function Roles() {
  const [activeIndex, setActiveIndex] = useState(0);

  const items = [
    { label: "Roles", icon: "pi pi-user" },
    { label: "Rol-Permiso", icon: "pi pi-lock" },
    { label: "Rol-Módulo", icon: "pi pi-list" },
    { label: "Rol-Usuario", icos: "pi pi-users"}
  ];

  const renderContent = () => {
    switch (activeIndex) {
      case 0:
        return <Tabla />;
      case 1:
        return <RolPermiso />;
      case 2:
        return <RolModulo />;
      case 3: 
        return <RolUsuario />;
      default:
        return null;
    }
  };

  return (
    <div className="card">
      <TabMenu
        model={items}
        activeIndex={activeIndex}
        onTabChange={(e) => setActiveIndex(e.index)}
      />

      <div className="mt-4">{renderContent()}</div>
    </div>
  );
}

export default Roles;
