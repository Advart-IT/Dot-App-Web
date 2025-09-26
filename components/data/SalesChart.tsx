"use client";

import { useEffect, useRef, useState } from "react";
import {
  Chart as ChartJS,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
  ChartData,
} from "chart.js";

ChartJS.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend
);

type ChartInputData = {
  sales_graph_data: { period: string; sale_value: number }[];
  target_sales_graph_data: { period: string; target_sales: number }[];
  target_value_graph_data: { period: string; target_value: number }[];
};

type SalesChartProps = {
  chartData?: ChartInputData;
};

type LineToggles = {
  actual: { avg: boolean; ma: boolean; std: boolean };
  target: { avg: boolean; ma: boolean; std: boolean };
  targetValue: { plus10: boolean; minus10: boolean };
};

const calculateStats = (data: number[]) => {
  const avg = data.reduce((sum, val) => sum + val, 0) / data.length;
  const variance = data.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / data.length;
  return { avg, stdDev: Math.sqrt(variance) };
};

const movingAverage = (data: number[], window = 3) =>
  data.map((_, i) =>
    i < window - 1 ? null : data.slice(i - window + 1, i + 1).reduce((a, b) => a + b, 0) / window
  );

const SalesChart = ({ chartData }: SalesChartProps) => {
  const chartRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<ChartJS | null>(null);

  const [toggles, setToggles] = useState<LineToggles>({
    actual: { avg: false, ma: false, std: false },
    target: { avg: false, ma: false, std: false },
    targetValue: { plus10: false, minus10: false },
  });

  const handleToggle = <G extends keyof LineToggles>(
    group: G,
    key: keyof LineToggles[G]
  ) => {
    setToggles((prev) => ({
      ...prev,
      [group]: {
        ...prev[group],
        [key]: !prev[group][key],
      },
    }));
  };

  useEffect(() => {
    if (!chartData || !chartData.sales_graph_data?.length || !chartRef.current) return;

    const ctx = chartRef.current.getContext("2d");
    if (!ctx) return;

    const visibilityMap: Record<string, boolean> = {};
    if (chartInstanceRef.current) {
      chartInstanceRef.current.data.datasets.forEach((ds, i) => {
        const meta = chartInstanceRef.current!.getDatasetMeta(i);
        visibilityMap[ds.label ?? `ds-${i}`] = !meta.hidden;
      });
    }

    chartInstanceRef.current?.destroy();

    const labels = chartData.sales_graph_data.map((d) =>
      new Date(d.period).toLocaleDateString("en-IN", {
        month: "short",
        day: "numeric",
      })
    );

    const actualSales = chartData.sales_graph_data.map((d) => d.sale_value);
    const targetSales = chartData.target_sales_graph_data.map((d) => d.target_sales);
    const targetValue = chartData.target_value_graph_data.map((d) => d.target_value);

    const actualStats = calculateStats(actualSales);
    const targetStats = calculateStats(targetSales);
    const actualMA = movingAverage(actualSales);
    const targetMA = movingAverage(targetSales);
    const targetValueUpper = targetValue.map((v) => v * 1.1);
    const targetValueLower = targetValue.map((v) => v * 0.9);

    const datasets: ChartData<"line">["datasets"] = [];

    // Base lines
    datasets.push({
      label: "Actual Sales",
      data: actualSales,
      borderColor: "#3b82f6",
      backgroundColor: "rgba(59,130,246,0.1)",
      tension: 0.3,
    });
    datasets.push({
      label: "Target Sales",
      data: targetSales,
      borderColor: "#22c55e",
      backgroundColor: "rgba(34,197,94,0.1)",
      tension: 0.3,
    });
    datasets.push({
      label: "Target Value",
      data: targetValue,
      borderColor: "#ef4444",
      borderDash: [5, 5],
      tension: 0,
    });

    // Conditional derived lines
    if (visibilityMap["Actual Sales"] !== false && toggles.actual.avg) {
      datasets.push({
        label: "Actual Avg",
        data: new Array(actualSales.length).fill(actualStats.avg),
        borderColor: "#3b82f6",
        borderDash: [4, 2],
        pointRadius: 0,
      });
    }
    if (visibilityMap["Actual Sales"] !== false && toggles.actual.ma) {
      datasets.push({
        label: "Actual MA",
        data: actualMA,
        borderColor: "#2563eb",
        borderDash: [8, 4],
        pointRadius: 0,
      });
    }
    if (visibilityMap["Actual Sales"] !== false && toggles.actual.std) {
      datasets.push(
        {
          label: "Actual +1 Std",
          data: new Array(actualSales.length).fill(actualStats.avg + actualStats.stdDev),
          borderColor: "#3b82f6",
          borderDash: [2, 2],
          pointRadius: 0,
        },
        {
          label: "Actual -1 Std",
          data: new Array(actualSales.length).fill(actualStats.avg - actualStats.stdDev),
          borderColor: "#3b82f6",
          borderDash: [2, 2],
          pointRadius: 0,
        }
      );
    }

    if (visibilityMap["Target Sales"] !== false && toggles.target.avg) {
      datasets.push({
        label: "Target Avg",
        data: new Array(targetSales.length).fill(targetStats.avg),
        borderColor: "#22c55e",
        borderDash: [4, 2],
        pointRadius: 0,
      });
    }
    if (visibilityMap["Target Sales"] !== false && toggles.target.ma) {
      datasets.push({
        label: "Target MA",
        data: targetMA,
        borderColor: "#15803d",
        borderDash: [8, 4],
        pointRadius: 0,
      });
    }
    if (visibilityMap["Target Sales"] !== false && toggles.target.std) {
      datasets.push(
        {
          label: "Target +1 Std",
          data: new Array(targetSales.length).fill(targetStats.avg + targetStats.stdDev),
          borderColor: "#22c55e",
          borderDash: [2, 2],
          pointRadius: 0,
        },
        {
          label: "Target -1 Std",
          data: new Array(targetSales.length).fill(targetStats.avg - targetStats.stdDev),
          borderColor: "#22c55e",
          borderDash: [2, 2],
          pointRadius: 0,
        }
      );
    }

    if (visibilityMap["Target Value"] !== false && toggles.targetValue.plus10) {
      datasets.push({
        label: "Target +10%",
        data: targetValueUpper,
        borderColor: "#ef4444",
        borderDash: [3, 3],
        pointRadius: 0,
      });
    }
    if (visibilityMap["Target Value"] !== false && toggles.targetValue.minus10) {
      datasets.push({
        label: "Target -10%",
        data: targetValueLower,
        borderColor: "#ef4444",
        borderDash: [3, 3],
        pointRadius: 0,
      });
    }

    chartInstanceRef.current = new ChartJS(ctx, {
      type: "line",
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: "top",
            labels: {
              usePointStyle: true,
              pointStyle: "circle",
            },
          },
          tooltip: {
            callbacks: {
              label: (ctx) =>
                `${ctx.dataset.label}: ₹${(ctx.raw as number).toLocaleString("en-IN")}`,
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: "Sales Value (₹)",
            },
            ticks: {
              callback: (v) => `₹${(v as number).toLocaleString("en-IN")}`,
            },
          },
          x: {
            title: {
              display: true,
              text: "Date",
            },
          },
        },
      },
    });

    chartInstanceRef.current.data.datasets.forEach((ds, idx) => {
      const isVisible = visibilityMap[ds.label ?? `ds-${idx}`];
      chartInstanceRef.current!.getDatasetMeta(idx).hidden = isVisible === false;
    });

    chartInstanceRef.current.update();

    return () => chartInstanceRef.current?.destroy();
  }, [toggles, chartData]);

  if (!chartData || !chartData.sales_graph_data?.length) {
    return (
      <div className="bg-themeBase border border-themeBase-l2 rounded-[10px] w-full p-x20 flex justify-center items-center">
        <p className="text-ltxt text-14 flex flex-justify">No sales data available.</p>
      </div>
    );
  }

  return (
    <div className="bg-themeBase border border-themeBase-l2 rounded-[10px] p-x20 w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm mb-4">
        {(["actual", "target", "targetValue"] as const).map((group) => (
          <div key={group}>
            <strong style={{ color: "#343434" }}>
              {group === "actual"
                ? "Actual Sales"
                : group === "target"
                ? "Target Sales"
                : "Target Value"}
            </strong>
            <div className="flex flex-wrap gap-3 mt-1">
              {Object.entries(toggles[group]).map(([key, value]) => (
                <label key={key} style={{ color: "#343434" }}>
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={() =>
                      handleToggle(
                        group,
                        key as typeof toggles[typeof group] extends Record<infer K, boolean> ? K : never
                      )
                    }
                  />{" "}
                  {key.replace("plus10", "+10%").replace("minus10", "-10%").toUpperCase()}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={{ width: "100%", height: "40vh" }}>
        <canvas ref={chartRef} />
      </div>
    </div>
  );
};

export default SalesChart;