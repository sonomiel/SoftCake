import { Button } from "primereact/button";

function BtnRegresar({ onBack }) {
  return (
    <Button
      label="Regresar"
      icon="pi pi-arrow-left"
      className="p-button-text p-button-secondary mb-3"
      onClick={onBack}
    />
  );
}

export default BtnRegresar;