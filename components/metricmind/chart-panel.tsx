"use client";

import {
  BarChart3,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import type { ChartConfig } from "@/lib/metricmind/semantic-layer";

interface Props {
  config: ChartConfig | null;
}

const COLORS = [
  "#D4875A",
  "#5B8FF9",
  "#61DDAA",
  "#65789B",
  "#F6BD16",
  "#7262FD",
];

export function ChartPanel({ config }: Props) {
  if (!config) {
    return (
      <div className="rounded-xl border border-zinc-100 bg-white p-6">
        <div className="flex flex-col items-center justify-center h-72 text-center">
          <div className="h-12 w-12 rounded-full bg-zinc-100 flex items-center justify-center mb-3">
            <BarChart3 className="h-5 w-5 text-zinc-400" />
          </div>

          <p className="text-sm text-zinc-500">
            Query a metric to see the visualization
          </p>

          <p className="text-xs text-zinc-400 mt-1">
            Charts render from the Semantic Layer
          </p>
        </div>
      </div>
    );
  }

  const labels = config.xAxis?.data ?? [];

  const chartData = labels.map((label, index) => {
    const row: Record<string, string | number> = {
      name: label,
    };

    config.series.forEach((series) => {
      row[series.name] = series.data[index] ?? 0;
    });

    return row;
  });

  return (
    <div className="rounded-xl border border-zinc-100 bg-white p-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        {config.type === "line" && (
          <LineChartIcon className="h-4 w-4 text-orange-500" />
        )}

        {config.type === "bar" && (
          <BarChart3 className="h-4 w-4 text-orange-500" />
        )}

        {config.type === "pie" && (
          <PieChartIcon className="h-4 w-4 text-orange-500" />
        )}

        <h3 className="text-sm font-semibold text-zinc-800">
          {config.title}
        </h3>
      </div>

      {/* Chart */}
      <div className="w-full h-[360px]">
        <ResponsiveContainer width="100%" height="100%">
          {config.type === "line" ? (
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />

              <XAxis
                dataKey="name"
                tick={{ fontSize: 11 }}
              />

              <YAxis
                tick={{ fontSize: 11 }}
              />

              <Tooltip />

              <Legend />

              {config.series.map((series, index) => (
                <Line
                  key={series.name}
                  type="monotone"
                  dataKey={series.name}
                  stroke={series.color ?? COLORS[index % COLORS.length]}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              ))}
            </LineChart>
          ) : config.type === "bar" ? (
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />

              <XAxis
                dataKey="name"
                tick={{ fontSize: 11 }}
              />

              <YAxis
                tick={{ fontSize: 11 }}
              />

              <Tooltip />

              <Legend />

              {config.series.map((series, index) => (
                <Bar
                  key={series.name}
                  dataKey={series.name}
                  fill={series.color ?? COLORS[index % COLORS.length]}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </BarChart>
          ) : config.type === "pie" ? (
            <PieChart>
              <Tooltip />

              <Legend />

              <Pie
                data={chartData.map((item) => ({
                  name: item.name,
                  value: item[config.series[0]?.name ?? ""] ?? 0,
                }))}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={120}
                label
              >
                {chartData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
            </PieChart>
          ) : (
            <div className="flex items-center justify-center h-full text-sm text-zinc-400">
              Chart type "{config.type}" is not supported yet.
            </div>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default ChartPanel;