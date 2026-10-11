import { Button } from "primereact/button";
import { Divider } from "primereact/divider";
import { Tag } from "primereact/tag";

function Detalles({ cs, onClose }) {

  const Campo = ({ icono, etiqueta, valor }) => (
    <div className="flex flex-column gap-1">
      <span className="text-xs text-500 font-semibold uppercase flex align-items-center gap-1">
        <i className={`pi ${icono} text-xs`}></i>
        {etiqueta}
      </span>
      <span className="text-900 font-medium">
        {valor || <span className="text-400 font-normal">—</span>}
      </span>
    </div>
  );

  return (
    <div className="p-2">

      {/* Encabezado con logo y datos principales */}
      <div className="flex align-items-center gap-4 mb-4 p-3 border-round surface-50">
        {cs.logo_empresa ? (
          <img
            src={cs.logo_empresa}
            alt="Logo empresa"
            style={{ width: "72px", height: "72px", objectFit: "contain", borderRadius: "8px", border: "1px solid var(--surface-200)" }}
          />
        ) : (
          <div
            className="flex align-items-center justify-content-center surface-200 border-round"
            style={{ width: "72px", height: "72px" }}
          >
            <i className="pi pi-building text-3xl text-400"></i>
          </div>
        )}

        <div className="flex flex-column gap-1">
          <span className="text-2xl font-bold text-900">{cs.nombre}</span>
          <span className="text-500">{cs.nombre_comercial}</span>
          <div className="flex align-items-center gap-2 mt-1">
            <Tag value={cs.rfc} severity="info" icon="pi pi-id-card" />
            <Tag value={`Régimen ${cs.regimen_fiscal}`} severity="warning" icon="pi pi-briefcase" />
          </div>
        </div>
      </div>

      <Divider align="left">
        <span className="text-sm font-semibold text-500 uppercase">
          <i className="pi pi-map-marker mr-2"></i>Dirección
        </span>
      </Divider>

      <div className="grid mb-3">
        <div className="col-12 md:col-6">
          <Campo icono="pi-home" etiqueta="Dirección Matriz" valor={cs.dir_matriz} />
        </div>
        <div className="col-12 md:col-6">
          <Campo icono="pi-building" etiqueta="Dirección Sucursal" valor={cs.dir_sucursal} />
        </div>
        <div className="col-6 md:col-3">
          <Campo icono="pi-hashtag" etiqueta="Núm. Exterior" valor={cs.num_exterior !== 0 ? cs.num_exterior : "—"} />
        </div>
        <div className="col-6 md:col-3">
          <Campo icono="pi-hashtag" etiqueta="Núm. Interior" valor={cs.num_interior !== 0 ? cs.num_interior : "—"} />
        </div>
        <div className="col-6 md:col-3">
          <Campo icono="pi-envelope" etiqueta="Código Postal" valor={cs.cp} />
        </div>
        <div className="col-6 md:col-3">
          <Campo icono="pi-envelope" etiqueta="CP Lugar Expedición" valor={cs.cp_lugar_expedicion} />
        </div>
      </div>

      <Divider align="left">
        <span className="text-sm font-semibold text-500 uppercase">
          <i className="pi pi-globe mr-2"></i>Ubicación
        </span>
      </Divider>

      <div className="grid mb-4">
        <div className="col-12 md:col-4">
          <Campo icono="pi-map" etiqueta="Colonia" valor={cs.colonia} />
        </div>
        <div className="col-12 md:col-4">
          <Campo icono="pi-map" etiqueta="Localidad" valor={cs.localidad} />
        </div>
        <div className="col-12 md:col-4">
          <Campo icono="pi-map" etiqueta="Ciudad" valor={cs.ciudad} />
        </div>
        <div className="col-12 md:col-6">
          <Campo icono="pi-map" etiqueta="Estado" valor={cs.estado} />
        </div>
        <div className="col-12 md:col-6">
          <Campo icono="pi-globe" etiqueta="País" valor={cs.pais} />
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-content-end pt-2 border-top-1 surface-border">
        <Button
          label="Cerrar"
          icon="pi pi-times"
          className="p-button-text"
          onClick={onClose}
        />
      </div>

    </div>
  );
}

export default Detalles;
