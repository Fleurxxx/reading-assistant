import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";
import type React from "react";
import { Bar, Line } from "react-chartjs-2";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface BarChartProps {
  labels: string[];
  data: number[];
  label: string;
  color?: string;
  height?: number;
}

export const BarChart: React.FC<BarChartProps> = ({
  labels,
  data,
  label,
  color = "#0ea5e9",
  height = 200,
}) => {
  const chartData = {
    labels,
    datasets: [
      {
        label,
        data,
        backgroundColor: color,
        borderColor: color,
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: "#1f2937",
        padding: 12,
        cornerRadius: 8,
        titleFont: {
          size: 13,
        },
        bodyFont: {
          size: 12,
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 11,
          },
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: "#e5e7eb",
        },
        ticks: {
          font: {
            size: 11,
          },
          precision: 0,
        },
      },
    },
  };

  return (
    <div style={{ height: `${height}px` }}>
      <Bar data={chartData} options={options} />
    </div>
  );
};

interface LineChartProps {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    color: string;
  }[];
  height?: number;
}

export const LineChart: React.FC<LineChartProps> = ({ labels, datasets, height = 200 }) => {
  const chartData = {
    labels,
    datasets: datasets.map((dataset) => ({
      label: dataset.label,
      data: dataset.data,
      borderColor: dataset.color,
      backgroundColor: `${dataset.color}20`,
      borderWidth: 2,
      fill: true,
      tension: 0.3,
      pointRadius: 3,
      pointHoverRadius: 5,
    })),
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: datasets.length > 1,
        position: "top" as const,
        labels: {
          font: {
            size: 11,
          },
          usePointStyle: true,
          padding: 12,
        },
      },
      tooltip: {
        backgroundColor: "#1f2937",
        padding: 12,
        cornerRadius: 8,
        titleFont: {
          size: 13,
        },
        bodyFont: {
          size: 12,
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 10,
          },
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: "#e5e7eb",
        },
        ticks: {
          font: {
            size: 11,
          },
          precision: 0,
        },
      },
    },
  };

  return (
    <div style={{ height: `${height}px` }}>
      <Line data={chartData} options={options} />
    </div>
  );
};
