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
        {valor ? valor : <span className="text-400 font-normal">—</span>}
      </span>
    </div>
  );

  return (
    <div className="p-2">

      {/* Encabezado */}
      <div className="flex align-items-center gap-4 mb-4 p-3 border-round surface-50">
        <div
          className="flex align-items-center justify-content-center surface-200 border-round"
          style={{ width: "72px", height: "72px", flexShrink: 0 }}
        >
          <i className="pi pi-user text-3xl text-400"></i>
        </div>

        <div className="flex flex-column gap-1">
          <span className="text-2xl font-bold text-900">{cs.nombre}</span>
          <span className="text-500 text-sm">{cs.clave}</span>
          <div className="flex align-items-center gap-2 mt-1 flex-wrap">
            <Tag value={cs.rfc} severity="info" icon="pi pi-id-card" />
            {cs.regimen_fiscal && (
              <Tag value={`Régimen ${cs.regimen_fiscal}`} severity="warning" icon="pi pi-briefcase" />
            )}
            <Tag
              value={cs.metodo_pago || `Método ${cs.id_metodopago}`}
              severity="success"
              icon="pi pi-wallet"
            />
          </div>
        </div>
      </div>

      {/* Datos de contacto */}
      <Divider align="left">
        <span className="text-sm font-semibold text-500 uppercase">
          <i className="pi pi-phone mr-2"></i>Contacto
        </span>
      </Divider>

      <div className="grid mb-3">
        <div className="col-12 md:col-6">
          <Campo icono="pi-envelope" etiqueta="Correo Electrónico" valor={cs.correo_electronico} />
        </div>
        <div className="col-12 md:col-3">
          <Campo icono="pi-phone" etiqueta="Teléfono 1" valor={cs.telefono1} />
        </div>
        <div className="col-12 md:col-3">
          <Campo icono="pi-phone" etiqueta="Teléfono 2" valor={cs.telefono2} />
        </div>
      </div>

      {/* Datos fiscales */}
      <Divider align="left">
        <span className="text-sm font-semibold text-500 uppercase">
          <i className="pi pi-file mr-2"></i>Datos Fiscales
        </span>
      </Divider>

      <div className="grid mb-3">
        <div className="col-12 md:col-4">
          <Campo icono="pi-id-card" etiqueta="RFC" valor={cs.rfc} />
        </div>
        <div className="col-12 md:col-4">
          <Campo icono="pi-briefcase" etiqueta="Régimen Fiscal" valor={cs.regimen_fiscal} />
        </div>
        <div className="col-12 md:col-4">
          <Campo icono="pi-file-edit" etiqueta="CDFI" valor={cs.cdfi} />
        </div>
      </div>

      {/* Dirección */}
      <Divider align="left">
        <span className="text-sm font-semibold text-500 uppercase">
          <i className="pi pi-map-marker mr-2"></i>Dirección
        </span>
      </Divider>

      <div className="grid mb-3">
        <div className="col-12 md:col-8">
          <Campo icono="pi-home" etiqueta="Dirección" valor={cs.direccion} />
        </div>
        <div className="col-6 md:col-2">
          <Campo icono="pi-hashtag" etiqueta="Núm. Exterior" valor={cs.no_exterior} />
        </div>
        <div className="col-6 md:col-2">
          <Campo icono="pi-hashtag" etiqueta="Núm. Interior" valor={cs.no_interior} />
        </div>
        <div className="col-12 md:col-4">
          <Campo icono="pi-map" etiqueta="Colonia" valor={cs.colonia} />
        </div>
        <div className="col-12 md:col-4">
          <Campo icono="pi-envelope" etiqueta="Código Postal" valor={cs.codigo_postal} />
        </div>
        <div className="col-12 md:col-4">
          <Campo icono="pi-map" etiqueta="Localidad" valor={cs.localidad} />
        </div>
      </div>

      {/* Ubicación */}
      <Divider align="left">
        <span className="text-sm font-semibold text-500 uppercase">
          <i className="pi pi-globe mr-2"></i>Ubicación
        </span>
      </Divider>

      <div className="grid mb-4">
        <div className="col-12 md:col-4">
          <Campo icono="pi-map" etiqueta="Municipio" valor={cs.municipio} />
        </div>
        <div className="col-12 md:col-4">
          <Campo icono="pi-map" etiqueta="Estado / Provincia" valor={cs.estado_provincia} />
        </div>
        <div className="col-12 md:col-4">
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
