import { useEffect, useState } from "react";
import { Ripple } from "primereact/ripple";
import { Button } from "primereact/button";
import axios from "axios";

const TOTAL_ITEMS = 16;

function Subcategorias({ id_categoria, todasLasSubcategorias, onDataLoaded, onSelect }) {
  const [loading, setLoading]     = useState(false);
  const [pagina, setPagina]       = useState(0);
  // historial: array de id_subcategoria visitados (0 = raíz)
  const [historial, setHistorial] = useState([0]);

  const padreActual = historial[historial.length - 1];

  // ── Fetch inicial ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!id_categoria) return;
    if (todasLasSubcategorias.length > 0) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const API_URL = `${import.meta.env.VITE_API_URL}catalogos/cat/GET_SC.php?id_categoria=${id_categoria}`;
        const response = await axios.get(API_URL);
        onDataLoaded(response.data);
      } catch (error) {
        console.error("Error al obtener subcategorias:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id_categoria]);

  // Reset al cambiar categoría raíz
  useEffect(() => {
    setHistorial([0]);
    setPagina(0);
  }, [id_categoria]);

  // Reset paginación al navegar
  useEffect(() => {
    setPagina(0);
  }, [historial]);

  // ── Derivar items ──────────────────────────────────────────────────────────

  // Subcategorías únicas cuyo id_padre === padreActual
const subcategoriasHijas = [
  ...new Map(
    todasLasSubcategorias
      .filter(item => item.id_padre === padreActual && item.id_padre !== item.id_subcategoria)
      .map(item => [
        item.id_subcategoria,
        { id_subcategoria: item.id_subcategoria, subcategoria: item.subcategoria }
      ])
  ).values()
];


  // Productos de la subcategoría activa (cuando no hay más hijos)
const productos = todasLasSubcategorias.filter(
  item => item.id_subcategoria === padreActual && item.id_prod_carta !== null
);

  // Si no hay subcategorías hijas → mostrar productos
const mostrandoProductos = subcategoriasHijas.length === 0;
const items = mostrandoProductos ? productos : subcategoriasHijas;

  const totalPaginas = Math.ceil(items.length / TOTAL_ITEMS);
  const inicio       = pagina * TOTAL_ITEMS;
  const tarjetas     = [...Array(TOTAL_ITEMS)].map((_, i) => items.slice(inicio, inicio + TOTAL_ITEMS)[i] || null);

  // ── Label del nivel actual para el botón regresar ─────────────────────────
  const labelActual = todasLasSubcategorias.find(
    item => item.id_subcategoria === padreActual
  )?.subcategoria ?? null;

  const labelPadre = historial.length > 1
    ? (todasLasSubcategorias.find(
        item => item.id_subcategoria === historial[historial.length - 2]
      )?.subcategoria ?? "inicio")
    : null;

  // ── Navegación ─────────────────────────────────────────────────────────────
  const handleClick = (item) => {
    if (!item) return;

    if (mostrandoProductos) {
      onSelect(item);
      return;
    }

    // Bajar a los hijos de esta subcategoría
    setHistorial(prev => [...prev, item.id_subcategoria]);
  };

  const handleRegresar = () => {
    if (historial.length <= 1) return;
    setHistorial(prev => prev.slice(0, -1));
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex justify-content-center align-items-center" style={{ height: "200px" }}>
        <i className="pi pi-spin pi-spinner text-4xl" />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>

      {/* Botón regresar */}
      {historial.length > 1 && (
        <div className="flex align-items-center gap-2 px-2 pt-2">
          <Button
            icon="pi pi-arrow-left"
            label={`Regresar a ${labelPadre}`}
            text
            size="small"
            onClick={handleRegresar}
          />
          <span className="text-600 font-semibold text-sm">
            {labelActual}
          </span>
        </div>
      )}

      {/* Grid 4x4 */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gridTemplateRows: "repeat(4, 1fr)",
        gap: "0.5rem",
        flex: 1,
        padding: "0.5rem"
      }}>
        {tarjetas.map((item, i) => (
          <div
            key={i}
            className="p-ripple flex flex-column align-items-center justify-content-center border-round-lg cursor-pointer"
            style={{
              background: item ? "rgba(196,130,60,0.1)" : "rgba(0,0,0,0.03)",
              border: item
                ? "1px solid rgba(196,130,60,0.3)"
                : "1px dashed rgba(0,0,0,0.15)",
              transition: "all 0.2s"
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = item ? "rgba(196,130,60,0.2)" : "rgba(0,0,0,0.06)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = item ? "rgba(196,130,60,0.1)" : "rgba(0,0,0,0.03)";
            }}
            onClick={() => handleClick(item)}
          >
            <span
              className="font-bold text-center px-2"
              style={{ fontSize: "0.85rem", color: item ? "inherit" : "#aaa" }}
            >
              {item
                ? (mostrandoProductos ? item.producto : item.subcategoria)
                : "Vacío"}
            </span>

            {item && mostrandoProductos && (
              <span className="text-500 text-xs mt-1">
                $ {Number(item.precio).toFixed(2)}
              </span>
            )}

            <Ripple />
          </div>
        ))}
      </div>

      {/* Paginación */}
      {totalPaginas > 1 && (
        <div className="flex justify-content-center align-items-center gap-3 py-2">
          <Button icon="pi pi-chevron-left" text rounded onClick={() => setPagina(p => p - 1)} disabled={pagina === 0} />
          <span className="text-sm text-500">{pagina + 1} / {totalPaginas}</span>
          <Button icon="pi pi-chevron-right" text rounded onClick={() => setPagina(p => p + 1)} disabled={pagina === totalPaginas - 1} />
        </div>
      )}
    </div>
  );
}

export default Subcategorias;
