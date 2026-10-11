import React from "react";
import { RadioButton } from "primereact/radiobutton";
import { Card } from "primereact/card";

function Filtro({ inventario, setInventario, seleccion, setSeleccion }) {
  return (
    <div className="p-4">
      <Card className="shadow-3 mb-3">
        <div className="flex flex-column md:flex-row gap-4">

          {/* Tipo de inventario */}
          <div className="flex-1">
            <p className="font-bold mb-2">Inventario</p>
            <div className="flex flex-wrap gap-3">
              <div className="flex align-items-center">
                <RadioButton
                  inputId="inv1"
                  name="inventario"
                  value="1"
                  onChange={(e) => setInventario(e.value)}
                  checked={inventario === "1"}
                />
                <label htmlFor="inv1" className="ml-2">Insumo</label>
              </div>
              <div className="flex align-items-center">
                <RadioButton
                  inputId="inv2"
                  name="inventario"
                  value="2"
                  onChange={(e) => setInventario(e.value)}
                  checked={inventario === "2"}
                />
                <label htmlFor="inv2" className="ml-2">Productos</label>
              </div>
            </div>
          </div>

          {/* Selección de existencia */}
          <div className="flex-1">
            <p className="font-bold mb-2">Mostrar</p>
            <div className="flex flex-wrap gap-3">
              <div className="flex align-items-center">
                <RadioButton
                  inputId="sel1"
                  name="seleccion"
                  value="1"
                  onChange={(e) => setSeleccion(e.value)}
                  checked={seleccion === "1"}
                />
                <label htmlFor="sel1" className="ml-2">Todos</label>
              </div>
              <div className="flex align-items-center">
                <RadioButton
                  inputId="sel2"
                  name="seleccion"
                  value="2"
                  onChange={(e) => setSeleccion(e.value)}
                  checked={seleccion === "2"}
                />
                <label htmlFor="sel2" className="ml-2">Con existencia</label>
              </div>
              <div className="flex align-items-center">
                <RadioButton
                  inputId="sel3"
                  name="seleccion"
                  value="3"
                  onChange={(e) => setSeleccion(e.value)}
                  checked={seleccion === "3"}
                />
                <label htmlFor="sel3" className="ml-2">Sin existencia</label>
              </div>
            </div>
          </div>

        </div>
      </Card>
    </div>
  );
}

export default Filtro;
