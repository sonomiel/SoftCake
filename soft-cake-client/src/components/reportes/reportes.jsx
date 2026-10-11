import React, { useState } from "react";
import { TabMenu } from "primereact/tabmenu";
import Producto_utilidad from "./producto_utilidad";
import Ventas from "./ventas";

function Reportes() {

  const [activeIndex, setActiveIndex] = useState(0);

  const items = [
    { label: "Producto - Utilidad", icon: "pi pi-cart-plus" },
    { label: "Ventas", icon: "pi pi-chart-line" },
  ];

  const renderContent = () => {
    switch (activeIndex) {
      case 0:
        return <Producto_utilidad />;
      case 1:
        return <Ventas />;
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
    )
}
export default Reportes;