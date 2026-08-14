"use client";

import { useMemo, useState } from "react";
import { Table2, ChevronDown, ChevronRight } from "lucide-react";
import type { MetricResult } from "@/lib/metricmind/semantic-layer";

interface DataTableProps {
  data?: MetricResult | null;
  result?: MetricResult | null;
}

type SortKey = "period" | "value";

interface TableRow {
  period: string;
  value: number;
}

export function DataTable({
  data,
  result,
}: DataTableProps) {
  const metricResult = data ?? result ?? null;

  const [sortKey, setSortKey] = useState<SortKey>("period");
  const [sortAsc, setSortAsc] = useState(true);

  const rows = useMemo<TableRow[]>(() => {
    if (!metricResult?.data) {
      return [];
    }

    return metricResult.data.map((item, index) => ({
      period:
        typeof item.period === "string"
          ? item.period
          : typeof item.month === "string"
          ? item.month
          : typeof item.region === "string"
          ? item.region
          : typeof item.category === "string"
          ? item.category
          : typeof item.tier === "string"
          ? item.tier
          : `Row ${index + 1}`,

      value:
        typeof item.value === "number"
          ? item.value
          : 0,
    }));
  }, [metricResult]);

  const sorted = useMemo(() => {
    const copy = [...rows];

    copy.sort((a, b) => {
      if (sortKey === "period") {
        return sortAsc
          ? a.period.localeCompare(b.period)
          : b.period.localeCompare(a.period);
      }

      return sortAsc
        ? a.value - b.value
        : b.value - a.value;
    });

    return copy;
  }, [rows, sortKey, sortAsc]);

  const total = useMemo(() => {
    return rows.reduce((sum, row) => sum + row.value, 0);
  }, [rows]);

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortAsc((prev) => !prev);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  }

  const formatValue = (value: number) => {
    if (Math.abs(value) >= 1_000_000) {
      return `${(value / 1_000_000).toFixed(2)}M`;
    }

    if (Math.abs(value) >= 1_000) {
      return `${Math.round(value).toLocaleString()}`;
    }

    return value.toLocaleString();
  };

  if (!metricResult) {
    return null;
  }

  return (
    <section className="border-t border-zinc-100 bg-white shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-2.5 border-b border-zinc-100">
        <div className="flex items-center gap-2">
          <Table2 className="h-3.5 w-3.5 text-zinc-500" />

          <h3 className="text-xs font-semibold text-zinc-800">
            {metricResult.metricName}
          </h3>
        </div>

        <span className="text-[10px] text-zinc-400">
          {rows.length} rows
        </span>
      </div>

      {/* Table */}
      <div
        className="max-h-[280px] overflow-auto"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-white border-b border-zinc-200">
            <tr className="text-left">
              <th
                onClick={() => toggleSort("period")}
                className="px-3 py-2 text-[10px] uppercase tracking-wider font-semibold cursor-pointer select-none text-zinc-500 hover:text-zinc-700"
              >
                <span className="inline-flex items-center gap-0.5">
                  Period
                  {sortKey === "period" &&
                    (sortAsc ? (
                      <ChevronRight className="h-3 w-3" />
                    ) : (
                      <ChevronDown className="h-3 w-3" />
                    ))}
                </span>
              </th>

              <th
                onClick={() => toggleSort("value")}
                className="px-3 py-2 text-[10px] uppercase tracking-wider font-semibold cursor-pointer select-none text-right text-zinc-500 hover:text-zinc-700"
              >
                <span className="inline-flex items-center gap-0.5">
                  Value
                  {sortKey === "value" &&
                    (sortAsc ? (
                      <ChevronRight className="h-3 w-3" />
                    ) : (
                      <ChevronDown className="h-3 w-3" />
                    ))}
                </span>
              </th>
            </tr>
          </thead>

          <tbody>
            {sorted.map((row, index) => (
              <tr
                key={`${row.period}-${index}`}
                className="border-b border-zinc-50 hover:bg-zinc-50/50 transition-colors"
              >
                <td className="px-3 py-2 font-medium text-zinc-700">
                  {row.period}
                </td>

                <td className="px-3 py-2 text-right text-zinc-700 tabular-nums">
                  {formatValue(row.value)}
                </td>
              </tr>
            ))}
          </tbody>

          <tfoot className="sticky bottom-0 bg-zinc-50 border-t-2 border-zinc-200">
            <tr className="font-semibold">
              <td className="px-3 py-2 text-zinc-800">
                Total
              </td>

              <td className="px-3 py-2 text-right text-zinc-900 tabular-nums">
                {formatValue(total)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}

export default DataTable;