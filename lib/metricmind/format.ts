import type { MetricUnit } from "./types";

interface FormatOptions {
  compact?: boolean;
}

export function formatMetricValue(
  value: number,
  unit: MetricUnit,
  { compact = false }: FormatOptions = {}
): string {
  if (!Number.isFinite(value)) {
    return "—";
  }

  const maximumFractionDigits = Number.isInteger(value) ? 0 : 2;

  if (unit === "USD") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: compact ? "compact" : "standard",
      maximumFractionDigits: compact ? 2 : maximumFractionDigits,
    }).format(value);
  }

  if (unit === "%") {
    return `${new Intl.NumberFormat("en-US", {
      maximumFractionDigits: 2,
    }).format(value)}%`;
  }

  return new Intl.NumberFormat("en-US", {
    notation: compact ? "compact" : "standard",
    maximumFractionDigits,
  }).format(value);
}
