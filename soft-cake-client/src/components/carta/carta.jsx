import { useState, useEffect } from "react";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Sidebar } from "primereact/sidebar";
import Categorias from "./categorias";
import Subcategorias from "./subcategorias";
import Productos from "./producto";
import Orden from "./orden";

// Breakpoints: móvil < 768, tablet 768-1024, desktop > 1024
function useWindowWidth() {
  const [width, setWidth] = useState(window.innerWidth);
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return width;
}

function Carta() {
  const [stack, setStack]                                 = useState([]);
  const [todasLasSubcategorias, setTodasLasSubcategorias] = useState([]);
  const [productoSeleccionado, setProductoSeleccionado]   = useState(null);
  const [dialogVisible, setDialogVisible]                 = useState(false);
  const [ordenItems, setOrdenItems]                       = useState([]);
  const [ordenVisible, setOrdenVisible]                   = useState(false); // para drawer

  const width       = useWindowWidth();
  const isDesktop   = width >= 1024;
  const nivelActual = stack.length;
  const actual      = stack[stack.length - 1] || null;
  const totalItems  = ordenItems.length;

  const handleSelectCategoria = (id, label) => {
  setTodasLasSubcategorias([]);
  setStack([{ id_categoria: id, label }]);
};

  const handleSelectProducto = (producto) => {
    setProductoSeleccionado(producto);
    setDialogVisible(true);
  };

  const handleRegresar = () => {
    setStack(prev => prev.slice(0, -1));
  };

  const handleAgregar = (item) => {
  if (item) {
    const nuevosItems = [];
    const cantidad = item.cantidad ?? 1;

    for (let i = 0; i < cantidad; i++) {
      const grupoId = `${Date.now()}-${i}`;   // string único por grupo

      nuevosItems.push({
        id:          `${grupoId}-P`,
        id_prod:     item.id_prod_carta,
        importe:     Number(item.precio),
        precio_desc: item.precio_desc != null ? Number(item.precio_desc) : null, // ← solo para leer en Orden
        tipo:        "P",
        _label:      item.producto,
        _grupo:      grupoId
      });

      item.complementos?.forEach((comp, ci) => {
        nuevosItems.push({
          id:      `${grupoId}-C-${ci}`,
          id_prod: comp.value,
          importe: Number(comp.importe),
          tipo:    "C",
          _label:  comp.label,
          _grupo:  grupoId
        });
      });

      item.modificadores?.forEach((mod, mi) => {
        nuevosItems.push({
          id:      `${grupoId}-M-${mi}`,
          id_prod: mod.value,
          importe: 0,
          tipo:    "M",
          _label:  mod.label,
          _grupo:  grupoId
        });
      });
    }

    setOrdenItems(prev => [...prev, ...nuevosItems]);
  }
  setDialogVisible(false);
};

  const handleEliminarItem = (id) => setOrdenItems(prev => prev.filter(i => i.id !== id));
  const handleLimpiarOrden = () => setOrdenItems([]);

  const ordenPanel = (
    <Orden
      items={ordenItems}
      onEliminar={handleEliminarItem}
      onLimpiar={handleLimpiarOrden}
      onOrdenEnviada={handleLimpiarOrden}
    />
  );

  return (
    <div style={{ display: "flex", height: "100%", position: "relative" }}>

      {/* ── Panel carta ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Breadcrumb + botón orden en móvil/tablet */}
        <div className="flex align-items-center justify-content-between px-2 pt-2">
          <div className="flex align-items-center gap-2">
            {nivelActual > 0 && (
              <Button icon="pi pi-arrow-left" text rounded onClick={handleRegresar} />
            )}
            <span className="text-sm text-500">
              {stack.map((s, i) => (
                <span key={i}>
                  {i > 0 && <span className="mx-1">›</span>}
                  {s.label}
                </span>
              ))}
            </span>
          </div>

          {/* Botón flotante carrito — solo en móvil/tablet */}
          {!isDesktop && (
            <Button
              icon="pi pi-shopping-cart"
              rounded
              style={{ background: "rgba(196,130,60,1)", border: "none", position: "relative" }}
              onClick={() => setOrdenVisible(true)}
              badge={totalItems > 0 ? String(totalItems) : undefined}
              badgeClassName="p-badge-danger"
            />
          )}
        </div>

        {/* Contenido */}
        <div style={{ flex: 1, overflow: "hidden" }}>
          {nivelActual === 0 ? (
            <Categorias onSelect={handleSelectCategoria} />
          ) : (
            <Subcategorias
              id_categoria={actual.id_categoria}
              todasLasSubcategorias={todasLasSubcategorias}
              onDataLoaded={setTodasLasSubcategorias}
              onSelect={handleSelectProducto}
            />
          )}
        </div>
      </div>

      {/* ── Panel lateral fijo — solo desktop ── */}
      {isDesktop && (
        <div style={{
          width: "420px",
          borderLeft: "1px solid rgba(0,0,0,0.1)",
          display: "flex",
          flexDirection: "column",
          height: "100%"
        }}>
          {ordenPanel}
        </div>
      )}

      {/* ── Drawer — móvil/tablet ── */}
      {!isDesktop && (
        <Sidebar
          visible={ordenVisible}
          position="right"
          onHide={() => setOrdenVisible(false)}
          style={{ width: "min(340px, 92vw)" }}
          header={
            <div className="flex align-items-center gap-2">
              <i className="pi pi-shopping-cart" style={{ color: "rgba(196,130,60,1)" }} />
              <span className="font-bold">Orden</span>
            </div>
          }
        >
          {ordenPanel}
        </Sidebar>
      )}

      {/* ── Dialog producto ── */}
      <Dialog
        visible={dialogVisible}
        onHide={() => setDialogVisible(false)}
        header={productoSeleccionado?.producto}
        style={{ width: "min(600px, 96vw)" }}
        modal
        draggable={false}
        resizable={false}
      >
        <Productos
          productoSeleccionado={productoSeleccionado}
          onAgregar={handleAgregar}
        />
      </Dialog>

    </div>
  );
}

export default Carta;