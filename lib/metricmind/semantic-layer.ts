import { METRIC_CATALOG } from "./catalog";
import { formatMetricValue } from "./format";
import type {
  ChartConfig,
  MetricDefinition,
  MetricQuery,
  MetricResult,
} from "./types";

const DEMO_SOURCE = {
  kind: "demo" as const,
  label: "Deterministic local demo dataset",
  period: "FY 2025",
};

// ─── Mock Data Generator ───
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const QUARTERS = ["Q1", "Q2", "Q3", "Q4"];

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const rng = seededRandom(42);

function generateMonthlyData(baseValue: number, volatility: number, trend: number = 0): number[] {
  const data: number[] = [];
  let current = baseValue;
  for (let i = 0; i < 12; i++) {
    current = current + trend + (rng() - 0.45) * volatility;
    data.push(Math.round(current * 100) / 100);
  }
  return data;
}

function generateRegionalBreakdown(basePerRegion: number): Record<string, number> {
  return {
    "North America": Math.round(basePerRegion * 3.2 * (0.9 + rng() * 0.2)),
    "Europe": Math.round(basePerRegion * 2.8 * (0.85 + rng() * 0.15)),
    "Asia-Pacific": Math.round(basePerRegion * 2.1 * (0.9 + rng() * 0.2)),
    "Latin America": Math.round(basePerRegion * 0.9 * (0.8 + rng() * 0.3)),
  };
}

// ─── Pre-computed datasets ───
const DATA: Record<string, { monthly: number[]; quarterly: number[]; regional: Record<string, number>; byCategory: Record<string, number>; byTier: Record<string, number> }> = {
  total_revenue: {
    monthly: generateMonthlyData(420000, 40000, 8000),
    quarterly: [1280000, 1360000, 1440000, 1520000],
    regional: generateRegionalBreakdown(380000),
    byCategory: { Electronics: 1820000, SaaS: 1450000, Consulting: 890000, Hardware: 440000 },
    byTier: { Enterprise: 2680000, "Mid-Market": 1250000, SMB: 670000 },
  },
  gross_margin: {
    monthly: generateMonthlyData(42, 3, -0.5),
    quarterly: [43.2, 42.5, 41.8, 40.9],
    regional: { "North America": 44.1, "Europe": 39.2, "Asia-Pacific": 41.5, "Latin America": 38.7 },
    byCategory: { Electronics: 38.5, SaaS: 72.3, Consulting: 55.1, Hardware: 28.4 },
    byTier: { Enterprise: 45.2, "Mid-Market": 41.8, SMB: 37.5 },
  },
  net_profit: {
    monthly: generateMonthlyData(85000, 15000, 3000),
    quarterly: [265000, 285000, 310000, 335000],
    regional: generateRegionalBreakdown(75000),
    byCategory: { Electronics: 310000, SaaS: 420000, Consulting: 280000, Hardware: 85000 },
    byTier: { Enterprise: 580000, "Mid-Market": 265000, SMB: 250000 },
  },
  churn_rate: {
    monthly: generateMonthlyData(3.2, 0.8, 0.15),
    quarterly: [9.1, 9.8, 10.5, 11.2],
    regional: { "North America": 3.1, "Europe": 4.2, "Asia-Pacific": 3.5, "Latin America": 5.1 },
    byCategory: { Electronics: 4.8, SaaS: 3.2, Consulting: 5.5, Hardware: 6.1 },
    byTier: { Enterprise: 2.1, "Mid-Market": 4.5, SMB: 8.2 },
  },
  nrr: {
    monthly: generateMonthlyData(112, 5, -1.2),
    quarterly: [115.2, 113.8, 111.5, 109.1],
    regional: { "North America": 118.3, "Europe": 106.5, "Asia-Pacific": 110.2, "Latin America": 102.8 },
    byCategory: { Electronics: 105.8, SaaS: 125.3, Consulting: 108.2, Hardware: 98.5 },
    byTier: { Enterprise: 122.5, "Mid-Market": 112.8, SMB: 98.2 },
  },
  arpu: {
    monthly: generateMonthlyData(285, 25, 5),
    quarterly: [275, 285, 298, 312],
    regional: { "North America": 342, "Europe": 298, "Asia-Pacific": 245, "Latin America": 168 },
    byCategory: { Electronics: 312, SaaS: 425, Consulting: 198, Hardware: 145 },
    byTier: { Enterprise: 1250, "Mid-Market": 485, SMB: 125 },
  },
  total_orders: {
    monthly: generateMonthlyData(12500, 1500, 300),
    quarterly: [38000, 40500, 43200, 46000],
    regional: generateRegionalBreakdown(10500),
    byCategory: { Electronics: 52000, SaaS: 35000, Consulting: 28000, Hardware: 52700 },
    byTier: { Enterprise: 18000, "Mid-Market": 42000, SMB: 107700 },
  },
  avg_order_value: {
    monthly: generateMonthlyData(33.6, 2, 0.5),
    quarterly: [33.2, 33.8, 34.1, 34.5],
    regional: { "North America": 38.5, "Europe": 35.2, "Asia-Pacific": 28.8, "Latin America": 22.1 },
    byCategory: { Electronics: 35.0, SaaS: 41.4, Consulting: 31.8, Hardware: 8.4 },
    byTier: { Enterprise: 148.9, "Mid-Market": 29.8, SMB: 6.2 },
  },
  customer_count: {
    monthly: generateMonthlyData(14200, 800, 350),
    quarterly: [14200, 15500, 16900, 18300],
    regional: generateRegionalBreakdown(4200),
    byCategory: { Electronics: 22000, SaaS: 15000, Consulting: 9500, Hardware: 18400 },
    byTier: { Enterprise: 4200, "Mid-Market": 9800, SMB: 50900 },
  },
  new_customers: {
    monthly: generateMonthlyData(850, 120, -30),
    quarterly: [2650, 2480, 2320, 2180],
    regional: generateRegionalBreakdown(600),
    byCategory: { Electronics: 3200, SaaS: 2800, Consulting: 1800, Hardware: 1830 },
    byTier: { Enterprise: 180, "Mid-Market": 1200, SMB: 9250 },
  },
  revenue_by_region: {
    monthly: generateMonthlyData(420000, 40000, 8000),
    quarterly: [1280000, 1360000, 1440000, 1520000],
    regional: generateRegionalBreakdown(380000),
    byCategory: { Electronics: 1820000, SaaS: 1450000, Consulting: 890000, Hardware: 440000 },
    byTier: { Enterprise: 2680000, "Mid-Market": 1250000, SMB: 670000 },
  },
  revenue_by_category: {
    monthly: generateMonthlyData(420000, 40000, 8000),
    quarterly: [1280000, 1360000, 1440000, 1520000],
    regional: generateRegionalBreakdown(380000),
    byCategory: { Electronics: 1820000, SaaS: 1450000, Consulting: 890000, Hardware: 440000 },
    byTier: { Enterprise: 2680000, "Mid-Market": 1250000, SMB: 670000 },
  },
  cogs: {
    monthly: generateMonthlyData(240000, 25000, 6000),
    quarterly: [725000, 775000, 835000, 895000],
    regional: generateRegionalBreakdown(215000),
    byCategory: { Electronics: 1120000, SaaS: 402000, Consulting: 400000, Hardware: 315000 },
    byTier: { Enterprise: 1470000, "Mid-Market": 730000, SMB: 337000 },
  },
  operating_expense_ratio: {
    monthly: generateMonthlyData(28, 2, 0.3),
    quarterly: [27.5, 28.2, 28.9, 29.5],
    regional: { "North America": 26.8, "Europe": 29.5, "Asia-Pacific": 28.1, "Latin America": 32.4 },
    byCategory: { Electronics: 25.2, SaaS: 22.8, Consulting: 35.1, Hardware: 30.5 },
    byTier: { Enterprise: 24.2, "Mid-Market": 28.5, SMB: 35.8 },
  },
  customer_ltv: {
    monthly: generateMonthlyData(4250, 400, -50),
    quarterly: [4400, 4250, 4100, 3950],
    regional: { "North America": 5200, "Europe": 4300, "Asia-Pacific": 3800, "Latin America": 2400 },
    byCategory: { Electronics: 4800, SaaS: 7200, Consulting: 3500, Hardware: 1800 },
    byTier: { Enterprise: 18500, "Mid-Market": 4800, SMB: 1200 },
  },
  mrr: {
    monthly: [820000, 845000, 872000, 898000, 925000, 954000, 986000, 1015000, 1048000, 1083000, 1119000, 1158000],
    quarterly: [845000, 925000, 1015000, 1158000],
    regional: { "North America": 542000, "Europe": 318000, "Asia-Pacific": 221000, "Latin America": 77000 },
    byCategory: { Electronics: 214000, SaaS: 668000, Consulting: 196000, Hardware: 80000 },
    byTier: { Enterprise: 638000, "Mid-Market": 356000, SMB: 164000 },
  },
  ebitda_margin: {
    monthly: [24.8, 25.1, 25.6, 26.2, 25.9, 26.8, 27.1, 27.6, 28.2, 28.7, 29.1, 29.8],
    quarterly: [25.2, 26.3, 27.6, 29.2],
    regional: { "North America": 31.4, "Europe": 27.2, "Asia-Pacific": 25.8, "Latin America": 19.6 },
    byCategory: { Electronics: 22.6, SaaS: 41.8, Consulting: 30.4, Hardware: 16.9 },
    byTier: { Enterprise: 34.2, "Mid-Market": 27.1, SMB: 20.5 },
  },
  cac: {
    monthly: [482, 475, 468, 461, 455, 447, 438, 431, 423, 416, 409, 398],
    quarterly: [475, 456, 431, 408],
    regional: { "North America": 455, "Europe": 418, "Asia-Pacific": 362, "Latin America": 295 },
    byCategory: { Electronics: 428, SaaS: 512, Consulting: 385, Hardware: 318 },
    byTier: { Enterprise: 1450, "Mid-Market": 565, SMB: 182 },
  },
  conversion_rate: {
    monthly: [3.4, 3.6, 3.7, 3.9, 4.1, 4.0, 4.3, 4.5, 4.7, 4.8, 5.0, 5.2],
    quarterly: [3.6, 4.0, 4.5, 5.0],
    regional: { "North America": 5.6, "Europe": 4.9, "Asia-Pacific": 4.3, "Latin America": 3.8 },
    byCategory: { Electronics: 4.7, SaaS: 6.2, Consulting: 3.9, Hardware: 3.4 },
    byTier: { Enterprise: 6.8, "Mid-Market": 5.1, SMB: 4.0 },
  },
  refund_rate: {
    monthly: [4.8, 4.6, 4.5, 4.2, 4.1, 3.9, 3.8, 3.7, 3.5, 3.4, 3.2, 3.1],
    quarterly: [4.6, 4.1, 3.7, 3.2],
    regional: { "North America": 2.8, "Europe": 3.2, "Asia-Pacific": 3.7, "Latin America": 4.5 },
    byCategory: { Electronics: 3.8, SaaS: 1.2, Consulting: 2.1, Hardware: 5.4 },
    byTier: { Enterprise: 2.0, "Mid-Market": 3.1, SMB: 4.4 },
  },
};

// ─── Query Executor ───
export function executeMetricQuery(query: MetricQuery): MetricResult {
  const metric = METRIC_CATALOG.find((m) => m.id === query.metricId);
  if (!metric) throw new Error(`Metric not found: ${query.metricId}`);

  const d = DATA[query.metricId];
  if (!d) throw new Error(`No data for metric: ${query.metricId}`);

  const granularity = query.granularity || "monthly";
  const dimension = query.dimensions?.[0];

  if (dimension && !metric.dimensions.includes(dimension)) {
    throw new Error(
      `${metric.name} cannot be grouped by ${dimension.replaceAll("_", " ")}.`
    );
  }

  const timeData = granularity === "quarterly" ? d.quarterly : d.monthly;
  const timeLabels = granularity === "quarterly" ? QUARTERS : MONTHS;

  // Build chart config based on the query
  let chartConfig: ChartConfig;
  let data: Record<string, string | number>[];
  let summary: string;

  if (dimension === "region" || query.metricId === "revenue_by_region") {
    const regionalEntries = Object.entries(d.regional);
    const top = regionalEntries.reduce((best, entry) =>
      entry[1] > best[1] ? entry : best
    );

    chartConfig = {
      type: "bar",
      title:
        query.metricId === "revenue_by_region"
          ? `${metric.name} (FY 2025)`
          : `${metric.name} by Region (FY 2025)`,
      series: [{ name: metric.name, data: Object.values(d.regional), color: "#D4875A" }],
      xAxis: { label: "Region", data: Object.keys(d.regional) },
      yAxis: { label: metric.unit },
    };
    data = regionalEntries.map(([region, value]) => ({ region, value }));
    summary = `${metric.name} is highest in ${top[0]} at ${formatMetricValue(
      top[1],
      metric.unit
    )}.`;
  } else if (dimension === "product_category" || query.metricId === "revenue_by_category") {
    const cats = Object.entries(d.byCategory);
    chartConfig = {
      type: "pie",
      title:
        query.metricId === "revenue_by_category"
          ? metric.name
          : `${metric.name} by Product Category`,
      series: [{ name: metric.name, data: cats.map(([, v]) => v), color: "#D4875A" }],
      xAxis: { label: "Category", data: cats.map(([k]) => k) },
      yAxis: { label: metric.unit },
    };
    data = cats.map(([k, v]) => ({ category: k, value: v }));
    const total = cats.reduce((s, [, v]) => s + v, 0);
    const top = cats.reduce((a, b) => b[1] > a[1] ? b : a);
    const share = total === 0 ? 0 : (top[1] / total) * 100;
    summary = `${top[0]} leads with ${formatMetricValue(
      top[1],
      metric.unit
    )} (${share.toFixed(1)}% of the displayed total).`;
  } else if (dimension === "customer_tier") {
    const tierEntries = Object.entries(d.byTier);
    const top = tierEntries.reduce((best, entry) =>
      entry[1] > best[1] ? entry : best
    );

    chartConfig = {
      type: "bar",
      title: `${metric.name} by Customer Tier`,
      series: [{ name: metric.name, data: Object.values(d.byTier), color: "#D4875A" }],
      xAxis: { label: "Tier", data: Object.keys(d.byTier) },
      yAxis: { label: metric.unit },
    };
    data = tierEntries.map(([tier, value]) => ({ tier, value }));
    summary = `${top[0]} has the highest ${metric.name.toLowerCase()} at ${formatMetricValue(
      top[1],
      metric.unit
    )}.`;
  } else {
    // Time series (default)
    const trend = timeData[timeData.length - 1] - timeData[0];
    const trendPct = timeData[0] === 0 ? null : (trend / timeData[0]) * 100;
    const trendDir = trend > 0 ? "increased" : trend < 0 ? "decreased" : "was flat";
    const avg = timeData.reduce((s, v) => s + v, 0) / timeData.length;
    const max = Math.max(...timeData);
    const maxIdx = timeData.indexOf(max);

    chartConfig = {
      type: "line",
      title: `${metric.name} Trend (${granularity === "quarterly" ? "Quarterly" : "Monthly"}, FY 2025)`,
      series: [{ name: metric.name, data: timeData, color: "#D4875A" }],
      xAxis: { label: granularity === "quarterly" ? "Quarter" : "Month", data: timeLabels },
      yAxis: { label: metric.unit },
    };
    data = timeLabels.map((label, i) => ({ period: label, value: timeData[i] }));
    const changeSummary =
      trendPct === null
        ? `${metric.name} moved from a zero baseline to ${formatMetricValue(
            timeData[timeData.length - 1],
            metric.unit
          )}`
        : trend === 0
          ? `${metric.name} was flat at ${formatMetricValue(
              timeData[0],
              metric.unit
            )}`
          : `${metric.name} ${trendDir} by ${Math.abs(trendPct).toFixed(
              1
            )}%, from ${formatMetricValue(
              timeData[0],
              metric.unit
            )} to ${formatMetricValue(
              timeData[timeData.length - 1],
              metric.unit
            )}`;

    summary = `${changeSummary} over FY 2025. Average: ${formatMetricValue(
      avg,
      metric.unit
    )}. Peak: ${formatMetricValue(max, metric.unit)} in ${timeLabels[maxIdx]}.`;
  }

  return {
    metricId: query.metricId,
    metricName: metric.name,
    unit: metric.unit,
    summaryOperation: metric.summaryOperation,
    source: DEMO_SOURCE,
    query,
    data,
    summary,
    chartConfig,
  };
}

// ─── Search metrics by keyword ───
export function searchMetrics(query: string): MetricDefinition[] {
  const q = query.toLowerCase();
  return METRIC_CATALOG.filter(
    (m) =>
      m.name.toLowerCase().includes(q) ||
      m.description.toLowerCase().includes(q) ||
      m.category.toLowerCase().includes(q) ||
      m.id.includes(q)
  );
}

export { METRIC_CATALOG } from "./catalog";
export type {
  ChartConfig,
  MetricDefinition,
  MetricQuery,
  MetricResult,
} from "./types";
