import React, { useState, useEffect } from 'react';
import { Chart } from 'primereact/chart';
import { Calendar } from 'primereact/calendar';
import { Button } from 'primereact/button';
import axios from 'axios';

export default function Producto_utilidad() {
    const [chartData, setChartData] = useState({});
    const [chartOptions, setChartOptions] = useState({});
    const [loading, setLoading] = useState(false);
    const [fechas, setFechas] = useState([null, null]);

    useEffect(() => {
        const documentStyle = getComputedStyle(document.documentElement);
        const textColor = documentStyle.getPropertyValue('--text-color');
        const textColorSecondary = documentStyle.getPropertyValue('--text-color-secondary');
        const surfaceBorder = documentStyle.getPropertyValue('--surface-border');

        setChartOptions({
            indexAxis: 'y', // barras horizontales — mejor para nombres largos
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (ctx) => {
                            if (ctx.dataset.label === 'Importe')
                                return ` $${ctx.parsed.x.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
                            return ` ${ctx.parsed.x} uds`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    ticks: { color: textColorSecondary },
                    grid: { color: surfaceBorder }
                },
                y: {
                    ticks: { color: textColor },
                    grid: { color: surfaceBorder }
                }
            }
        });
    }, []);

    const fetchData = async (inicio, fin) => {
        setLoading(true);
        try {
            const fmt = (d) => d.toISOString().split('T')[0]; // YYYY-MM-DD
            const API_URL = `${import.meta.env.VITE_API_URL}rep/GET_PROD_UTI.php?fecha_inicio=${fmt(inicio)}&fecha_fin=${fmt(fin)}`;
            const response = await axios.get(API_URL);
            const data = response.data;

            const documentStyle = getComputedStyle(document.documentElement);

            setChartData({
                labels: data.map(r => r.producto),
                datasets: [
                    {
                        label: 'Cantidad',
                        data: data.map(r => r.cantidad_vendida),
                        backgroundColor: documentStyle.getPropertyValue('--blue-400'),
                        borderRadius: 4,
                    },
                    {
                        label: 'Importe',
                        data: data.map(r => r.total_importe),
                        backgroundColor: documentStyle.getPropertyValue('--green-400'),
                        borderRadius: 4,
                    }
                ]
            });
        } catch (error) {
            console.error("Error al obtener datos:", error);
        } finally {
            setLoading(false);
        }
    };

    // Carga inicial: mes actual
    useEffect(() => {
        const hoy = new Date();
        const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        const fin = hoy;
        setFechas([inicio, fin]);
        fetchData(inicio, fin);
    }, []);

    const handleBuscar = () => {
        if (fechas[0] && fechas[1]) fetchData(fechas[0], fechas[1]);
    };

    return (
        <div className="card">
            <div className="flex justify-content-between align-items-center mb-3 gap-2 flex-wrap">
                <span className="text-lg font-medium">Utilidad por producto</span>
                <div className="flex align-items-center gap-2">
                    <Calendar
                        value={fechas}
                        onChange={(e) => setFechas(e.value)}
                        selectionMode="range"
                        dateFormat="dd/mm/yy"
                        placeholder="Rango de fechas"
                        showIcon
                        readOnlyInput
                        className="w-15rem"
                    />
                    <Button
                        icon="pi pi-search"
                        onClick={handleBuscar}
                        disabled={!fechas[0] || !fechas[1] || loading}
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex justify-content-center align-items-center" style={{ height: 300 }}>
                    <i className="pi pi-spin pi-spinner text-4xl" />
                </div>
            ) : (
                <div style={{ height: 350 }}>
                    <Chart type="bar" data={chartData} options={chartOptions} />
                </div>
            )}
        </div>
    );
}