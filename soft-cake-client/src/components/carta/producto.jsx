import { useState, useEffect } from "react";
import { Button } from "primereact/button";
import Complementos from "./complementos";
import Modificadores from "./modificadores";

function Productos({ productoSeleccionado, onAgregar }) {
  const [complementos, setComplementos]   = useState([]); // [{ value, label, importe }]
  const [modificadores, setModificadores] = useState([]); // [{ value, label }]

  useEffect(() => {
    setComplementos([]);
    setModificadores([]);
  }, [productoSeleccionado]);

  if (!productoSeleccionado) return null;

  const precioBase          = Number(productoSeleccionado.precio);
  const importeComplementos = complementos.reduce((acc, c) => acc + Number(c.importe), 0);
  const subtotal            = (precioBase + importeComplementos);

  return (
    <div className="flex flex-column gap-3">

      <div className="flex justify-content-between align-items-center">
        <span className="text-500 text-sm">{productoSeleccionado.descripcion}</span>
        <span className="font-bold text-xl" style={{ color: "rgba(196,130,60,1)" }}>
          $ {precioBase.toFixed(2)}
        </span>
      </div>

      <Complementos
        id_prod_carta={productoSeleccionado.id_prod_carta}
        onSeleccionChange={setComplementos}
      />

      <Modificadores
        id_prod_carta={productoSeleccionado.id_prod_carta}
        onSeleccionChange={setModificadores}
      />

      <div className="flex flex-column gap-1">
        {importeComplementos > 0 && (
          <div className="flex justify-content-between text-xs text-500">
            <span>Complementos</span>
            <span>+$ {importeComplementos.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-content-between text-sm text-500">
          <span>Subtotal</span>
          <span className="font-bold" style={{ color: "rgba(196,130,60,1)" }}>
            $ {subtotal.toFixed(2)}
          </span>
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <Button
          label="Cancelar"
          icon="pi pi-times"
          outlined
          severity="secondary"
          className="flex-1"
          onClick={() => onAgregar(null)}
        />
        <Button
          label="Agregar"
          icon="pi pi-shopping-cart"
          className="flex-1"
          style={{ background: "rgba(196,130,60,1)", border: "none" }}
          onClick={() => onAgregar({
            ...productoSeleccionado,
            complementos,   // array completo con label e importe
            modificadores   // array completo con label
          })}
        />
      </div>

    </div>
  );
}

export default Productos;