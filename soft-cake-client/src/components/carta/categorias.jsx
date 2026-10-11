import { useEffect, useState } from "react";
import { Ripple } from "primereact/ripple";
import { Button } from "primereact/button";
import axios from "axios";
import { useAuth } from "../context/useAuth";

const TOTAL_ITEMS = 16;

function Categorias({ onSelect }) {
  const { usuario } = useAuth();
  const id_emisor = usuario?.id_emisor || "";

  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagina, setPagina] = useState(0);

  useEffect(() => {
    if (!id_emisor) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const API_URL = `${import.meta.env.VITE_API_URL}catalogos/cat/GET.php?id_emisor=${id_emisor}`;
        const response = await axios.get(API_URL);
        const filtrado = response.data.filter(item => item.estatus === 1);
        setCategorias(filtrado);
        setPagina(0);
      } catch (error) {
        console.error("Error al obtener categorias:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id_emisor]);

  if (loading) {
    return (
      <div className="flex justify-content-center align-items-center" style={{ height: "200px" }}>
        <i className="pi pi-spin pi-spinner text-4xl" />
      </div>
    );
  }

  const totalPaginas = Math.ceil(categorias.length / TOTAL_ITEMS);
  const inicio = pagina * TOTAL_ITEMS;
  const categoriasPagina = categorias.slice(inicio, inicio + TOTAL_ITEMS);
  const tarjetas = [...Array(TOTAL_ITEMS)].map((_, i) => categoriasPagina[i] || null);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
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
              border: item ? "1px solid rgba(196,130,60,0.3)" : "1px dashed rgba(0,0,0,0.15)",
              transition: "all 0.2s"
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = item ? "rgba(196,130,60,0.2)" : "rgba(0,0,0,0.06)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = item ? "rgba(196,130,60,0.1)" : "rgba(0,0,0,0.03)";
            }}
            // Manda id Y label para el breadcrumb
            onClick={() => item && onSelect(item.id, item.categoria)}
          >
            <span className="font-bold text-center px-2" style={{ fontSize: "0.85rem", color: item ? "inherit" : "#aaa" }}>
              {item ? item.categoria : "Vacío"}
            </span>
            {item && <span className="text-500 text-xs mt-1">ID: {item.id}</span>}
            <Ripple />
          </div>
        ))}
      </div>

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

export default Categorias;
