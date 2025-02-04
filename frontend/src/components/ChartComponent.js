import React, { useEffect, useRef } from 'react';
//import { Bar } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';

// Register all necessary components
Chart.register(...registerables);

const ChartComponent = ({ data }) => {
    const chartRef = useRef(null);
    const chartInstanceRef = useRef(null);

    // Prepare chart data
    const chartData = {
        labels: data.map((trip) => trip.destination),
        datasets: [
            {
                label: 'Expenses',
                data: data.map((trip) => trip.expenses),
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1,
            },
        ],
    };

    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
        },
    };

    useEffect(() => {
        // Destroy the existing chart if it exists
        if (chartInstanceRef.current) {
            chartInstanceRef.current.destroy();
        }

        // Create a new chart instance
        const ctx = chartRef.current.getContext('2d');
        chartInstanceRef.current = new Chart(ctx, {
            type: 'bar',
            data: chartData,
            options: options,
        });

        // Cleanup function to destroy the chart on component unmount
        return () => {
            if (chartInstanceRef.current) {
                chartInstanceRef.current.destroy();
            }
        };
    }, [data]); // Re-run effect when data changes

    return <canvas ref={chartRef} />;
};

export default ChartComponent;