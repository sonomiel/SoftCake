import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useAuth } from '../../context/useAuth';

function Lista({ id, onSaldoCalculado }) {
    const { usuario } = useAuth();
    const [desglose, setDesglose] = useState([]);
    const [resumen, setResumen]   = useState([]);
    const [loading, setLoading]   = useState(false);
    const printRef = useRef(null);

    useEffect(() => {
        if (!id) return;
        const fetchData = async () => {
            setLoading(true);
            try {
                const API_URL = `${import.meta.env.VITE_API_URL}cie/GET_ITEMS.php?id=${id}`;
                const response = await axios.get(API_URL);

                const desglose = response.data.desglose ?? [];
                const resumen  = response.data.resumen  ?? [];

                setDesglose(desglose);
                setResumen(resumen);

                const saldo = resumen[0]?.saldo_final ?? 0;
                onSaldoCalculado && onSaldoCalculado(saldo);
            } catch (error) {
                console.error("Error:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    // ✅ Función para formatear números con comas
    const fmt = (n) => {
        const num = Number(n);
        if (isNaN(num)) return '$0.00';
        return '$' + num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    };

    // ✅ Función para formatear números sin signo (para salidas)
    const fmtNumber = (n) => {
        const num = Number(n);
        if (isNaN(num)) return '0.00';
        return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    };

    // Función para imprimir en formato ticket térmico
    const handlePrint = () => {
        if (printRef.current) {
            const printContents = printRef.current.innerHTML;
            
            const printWindow = window.open('', '_blank', 'width=400,height=600');
            
            printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Corte de Caja #${id}</title>
                    <style>
                        @page {
                            size: 80mm auto;
                            margin: 0;
                        }
                        * {
                            margin: 0;
                            padding: 0;
                            box-sizing: border-box;
                        }
                        
                        body {
                            font-family: 'Courier New', 'Lucida Console', monospace;
                            background: white;
                            padding: 0;
                            margin: 0;
                            width: 80mm;
                            margin: 0 auto;
                            font-size: 12px;
                            line-height: 1.3;
                        }
                        
                        .ticket {
                            padding: 8px 10px;
                            background: white;
                        }
                        
                        .ticket-header {
                            text-align: center;
                            border-bottom: 1px dashed #000;
                            padding-bottom: 8px;
                            margin-bottom: 8px;
                        }
                        
                        .ticket-title {
                            font-size: 16px;
                            font-weight: bold;
                            letter-spacing: 3px;
                            text-transform: uppercase;
                        }
                        
                        .ticket-subtitle {
                            font-size: 11px;
                            color: #333;
                            margin-top: 2px;
                        }
                        
                        .ticket-divider {
                            border: none;
                            border-top: 1px dashed #000;
                            margin: 6px 0;
                        }
                        
                        .ticket-row {
                            display: flex;
                            justify-content: space-between;
                            padding: 2px 0;
                            font-size: 11px;
                        }
                        
                        .ticket-row-indent {
                            padding-left: 10px;
                        }
                        
                        .ticket-section-title {
                            font-weight: bold;
                            font-size: 11px;
                            text-transform: uppercase;
                            letter-spacing: 1px;
                            border-bottom: 1px solid #000;
                            padding-bottom: 3px;
                            margin-bottom: 4px;
                            margin-top: 6px;
                        }
                        
                        .ticket-total {
                            font-weight: bold;
                            font-size: 13px;
                            border-top: 1px dashed #000;
                            padding-top: 5px;
                            margin-top: 5px;
                        }
                        
                        .ticket-footer {
                            text-align: center;
                            border-top: 1px dashed #000;
                            padding-top: 8px;
                            margin-top: 8px;
                            font-size: 10px;
                            color: #555;
                        }
                        
                        .text-green { color: #2e7d32; }
                        .text-red { color: #c62828; }
                        .text-muted { color: #666; }
                        .font-bold { font-weight: bold; }
                        .text-center { text-align: center; }
                        
                        .compact {
                            padding: 2px 0;
                        }
                        
                        @media print {
                            body {
                                width: 80mm;
                                padding: 0;
                                margin: 0;
                            }
                            .no-print { display: none !important; }
                            .ticket {
                                padding: 5px 8px;
                            }
                        }
                        
                        @media screen {
                            body {
                                background: #f5f5f5;
                                padding: 20px;
                            }
                            .ticket {
                                background: white;
                                border: 1px solid #ddd;
                                border-radius: 4px;
                                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                            }
                        }
                    </style>
                </head>
                <body>
                    <div class="ticket">
                        ${printContents}
                    </div>
                    <script>
                        window.onload = function() {
                            setTimeout(function() {
                                window.print();
                                setTimeout(function() {
                                    window.close();
                                }, 1000);
                            }, 300);
                        };
                    <\/script>
                </body>
                </html>
            `);
            
            printWindow.document.close();
        }
    };

    if (!id) return (
        <div className="flex justify-content-center align-items-center p-5 text-500">
            <i className="pi pi-arrow-left mr-2" />
            Selecciona un registro
        </div>
    );

    if (loading) return (
        <div className="flex justify-content-center align-items-center p-5">
            <i className="pi pi-spin pi-spinner text-4xl mr-2" />
        </div>
    );

    // Agrupar desglose por tipo
    const grupos = desglose.reduce((acc, r) => {
        if (!acc[r.tipo]) acc[r.tipo] = { label: r.tipo_label, items: [] };
        acc[r.tipo].items.push(r);
        return acc;
    }, {});

    const saldoInicial = resumen[0]?.saldo_inicial ?? 0;
    const totalEntradas = resumen[0]?.total_entradas ?? 0;
    const totalSalidas = resumen[0]?.total_salidas ?? 0;
    const saldoFinal = resumen[0]?.saldo_final ?? 0;
    const salidas = resumen.filter(r => r.tipo_item === "S");

    return (
        <div style={{ maxWidth: '80mm', margin: "0 auto" }}>
            {/* Botón de impresión */}
            <div style={{ textAlign: "center", marginBottom: 10 }} className="no-print">
                <button
                    onClick={handlePrint}
                    style={{
                        padding: "12px 30px",
                        backgroundColor: "#2563eb",
                        color: "white",
                        border: "none",
                        borderRadius: 8,
                        cursor: "pointer",
                        fontSize: 16,
                        fontWeight: 600,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 10,
                        boxShadow: "0 2px 8px rgba(37, 99, 235, 0.3)"
                    }}
                >
                    <i className="pi pi-print" />
                    Imprimir Ticket
                </button>
            </div>

            {/* Contenido del ticket (oculto, solo para impresión) */}
            <div ref={printRef} style={{ display: 'none' }}>
                {/* ===== TICKET ===== */}
                
                {/* Encabezado */}
                <div className="ticket-header">
                    <div className="ticket-title">🧾 CORTE</div>
                    <div className="ticket-subtitle">Cierre #{id}</div>
                    <div className="ticket-subtitle">
                        {new Date().toLocaleDateString("es-MX", { 
                            day: '2-digit', 
                            month: '2-digit', 
                            year: '2-digit' 
                        })} {new Date().toLocaleTimeString("es-MX", { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                        })}
                    </div>
                    <div className="ticket-subtitle">Usr: {usuario?.username || 'N/A'}</div>
                </div>

                {/* Saldo Inicial */}
                <div className="ticket-row font-bold">
                    <span>SALDO INICIAL</span>
                    <span>{fmt(saldoInicial)}</span>
                </div>

                <hr className="ticket-divider" />

                {/* Grupos: Órdenes y Pedidos */}
                {Object.values(grupos).map((grupo, gi) => (
                    <div key={gi}>
                        <div className="ticket-section-title">{grupo.label}</div>
                        {grupo.items.map((r, i) => (
                            <div key={i} className="ticket-row ticket-row-indent">
                                <span>{r.metodo_pago}</span>
                                <span>{fmt(r.total)}</span>
                            </div>
                        ))}
                        <div className="ticket-row font-bold" style={{ borderTop: '1px dotted #ccc', paddingTop: 3, marginTop: 3 }}>
                            <span>TOTAL {grupo.label}</span>
                            <span>{fmt(grupo.items.reduce((acc, r) => acc + Number(r.total), 0))}</span>
                        </div>
                        {gi < Object.values(grupos).length - 1 && <hr className="ticket-divider" />}
                    </div>
                ))}

                {/* Salidas */}
                {salidas.length > 0 && (
                    <>
                        <hr className="ticket-divider" />
                        <div className="ticket-section-title">SALIDAS</div>
                        {salidas.map((r, i) => (
                            <div key={i} className="ticket-row ticket-row-indent">
                                <span>{r.descripcion}</span>
                                <span className="text-red">-{fmt(r.importe)}</span>
                            </div>
                        ))}
                        <div className="ticket-row font-bold" style={{ borderTop: '1px dotted #ccc', paddingTop: 3, marginTop: 3 }}>
                            <span>TOTAL SALIDAS</span>
                            <span className="text-red">-{fmt(totalSalidas)}</span>
                        </div>
                    </>
                )}

                <hr className="ticket-divider" />

                {/* Totales */}
                <div className="ticket-row">
                    <span className="text-muted">ENTRADAS</span>
                    <span className="text-green">{fmt(totalEntradas)}</span>
                </div>
                <div className="ticket-row">
                    <span className="text-muted">SALIDAS</span>
                    <span className="text-red">-{fmt(totalSalidas)}</span>
                </div>
                <div className="ticket-row ticket-total">
                    <span>SALDO FINAL</span>
                    <span className={saldoFinal >= 0 ? 'text-green' : 'text-red'}>
                        {fmt(saldoFinal)}
                    </span>
                </div>

                {/* Footer */}
                <div className="ticket-footer">
                    <div>─ fin del ticket ─</div>
                    <div style={{ marginTop: 3, fontSize: 9 }}>
                        Gracias por su preferencia
                    </div>
                    <div style={{ marginTop: 2, fontSize: 8, color: '#999' }}>
                        {new Date().toLocaleString("es-MX")}
                    </div>
                </div>
            </div>

            {/* Vista previa en pantalla (estilo ticket) */}
            <div style={{ 
                background: "white",
                border: "1px solid #ddd",
                borderRadius: 8,
                padding: "12px 14px",
                fontFamily: "'Courier New', monospace",
                fontSize: 12,
                maxWidth: '80mm',
                margin: "0 auto",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
            }}>
                {/* Header */}
                <div style={{ textAlign: "center", borderBottom: "1px dashed #ccc", paddingBottom: 8, marginBottom: 8 }}>
                    <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: 2 }}>🧾 CORTE</div>
                    <div style={{ fontSize: 11, color: "#666" }}>Cierre #{id}</div>
                    <div style={{ fontSize: 11, color: "#666" }}>
                        {new Date().toLocaleDateString("es-MX")} {new Date().toLocaleTimeString("es-MX", { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div style={{ fontSize: 11, color: "#666" }}>Usr: {usuario?.username || 'N/A'}</div>
                </div>

                {/* Saldo inicial */}
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 600, padding: "2px 0" }}>
                    <span>SALDO INICIAL</span>
                    <span>{fmt(saldoInicial)}</span>
                </div>

                <hr style={{ border: "none", borderTop: "1px dashed #ccc", margin: "4px 0" }} />

                {/* Grupos */}
                {Object.values(grupos).map((grupo, gi) => (
                    <div key={gi} style={{ marginTop: 4 }}>
                        <div style={{ fontWeight: 700, fontSize: 11, textTransform: "uppercase", borderBottom: "1px solid #000", paddingBottom: 2, marginBottom: 3 }}>
                            {grupo.label}
                        </div>
                        {grupo.items.map((r, i) => (
                            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "1px 0 1px 10px", fontSize: 11 }}>
                                <span>{r.metodo_pago}</span>
                                <span>{fmt(r.total)}</span>
                            </div>
                        ))}
                        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 600, borderTop: "1px dotted #ccc", paddingTop: 3, marginTop: 3 }}>
                            <span>TOTAL {grupo.label}</span>
                            <span>{fmt(grupo.items.reduce((acc, r) => acc + Number(r.total), 0))}</span>
                        </div>
                        {gi < Object.values(grupos).length - 1 && <hr style={{ border: "none", borderTop: "1px dashed #ccc", margin: "4px 0" }} />}
                    </div>
                ))}

                {/* Salidas */}
                {salidas.length > 0 && (
                    <>
                        <hr style={{ border: "none", borderTop: "1px dashed #ccc", margin: "4px 0" }} />
                        <div style={{ fontWeight: 700, fontSize: 11, textTransform: "uppercase", borderBottom: "1px solid #000", paddingBottom: 2, marginBottom: 3 }}>
                            SALIDAS
                        </div>
                        {salidas.map((r, i) => (
                            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "1px 0 1px 10px", fontSize: 11 }}>
                                <span>{r.descripcion}</span>
                                <span style={{ color: "#c62828" }}>-{fmt(r.importe)}</span>
                            </div>
                        ))}
                        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 600, borderTop: "1px dotted #ccc", paddingTop: 3, marginTop: 3 }}>
                            <span>TOTAL SALIDAS</span>
                            <span style={{ color: "#c62828" }}>-{fmt(totalSalidas)}</span>
                        </div>
                    </>
                )}

                <hr style={{ border: "none", borderTop: "1px dashed #ccc", margin: "4px 0" }} />

                {/* Totales */}
                <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 0" }}>
                    <span style={{ color: "#666" }}>ENTRADAS</span>
                    <span style={{ color: "#2e7d32" }}>{fmt(totalEntradas)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 0" }}>
                    <span style={{ color: "#666" }}>SALIDAS</span>
                    <span style={{ color: "#c62828" }}>-{fmt(totalSalidas)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 13, borderTop: "1px dashed #ccc", paddingTop: 5, marginTop: 4 }}>
                    <span>SALDO FINAL</span>
                    <span style={{ color: saldoFinal >= 0 ? "#2e7d32" : "#c62828" }}>
                        {fmt(saldoFinal)}
                    </span>
                </div>

                {/* Footer */}
                <div style={{ textAlign: "center", borderTop: "1px dashed #ccc", paddingTop: 6, marginTop: 6, fontSize: 10, color: "#666" }}>
                    <div>─ fin del ticket ─</div>
                    <div style={{ marginTop: 2, fontSize: 9 }}>Gracias por su preferencia</div>
                </div>
            </div>
        </div>
    );
}

export default Lista;