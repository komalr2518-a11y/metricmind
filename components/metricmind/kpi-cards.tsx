"use client";

import { useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Percent,
  Users,
  Activity,
} from "lucide-react";
import { METRIC_CATALOG } from "@/lib/metricmind/catalog";

interface Kpi {
  id: string;
  label: string;
  value: string;
  delta: number;
  unit: "%" | "usd" | "count";
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
  bg: string;
  bar: string;
}

interface KpiCardsProps {
  activeId?: string;
  onSelect?: (id: string) => void;
}

export function KpiCards({ activeId, onSelect }: KpiCardsProps) {
  const kpis = useMemo<Kpi[]>(() => {
    const getMetric = (id: string) =>
      METRIC_CATALOG.find((metric) => metric.id === id);

    const revenue = getMetric("total_revenue");
    const margin = getMetric("gross_margin");
    const churn = getMetric("churn_rate");
    const nrr = getMetric("nrr");
    const arpu = getMetric("arpu");
    const customers = getMetric("customer_count");

    return [
      {
        id: "total_revenue",
        label: revenue?.name ?? "Total Revenue",
        value: "$1.52M",
        delta: 5.6,
        unit: "usd",
        icon: DollarSign,
        accent: "text-orange-600",
        bg: "bg-orange-50",
        bar: "from-orange-400 to-amber-400",
      },
      {
        id: "gross_margin",
        label: margin?.name ?? "Gross Margin",
        value: "40.9%",
        delta: -0.9,
        unit: "%",
        icon: Percent,
        accent: "text-emerald-600",
        bg: "bg-emerald-50",
        bar: "from-emerald-400 to-teal-400",
      },
      {
        id: "churn_rate",
        label: churn?.name ?? "Customer Churn Rate",
        value: "11.2%",
        delta: 0.7,
        unit: "%",
        icon: TrendingDown,
        accent: "text-rose-600",
        bg: "bg-rose-50",
        bar: "from-rose-400 to-pink-400",
      },
      {
        id: "nrr",
        label: nrr?.name ?? "Net Revenue Retention",
        value: "109.1%",
        delta: -2.4,
        unit: "%",
        icon: TrendingUp,
        accent: "text-violet-600",
        bg: "bg-violet-50",
        bar: "from-violet-400 to-indigo-400",
      },
      {
        id: "arpu",
        label: arpu?.name ?? "Average Revenue Per User",
        value: "$312",
        delta: 4.7,
        unit: "usd",
        icon: Activity,
        accent: "text-sky-600",
        bg: "bg-sky-50",
        bar: "from-sky-400 to-cyan-400",
      },
      {
        id: "customer_count",
        label: customers?.name ?? "Active Customers",
        value: "18,300",
        delta: 8.3,
        unit: "count",
        icon: Users,
        accent: "text-amber-600",
        bg: "bg-amber-50",
        bar: "from-amber-400 to-yellow-400",
      },
    ];
  }, []);

  return (
    <section
      aria-label="Demo KPI snapshot"
      className="flex shrink-0 gap-2 overflow-x-auto border-b border-zinc-100 bg-white px-4 py-3 sm:px-6 lg:grid lg:grid-cols-6"
    >
      {kpis.map((k) => {
        const Icon = k.icon;

        const positiveIsGood = k.label !== "Customer Churn Rate";
        const deltaIsGood = positiveIsGood
          ? k.delta >= 0
          : k.delta <= 0;

        const deltaColor = deltaIsGood
          ? "text-emerald-600"
          : "text-rose-600";

        const deltaSign = k.delta > 0 ? "+" : "";

        return (
          <button
            type="button"
            key={k.id}
            aria-pressed={activeId === k.id}
            className={`group relative min-w-[158px] overflow-hidden rounded-xl border bg-white px-3 py-2.5 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md lg:min-w-0 ${
              activeId === k.id
                ? "border-orange-300 ring-2 ring-orange-100"
                : "border-zinc-200/80 hover:border-zinc-300"
            }`}
            onClick={() => onSelect?.(k.id)}
          >
            <span
              aria-hidden="true"
              className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${k.bar}`}
            />
            <div className="flex items-center justify-between mb-1.5">
              <span className="truncate text-[9px] font-bold uppercase tracking-wider text-zinc-500">
                {k.label}
              </span>

              <div
                className={`h-6 w-6 rounded-md ${k.bg} flex items-center justify-center shrink-0`}
              >
                <Icon className={`h-3 w-3 ${k.accent}`} />
              </div>
            </div>

            <div className="text-base font-extrabold leading-none tracking-tight text-zinc-900">
              {k.value}
            </div>

            <div className={`mt-1 text-[10px] font-semibold ${deltaColor}`}>
              {deltaSign}
              {k.delta.toFixed(1)}
              {k.unit === "usd" || k.unit === "count" ? "%" : " pp"}{" "}
              <span className="text-zinc-400 font-normal">
                vs prev mo
              </span>
            </div>
          </button>
        );
      })}
    </section>
  );
}

export default KpiCards;
