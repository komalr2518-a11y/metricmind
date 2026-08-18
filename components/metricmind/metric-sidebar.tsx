"use client";

import { useMemo, useState } from "react";
import { Search, Layers, X } from "lucide-react";
import { METRIC_CATALOG } from "@/lib/metricmind/catalog";
import type { MetricDefinition } from "@/lib/metricmind/types";

type MetricCategory = MetricDefinition["category"];

interface Props {
  onSelect?: (id: string) => void;
  activeId?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

const CATEGORY_ORDER: MetricCategory[] = [
  "Revenue",
  "Profitability",
  "Customer",
  "Growth",
  "Efficiency",
];

const CATEGORY_COLORS: Record<MetricCategory, string> = {
  Revenue: "text-orange-600 bg-orange-50 border-orange-100",
  Profitability: "text-emerald-600 bg-emerald-50 border-emerald-100",
  Customer: "text-sky-600 bg-sky-50 border-sky-100",
  Growth: "text-violet-600 bg-violet-50 border-violet-100",
  Efficiency: "text-amber-600 bg-amber-50 border-amber-100",
};

export function MetricSidebar({
  onSelect,
  activeId,
  isOpen = false,
  onClose,
}: Props) {
  const [query, setQuery] = useState("");

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();

    const filtered = q
      ? METRIC_CATALOG.filter(
          (m) =>
            m.name.toLowerCase().includes(q) ||
            m.id.toLowerCase().includes(q) ||
            m.formula.toLowerCase().includes(q) ||
            m.category.toLowerCase().includes(q)
        )
      : METRIC_CATALOG;

    const map = new Map<MetricCategory, MetricDefinition[]>();

    for (const cat of CATEGORY_ORDER) {
      map.set(cat, []);
    }

    for (const metric of filtered) {
      const bucket = map.get(metric.category);

      if (bucket) {
        bucket.push(metric);
      }
    }

    return map;
  }, [query]);

  const totalShown = useMemo(
    () =>
      Array.from(grouped.values()).reduce(
        (total, metrics) => total + metrics.length,
        0
      ),
    [grouped]
  );

  return (
    <>
      {isOpen && (
        <button
          type="button"
          aria-label="Close metric catalog"
          className="fixed inset-0 z-40 bg-zinc-950/30 backdrop-blur-[1px] lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        id="metric-catalog"
        aria-label="Metric catalog"
        className={`${
          isOpen ? "flex" : "hidden"
        } fixed inset-y-0 left-0 z-50 w-[280px] max-w-[85vw] shrink-0 flex-col border-r border-zinc-200 bg-white shadow-xl lg:static lg:z-auto lg:flex lg:w-[260px] lg:shadow-none`}
      >
      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-100">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-zinc-900">
              <Layers className="h-3.5 w-3.5 text-white" />
            </div>

            <h2 className="text-sm font-semibold text-zinc-900">
              Metric Catalog
            </h2>
          </div>

          <button
            type="button"
            aria-label="Close metric catalog"
            className="rounded-md p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 lg:hidden"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-[11px] text-zinc-500 leading-relaxed">
          {METRIC_CATALOG.length} defined demo metrics · select one to explore
        </p>
      </div>

      {/* Search */}
      <div className="px-3 py-2 border-b border-zinc-100">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />

          <input
            type="text"
            aria-label="Search metrics"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search metrics..."
            className="w-full pl-8 pr-2 py-1.5 text-xs rounded-md border border-zinc-200 bg-white focus:outline-none focus:border-orange-300 focus:ring-1 focus:ring-orange-200"
          />
        </div>
      </div>

      {/* Metric List */}
      <div
        className="flex-1 overflow-y-auto px-2 py-2"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {totalShown === 0 && (
          <div className="text-center text-xs text-zinc-400 py-6">
            No metrics match “{query}”
          </div>
        )}

        {CATEGORY_ORDER.map((category) => {
          const metrics = grouped.get(category) ?? [];

          if (metrics.length === 0) {
            return null;
          }

          return (
            <div key={category} className="mb-3">
              <p className="px-2 mb-1 text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">
                {category}
              </p>

              <div className="space-y-0.5">
                {metrics.map((metric) => {
                  const isActive = metric.id === activeId;

                  return (
                    <button
                      type="button"
                      key={metric.id}
                      aria-pressed={isActive}
                      onClick={() => {
                        onSelect?.(metric.id);
                        onClose?.();
                      }}
                      className={`w-full text-left px-2 py-1.5 rounded-md transition-colors group ${
                        isActive
                          ? "bg-orange-50 border border-orange-200"
                          : "hover:bg-zinc-50 border border-transparent"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`text-xs font-medium truncate ${
                            isActive
                              ? "text-orange-700"
                              : "text-zinc-700"
                          }`}
                        >
                          {metric.name}
                        </span>

                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded border ${
                            CATEGORY_COLORS[metric.category]
                          }`}
                        >
                          {metric.unit}
                        </span>
                      </div>

                      <code
                        className={`block text-[10px] mt-0.5 truncate font-mono ${
                          isActive
                            ? "text-orange-500"
                            : "text-zinc-400"
                        }`}
                      >
                        {metric.formula}
                      </code>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-3 py-2 border-t border-zinc-100 bg-zinc-50/50">
        <p className="text-[10px] text-zinc-500 leading-relaxed">
          Definitions and values are local demo data, ready to be replaced by a
          production semantic API.
        </p>
      </div>
      </aside>
    </>
  );
}

export default MetricSidebar;
