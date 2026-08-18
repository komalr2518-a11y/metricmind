export type MetricCategory =
  | "Revenue"
  | "Profitability"
  | "Customer"
  | "Growth"
  | "Efficiency";

export type MetricUnit = "USD" | "%" | "#";
export type SummaryOperation = "sum" | "average" | "latest";
export type FavorableDirection = "up" | "down" | "contextual";
export type ChartType = "line" | "bar" | "pie" | "heatmap" | "table";

export interface MetricDefinition {
  id: string;
  name: string;
  category: MetricCategory;
  formula: string;
  description: string;
  unit: MetricUnit;
  cube: string;
  dimensions: string[];
  compatibleCharts: ChartType[];
  summaryOperation: SummaryOperation;
  favorableDirection: FavorableDirection;
}

export interface MetricQuery {
  metricId: string;
  granularity?: "monthly" | "quarterly";
  dimensions?: string[];
}

export interface MetricDataSource {
  kind: "demo";
  label: string;
  period: string;
}

export interface MetricResult {
  metricId: string;
  metricName: string;
  unit: MetricUnit;
  summaryOperation: SummaryOperation;
  source: MetricDataSource;
  query: MetricQuery;
  data: Record<string, string | number>[];
  summary: string;
  chartConfig: ChartConfig;
}

export interface ChartConfig {
  type: ChartType;
  title: string;
  xAxis?: { label: string; data: string[] };
  yAxis?: { label: MetricUnit };
  series: ChartSeries[];
}

export interface ChartSeries {
  name: string;
  data: number[];
  color?: string;
}

export interface AgentResponse {
  message: string;
  metricResult?: MetricResult;
  metricDef?: MetricDefinition;
  suggestedFollowUps: string[];
}
