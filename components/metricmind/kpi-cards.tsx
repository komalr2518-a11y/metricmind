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
import { METRIC_CATALOG } from "@/lib/metricmind/semantic-layer";

interface Kpi {
  label: string;
  value: string;
  delta: number;
  unit: "%" | "usd" | "count";
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
  bg: string;
}

function fmtUSD(n: number): string {
  if (Math.abs(n) >= 1_000_000) {
    return `$${(n / 1_000_000).toFixed(2)}M`;
  }

  if (Math.abs(n) >= 1_000) {
    return `$${Math.round(n).toLocaleString()}`;
  }

  return `$${n.toFixed(0)}`;
}

function fmtPct(n: number): string {
  return `${n.toFixed(1)}%`;
}

function fmtNum(n: number): string {
  return Math.round(n).toLocaleString();
}

export function KpiCards() {
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
        label: revenue?.name ?? "Total Revenue",
        value: "$1.52M",
        delta: 5.6,
        unit: "usd",
        icon: DollarSign,
        accent: "text-orange-600",
        bg: "bg-orange-50",
      },
      {
        label: margin?.name ?? "Gross Margin",
        value: "40.9%",
        delta: -0.9,
        unit: "%",
        icon: Percent,
        accent: "text-emerald-600",
        bg: "bg-emerald-50",
      },
      {
        label: churn?.name ?? "Customer Churn Rate",
        value: "11.2%",
        delta: 0.7,
        unit: "%",
        icon: TrendingDown,
        accent: "text-rose-600",
        bg: "bg-rose-50",
      },
      {
        label: nrr?.name ?? "Net Revenue Retention",
        value: "109.1%",
        delta: -2.4,
        unit: "%",
        icon: TrendingUp,
        accent: "text-violet-600",
        bg: "bg-violet-50",
      },
      {
        label: arpu?.name ?? "Average Revenue Per User",
        value: "$312",
        delta: 4.7,
        unit: "usd",
        icon: Activity,
        accent: "text-sky-600",
        bg: "bg-sky-50",
      },
      {
        label: customers?.name ?? "Active Customers",
        value: "18,300",
        delta: 8.3,
        unit: "count",
        icon: Users,
        accent: "text-amber-600",
        bg: "bg-amber-50",
      },
    ];
  }, []);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 px-4 sm:px-6 py-3 border-b border-zinc-100 bg-white shrink-0">
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
          <div
            key={k.label}
            className="rounded-lg border border-zinc-100 bg-white px-3 py-2.5 hover:border-zinc-200 transition-colors"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold truncate">
                {k.label}
              </span>

              <div
                className={`h-6 w-6 rounded-md ${k.bg} flex items-center justify-center shrink-0`}
              >
                <Icon className={`h-3 w-3 ${k.accent}`} />
              </div>
            </div>

            <div className="text-base font-bold text-zinc-900 leading-none">
              {k.value}
            </div>

            <div className={`text-[10px] mt-1 font-medium ${deltaColor}`}>
              {deltaSign}
              {k.delta.toFixed(1)}
              {k.unit === "usd" || k.unit === "count" ? "%" : " pp"}{" "}
              <span className="text-zinc-400 font-normal">
                vs prev mo
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default KpiCards;