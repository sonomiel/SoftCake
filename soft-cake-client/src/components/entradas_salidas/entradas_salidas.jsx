import React, { useState } from 'react'; 
import { TabMenu } from 'primereact/tabmenu';
import Entrada from "./entrada/entrada.jsx";
import Salida from "./salida/salida.jsx";

function Entradas_salidas() {
  const [activeIndex, setActiveIndex] = useState(0);
    
  const items = [
    { label: 'Entradas', icon: 'pi pi-arrow-down' },
    { label: 'Salidas', icon: 'pi pi-arrow-up-right' },
  ];

  return (
    <div className="card">
      <TabMenu
        model={items}
        activeIndex={activeIndex}
        onTabChange={(e) => setActiveIndex(e.index)}
      />

      <div className="mt-4">
        <div style={{ display: activeIndex === 0 ? "block" : "none" }}>
          <Entrada />
        </div>
        <div style={{ display: activeIndex === 1 ? "block" : "none" }}>
          <Salida />
        </div>
      </div>
    </div>
  );
}

export default Entradas_salidas;