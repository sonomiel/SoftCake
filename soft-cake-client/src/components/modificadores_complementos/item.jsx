import { useEffect, useState } from "react";
import { Ripple } from "primereact/ripple";
import { Button } from "primereact/button";
import axios from "axios";
import { useAuth } from "../context/useAuth";

const TOTAL_ITEMS = 16;

function Items({ onSelect, selectedId }) {
  const { usuario } = useAuth();
  const id_emisor = usuario?.id_emisor || "";

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagina, setPagina] = useState(0);

  useEffect(() => {
    if (!id_emisor) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const API_URL = `${import.meta.env.VITE_API_URL}pc/GET_PC.php?id_emisor=${id_emisor}`;
        const response = await axios.get(API_URL);
        const filtrado = response.data.filter(item => item.estatus === 1);
        setItems(filtrado);
        setPagina(0); // reset al recargar
      } catch (error) {
        console.error("Error al obtener items:", error);
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

  const totalPaginas = Math.ceil(items.length / TOTAL_ITEMS);
  const inicio = pagina * TOTAL_ITEMS;
  const itemsPagina = items.slice(inicio, inicio + TOTAL_ITEMS);
  const tarjetas = [...Array(TOTAL_ITEMS)].map((_, i) => itemsPagina[i] || null);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>

      {/* Grid de productos */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gridTemplateRows: "repeat(4, 1fr)",
        gap: "0.5rem",
        flex: 1,
        padding: "0.5rem"
      }}>
        {tarjetas.map((item, i) => {
          const isSelected = item && selectedId === item.id;
          return (
            <div
              key={i}
              className="p-ripple flex flex-column align-items-center justify-content-center border-round-lg cursor-pointer"
              style={{
                background: isSelected
                  ? "rgba(196,130,60,0.35)"
                  : item ? "rgba(196,130,60,0.1)" : "rgba(0,0,0,0.03)",
                border: isSelected
                  ? "2px solid rgba(196,130,60,0.8)"
                  : item ? "1px solid rgba(196,130,60,0.3)" : "1px dashed rgba(0,0,0,0.15)",
                transition: "all 0.2s"
              }}
              onMouseEnter={e => {
                if (!isSelected) e.currentTarget.style.background = item ? "rgba(196,130,60,0.2)" : "rgba(0,0,0,0.06)";
              }}
              onMouseLeave={e => {
                if (!isSelected) e.currentTarget.style.background = item ? "rgba(196,130,60,0.1)" : "rgba(0,0,0,0.03)";
              }}
              onClick={() => item && onSelect(item.id)}
            >
              <span className="font-bold text-center px-2" style={{ fontSize: "0.85rem", color: item ? "inherit" : "#aaa" }}>
                {item ? item.producto : "Vacío"}
              </span>
              {item && <span className="text-500 text-xs mt-1">ID: {item.id}</span>}
              <Ripple />
            </div>
          );
        })}
      </div>

      {/* Paginación — solo aparece si hay más de 16 productos */}
      {totalPaginas > 1 && (
        <div className="flex justify-content-center align-items-center gap-3 py-2">
          <Button
            icon="pi pi-chevron-left"
            text
            rounded
            onClick={() => setPagina(p => p - 1)}
            disabled={pagina === 0}
          />
          <span className="text-sm text-500">
            {pagina + 1} / {totalPaginas}
          </span>
          <Button
            icon="pi pi-chevron-right"
            text
            rounded
            onClick={() => setPagina(p => p + 1)}
            disabled={pagina === totalPaginas - 1}
          />
        </div>
      )}

    </div>
  );
}

export default Items;
