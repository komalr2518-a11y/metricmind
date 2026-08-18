import type { MetricResult } from "./types";

export interface MetricTableSummary {
  label: "Average" | "Latest" | "Total";
  value: number;
}

const DIMENSION_LABELS = [
  ["region", "Region"],
  ["category", "Product category"],
  ["tier", "Customer tier"],
  ["period", "Period"],
] as const;

export function getMetricTableDimensionLabel(result: MetricResult): string {
  const firstRow = result.data[0];
  if (!firstRow) return "Period";

  return (
    DIMENSION_LABELS.find(([key]) => typeof firstRow[key] === "string")?.[1] ??
    "Period"
  );
}

export function summarizeMetricTable(result: MetricResult): MetricTableSummary {
  const values = result.data.map((row) =>
    typeof row.value === "number" ? row.value : 0
  );
  if (values.length === 0) return { label: "Total", value: 0 };

  const total = values.reduce((sum, value) => sum + value, 0);
  const isTimeSeries = result.data.every(
    (row) => typeof row.period === "string"
  );

  if (result.summaryOperation === "average") {
    return { label: "Average", value: total / values.length };
  }

  if (result.summaryOperation === "latest" && isTimeSeries) {
    return { label: "Latest", value: values.at(-1) ?? 0 };
  }

  return { label: "Total", value: total };
}
