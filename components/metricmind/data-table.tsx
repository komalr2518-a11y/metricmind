"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Table2 } from "lucide-react";
import { formatMetricValue } from "@/lib/metricmind/format";
import type { MetricResult } from "@/lib/metricmind/types";

interface DataTableProps {
  result: MetricResult;
}

type SortKey = "period" | "value";

interface TableRow {
  index: number;
  period: string;
  value: number;
}

function getRowLabel(
  item: Record<string, string | number>,
  index: number
): string {
  for (const key of ["period", "month", "region", "category", "tier"]) {
    if (typeof item[key] === "string") return item[key];
  }

  return `Row ${index + 1}`;
}

export function DataTable({ result }: DataTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("period");
  const [sortAsc, setSortAsc] = useState(true);

  const rows = useMemo<TableRow[]>(
    () =>
      result.data.map((item, index) => ({
        index,
        period: getRowLabel(item, index),
        value: typeof item.value === "number" ? item.value : 0,
      })),
    [result]
  );

  const sorted = useMemo(() => {
    return [...rows].sort((a, b) => {
      const comparison =
        sortKey === "period" ? a.index - b.index : a.value - b.value;
      return sortAsc ? comparison : -comparison;
    });
  }, [rows, sortKey, sortAsc]);

  const summary = useMemo(() => {
    if (rows.length === 0) return { label: "Total", value: 0 };

    if (result.summaryOperation === "average") {
      return {
        label: "Average",
        value: rows.reduce((sum, row) => sum + row.value, 0) / rows.length,
      };
    }

    if (result.summaryOperation === "latest") {
      return { label: "Latest", value: rows.at(-1)?.value ?? 0 };
    }

    return {
      label: "Total",
      value: rows.reduce((sum, row) => sum + row.value, 0),
    };
  }, [result.summaryOperation, rows]);

  function toggleSort(key: SortKey) {
    if (key === sortKey) setSortAsc((current) => !current);
    else {
      setSortKey(key);
      setSortAsc(true);
    }
  }

  const SortIcon = sortAsc ? ChevronUp : ChevronDown;

  return (
    <section className="shrink-0 border-t border-zinc-100 bg-white">
      <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-2.5 sm:px-6">
        <div className="flex items-center gap-2">
          <Table2 className="h-3.5 w-3.5 text-zinc-500" />
          <h3 className="text-xs font-semibold text-zinc-800">
            {result.metricName}
          </h3>
        </div>
        <span className="text-[10px] text-zinc-400">{rows.length} rows</span>
      </div>

      <div className="max-h-[280px] overflow-auto">
        <table className="w-full text-xs">
          <caption className="sr-only">
            Values for {result.metricName} from {result.source.label}
          </caption>
          <thead className="sticky top-0 border-b border-zinc-200 bg-white">
            <tr className="text-left">
              <th
                aria-sort={
                  sortKey === "period"
                    ? sortAsc
                      ? "ascending"
                      : "descending"
                    : "none"
                }
                className="px-3 py-2"
              >
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 hover:text-zinc-700"
                  onClick={() => toggleSort("period")}
                >
                  Period
                  {sortKey === "period" && <SortIcon className="h-3 w-3" />}
                </button>
              </th>
              <th
                aria-sort={
                  sortKey === "value"
                    ? sortAsc
                      ? "ascending"
                      : "descending"
                    : "none"
                }
                className="px-3 py-2 text-right"
              >
                <button
                  type="button"
                  className="ml-auto inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 hover:text-zinc-700"
                  onClick={() => toggleSort("value")}
                >
                  Value
                  {sortKey === "value" && <SortIcon className="h-3 w-3" />}
                </button>
              </th>
            </tr>
          </thead>

          <tbody>
            {sorted.map((row) => (
              <tr
                key={`${row.period}-${row.index}`}
                className="border-b border-zinc-50 transition-colors hover:bg-zinc-50/50"
              >
                <td className="px-3 py-2 font-medium text-zinc-700">
                  {row.period}
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-zinc-700">
                  {formatMetricValue(row.value, result.unit)}
                </td>
              </tr>
            ))}
          </tbody>

          <tfoot className="sticky bottom-0 border-t-2 border-zinc-200 bg-zinc-50">
            <tr className="font-semibold">
              <td className="px-3 py-2 text-zinc-800">{summary.label}</td>
              <td className="px-3 py-2 text-right tabular-nums text-zinc-900">
                {formatMetricValue(summary.value, result.unit)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}

export default DataTable;
