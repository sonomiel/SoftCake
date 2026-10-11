import React, { useState, useEffect } from 'react';
import { Chart } from 'primereact/chart';
import { Dropdown } from 'primereact/dropdown';
import axios from 'axios';

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export default function Ventas() {
    const anioActual = new Date().getFullYear();
    const [anio, setAnio] = useState(anioActual);
    const [chartData, setChartData] = useState({});
    const [chartOptions, setChartOptions] = useState({});
    const [loading, setLoading] = useState(false);

    const anios = Array.from({ length: 5 }, (_, i) => ({
        label: String(anioActual - i),
        value: anioActual - i
    }));

    // Opciones de la gráfica — solo se arman una vez
    useEffect(() => {
        const documentStyle = getComputedStyle(document.documentElement);
        const textColor = documentStyle.getPropertyValue('--text-color');
        const textColorSecondary = documentStyle.getPropertyValue('--text-color-secondary');
        const surfaceBorder = documentStyle.getPropertyValue('--surface-border');

        setChartOptions({
            maintainAspectRatio: false,
            aspectRatio: 0.6,
            plugins: {
                legend: {
                    labels: { color: textColor }
                },
                tooltip: {
                    callbacks: {
                        label: (ctx) => ` $${ctx.parsed.y.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
                    }
                }
            },
            scales: {
                x: {
                    ticks: { color: textColorSecondary },
                    grid: { color: surfaceBorder }
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: textColorSecondary,
                        callback: (val) => `$${val.toLocaleString('es-MX')}`
                    },
                    grid: { color: surfaceBorder }
                }
            }
        });
    }, []);

    // Datos — se vuelven a pedir cada vez que cambia el año
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const documentStyle = getComputedStyle(document.documentElement);
                const API_URL = `${import.meta.env.VITE_API_URL}rep/GET_VENTAS.php?anio=${anio}`;
                const response = await axios.get(API_URL);

                // Rellenar los 12 meses con 0 donde no haya ventas
                const importes = Array(12).fill(0);
                response.data.forEach(row => {
                    importes[row.mes - 1] = parseFloat(row.total_ventas);
                });

                setChartData({
                    labels: MESES,
                    datasets: [
                        {
                            label: `Ventas ${anio}`,
                            data: importes,
                            fill: false,
                            borderColor: documentStyle.getPropertyValue('--blue-500'),
                            tension: 0.4
                        }
                    ]
                });
            } catch (error) {
                console.error("Error al obtener ventas:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [anio]);

    return (
        <div className="card">
            <div className="flex justify-content-between align-items-center mb-3">
                <span className="text-lg font-medium">Tendencia de ventas</span>
                <Dropdown
                    value={anio}
                    options={anios}
                    onChange={(e) => setAnio(e.value)}
                    className="w-8rem"
                />
            </div>

            {loading ? (
                <div className="flex justify-content-center align-items-center" style={{ height: 300 }}>
                    <i className="pi pi-spin pi-spinner text-4xl" />
                </div>
            ) : (
                <Chart type="line" data={chartData} options={chartOptions} />
            )}
        </div>
    );
}