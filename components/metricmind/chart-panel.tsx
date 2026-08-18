"use client";

import { useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  ChartArea,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  Sparkles,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatMetricValue } from "@/lib/metricmind/format";
import type {
  ChartConfig,
  FavorableDirection,
} from "@/lib/metricmind/types";

interface Props {
  config: ChartConfig | null;
  favorableDirection?: FavorableDirection;
}

type ChartView = "line" | "area" | "bar" | "pie";

const COLORS = [
  "#f97316",
  "#0ea5e9",
  "#10b981",
  "#8b5cf6",
  "#f59e0b",
  "#ec4899",
];

const VIEW_META: Record<
  ChartView,
  { label: string; icon: typeof BarChart3 }
> = {
  line: { label: "Line", icon: LineChartIcon },
  area: { label: "Area", icon: ChartArea },
  bar: { label: "Bar", icon: BarChart3 },
  pie: { label: "Donut", icon: PieChartIcon },
};

function availableViews(config: ChartConfig): ChartView[] {
  if (config.type === "pie") return ["pie", "bar"];
  if (config.type === "bar") return ["bar", "pie"];
  return ["line", "area", "bar"];
}

function isTemporalChart(config: ChartConfig): boolean {
  const axisLabel = config.xAxis?.label.toLowerCase() ?? "";
  return ["period", "month", "quarter", "date", "week", "year", "day"].some(
    (label) => axisLabel.includes(label)
  );
}

function changeColor(
  change: number | null,
  favorableDirection: FavorableDirection
): string {
  if (change === null || change === 0) return "text-zinc-500";
  if (favorableDirection === "contextual") return "text-sky-600";

  const isFavorable =
    favorableDirection === "up" ? change > 0 : change < 0;
  return isFavorable ? "text-emerald-600" : "text-rose-600";
}

export function ChartPanel({
  config,
  favorableDirection = "contextual",
}: Props) {
  const [selectedView, setSelectedView] = useState<ChartView>("line");

  const chartData = useMemo(() => {
    if (!config) return [];
    const labels = config.xAxis?.data ?? [];

    return labels.map((label, index) => {
      const row: Record<string, string | number> = { name: label };
      config.series.forEach((series) => {
        row[series.name] = series.data[index] ?? 0;
      });
      return row;
    });
  }, [config]);

  if (!config) {
    return (
      <section className="relative shrink-0 overflow-hidden rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm">
        <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-orange-100/70 blur-3xl" />
        <div className="relative flex h-72 flex-col items-center justify-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 shadow-lg shadow-orange-200">
            <BarChart3 className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-sm font-bold text-zinc-800">
            Your insight canvas is ready
          </h2>
          <p className="mt-1 max-w-xs text-xs leading-relaxed text-zinc-400">
            Choose a KPI or ask a question to generate an interactive chart and
            data table.
          </p>
          <div className="mt-6 flex h-20 items-end gap-1.5" aria-hidden="true">
            {[28, 42, 35, 54, 48, 68, 61, 78].map((height, index) => (
              <span
                key={`${height}-${index}`}
                className="w-3 rounded-t-sm bg-gradient-to-t from-orange-500 to-amber-300 opacity-70"
                style={{ height }}
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  const unit = config.yAxis?.label ?? "#";
  const views = availableViews(config);
  const defaultView: ChartView =
    config.type === "pie" ? "pie" : config.type === "bar" ? "bar" : "line";
  const view = views.includes(selectedView) ? selectedView : defaultView;
  const primary = config.series[0]?.data ?? [];
  const first = primary[0] ?? 0;
  const latest = primary.at(-1) ?? 0;
  const change = first === 0 ? null : ((latest - first) / first) * 100;
  const peak = primary.length ? Math.max(...primary) : 0;
  const minimum = primary.length ? Math.min(...primary) : 0;
  const peakIndex = primary.indexOf(peak);
  const peakLabel = config.xAxis?.data[peakIndex] ?? "—";
  const temporal = isTemporalChart(config);
  const spread = peak - minimum;
  const total = primary.reduce((sum, value) => sum + value, 0);
  const aggregate =
    unit === "%" && primary.length ? total / primary.length : total;
  const aggregateLabel = unit === "%" ? "Average" : "Displayed total";
  const ChangeIcon = change !== null && change < 0 ? ArrowDownRight : ArrowUpRight;

  const axisProps = {
    axisLine: false,
    tickLine: false,
    tick: { fontSize: 10, fill: "#71717a" },
  };
  const tooltipProps = {
    cursor: { fill: "rgba(249, 115, 22, 0.06)" },
    contentStyle: {
      borderRadius: 12,
      border: "1px solid #e4e4e7",
      boxShadow: "0 12px 30px rgba(24, 24, 27, 0.10)",
      fontSize: 12,
    },
    formatter: (value: unknown) => formatMetricValue(Number(value), unit),
  };

  return (
    <section
      aria-label={config.title}
      className="shrink-0 overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm"
    >
      <div className="flex flex-col gap-3 border-b border-zinc-100 bg-gradient-to-r from-white via-white to-orange-50/50 px-4 py-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-100">
            <Sparkles className="h-3.5 w-3.5 text-orange-600" />
          </span>
          <div>
            <h3 className="text-sm font-bold text-zinc-900">{config.title}</h3>
            <p className="mt-0.5 text-[10px] text-zinc-400">
              Interactive demo visualization
            </p>
          </div>
        </div>

        <div
          className="inline-flex w-fit rounded-xl border border-zinc-200 bg-white p-1 shadow-sm"
          aria-label="Chart style"
        >
          {views.map((chartView) => {
            const meta = VIEW_META[chartView];
            const Icon = meta.icon;
            const active = view === chartView;

            return (
              <button
                type="button"
                key={chartView}
                aria-pressed={active}
                title={`${meta.label} chart`}
                className={`flex h-7 items-center gap-1 rounded-lg px-2 text-[10px] font-semibold transition-all ${
                  active
                    ? "bg-zinc-900 text-white shadow-sm"
                    : "text-zinc-400 hover:bg-zinc-50 hover:text-zinc-700"
                }`}
                onClick={() => setSelectedView(chartView)}
              >
                <Icon className="h-3 w-3" />
                <span className="hidden xl:inline">{meta.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-3 border-b border-zinc-100 bg-zinc-50/60">
        <div className="border-r border-zinc-100 px-3 py-2.5">
          <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">
            {temporal ? "Latest" : `Leader · ${peakLabel}`}
          </p>
          <p className="mt-1 truncate text-xs font-bold tabular-nums text-zinc-800">
            {formatMetricValue(temporal ? latest : peak, unit, {
              compact: true,
            })}
          </p>
        </div>
        <div className="border-r border-zinc-100 px-3 py-2.5">
          <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">
            {temporal ? "Change" : "Spread"}
          </p>
          <p className={`mt-1 flex items-center gap-0.5 text-xs font-bold tabular-nums ${
            temporal ? changeColor(change, favorableDirection) : "text-zinc-800"
          }`}>
            {temporal ? (
              change === null ? (
                "—"
              ) : (
                <>
                  <ChangeIcon className="h-3 w-3" />
                  {Math.abs(change).toFixed(1)}%
                </>
              )
            ) : (
              formatMetricValue(spread, unit, { compact: true })
            )}
          </p>
        </div>
        <div className="px-3 py-2.5">
          <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">
            {temporal ? `Peak · ${peakLabel}` : "Groups"}
          </p>
          <p className="mt-1 truncate text-xs font-bold tabular-nums text-zinc-800">
            {temporal
              ? formatMetricValue(peak, unit, { compact: true })
              : primary.length.toLocaleString("en-US")}
          </p>
        </div>
      </div>

      <div className="h-[260px] w-full px-2 pb-2 pt-4 sm:h-[310px] lg:h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          {view === "line" ? (
            <LineChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="#f4f4f5" strokeDasharray="4 4" />
              <XAxis dataKey="name" {...axisProps} />
              <YAxis
                {...axisProps}
                width={52}
                tickFormatter={(value) =>
                  formatMetricValue(Number(value), unit, { compact: true })
                }
              />
              <Tooltip {...tooltipProps} />
              {config.series.length > 1 && <Legend iconType="circle" iconSize={7} />}
              {config.series.map((series, index) => (
                <Line
                  key={series.name}
                  type="monotone"
                  dataKey={series.name}
                  stroke={series.color ?? COLORS[index % COLORS.length]}
                  strokeWidth={3}
                  dot={{ r: 3, strokeWidth: 2, fill: "white" }}
                  activeDot={{ r: 5, strokeWidth: 0 }}
                />
              ))}
            </LineChart>
          ) : view === "area" ? (
            <AreaChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <defs>
                {config.series.map((series, index) => (
                  <linearGradient
                    key={series.name}
                    id={`metric-gradient-${index}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor={series.color ?? COLORS[index % COLORS.length]}
                      stopOpacity={0.35}
                    />
                    <stop
                      offset="95%"
                      stopColor={series.color ?? COLORS[index % COLORS.length]}
                      stopOpacity={0.02}
                    />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid vertical={false} stroke="#f4f4f5" strokeDasharray="4 4" />
              <XAxis dataKey="name" {...axisProps} />
              <YAxis
                {...axisProps}
                width={52}
                tickFormatter={(value) =>
                  formatMetricValue(Number(value), unit, { compact: true })
                }
              />
              <Tooltip {...tooltipProps} />
              {config.series.map((series, index) => (
                <Area
                  key={series.name}
                  type="monotone"
                  dataKey={series.name}
                  stroke={series.color ?? COLORS[index % COLORS.length]}
                  strokeWidth={2.5}
                  fill={`url(#metric-gradient-${index})`}
                />
              ))}
            </AreaChart>
          ) : view === "bar" ? (
            <BarChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="#f4f4f5" strokeDasharray="4 4" />
              <XAxis dataKey="name" {...axisProps} />
              <YAxis
                {...axisProps}
                width={52}
                tickFormatter={(value) =>
                  formatMetricValue(Number(value), unit, { compact: true })
                }
              />
              <Tooltip {...tooltipProps} />
              {config.series.length > 1 && <Legend iconType="circle" iconSize={7} />}
              {config.series.map((series, index) => (
                <Bar
                  key={series.name}
                  dataKey={series.name}
                  fill={series.color ?? COLORS[index % COLORS.length]}
                  radius={[7, 7, 2, 2]}
                  maxBarSize={42}
                />
              ))}
            </BarChart>
          ) : (
            <PieChart>
              <Tooltip {...tooltipProps} />
              <Legend iconType="circle" iconSize={7} />
              <Pie
                data={chartData.map((item) => ({
                  name: item.name,
                  value: item[config.series[0]?.name ?? ""] ?? 0,
                }))}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="48%"
                innerRadius="48%"
                outerRadius="76%"
                paddingAngle={3}
                cornerRadius={6}
                stroke="none"
              >
                {chartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <text
                x="50%"
                y="45%"
                textAnchor="middle"
                dominantBaseline="central"
                className="fill-zinc-900 text-base font-bold"
              >
                {formatMetricValue(aggregate, unit, { compact: true })}
              </text>
              <text
                x="50%"
                y="54%"
                textAnchor="middle"
                dominantBaseline="central"
                className="fill-zinc-400 text-[10px]"
              >
                {aggregateLabel}
              </text>
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>
    </section>
  );
}

export default ChartPanel;
