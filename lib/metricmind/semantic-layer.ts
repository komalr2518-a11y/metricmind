// ═══════════════════════════════════════════════════
// MetricMind — Semantic Layer: Governed Metric Definitions
// All business metrics defined as code, decoupled from BI tools
// ═══════════════════════════════════════════════════

export interface MetricDefinition {
  id: string;
  name: string;
  category: "Revenue" | "Profitability" | "Customer" | "Growth" | "Efficiency";
  formula: string;
  description: string;
  unit: string;
  cube: string;
  dimensions: string[];
  compatibleCharts: ("line" | "bar" | "pie" | "heatmap" | "table")[];
}

export interface MetricQuery {
  metricId: string;
  filters?: Record<string, string>;
  timeRange?: { from: string; to: string };
  granularity?: "monthly" | "quarterly" | "yearly";
  dimensions?: string[];
}

export interface MetricResult {
  metricId: string;
  metricName: string;
  query: MetricQuery;
  data: Record<string, string | number>[];
  summary: string;
  chartConfig: ChartConfig;
}

export interface ChartConfig {
  type: "line" | "bar" | "pie" | "heatmap" | "table";
  title: string;
  xAxis?: { label: string; data: string[] };
  yAxis?: { label: string };
  series: ChartSeries[];
}

export interface ChartSeries {
  name: string;
  data: number[];
  color?: string;
}

// ─── Metric Catalog ───
export const METRIC_CATALOG: MetricDefinition[] = [
  {
    id: "total_revenue",
    name: "Total Revenue",
    category: "Revenue",
    formula: "SUM(net_revenue)",
    description: "Total net revenue after discounts and returns across all regions and products.",
    unit: "USD",
    cube: "OrdersCube",
    dimensions: ["region", "product_category", "customer_tier", "date"],
    compatibleCharts: ["line", "bar", "table"],
  },
  {
    id: "gross_margin",
    name: "Gross Margin",
    category: "Profitability",
    formula: "(SUM(net_revenue) - SUM(cost_of_goods_sold)) / SUM(net_revenue) * 100",
    description: "Gross profit margin percentage, calculated as (Revenue - COGS) / Revenue.",
    unit: "%",
    cube: "OrdersCube",
    dimensions: ["region", "product_category", "date"],
    compatibleCharts: ["line", "bar"],
  },
  {
    id: "net_profit",
    name: "Net Profit",
    category: "Profitability",
    formula: "SUM(net_revenue) - SUM(cost_of_goods_sold) - SUM(operating_expenses)",
    description: "Net profit after deducting COGS and operating expenses.",
    unit: "USD",
    cube: "OrdersCube",
    dimensions: ["region", "product_category", "date"],
    compatibleCharts: ["line", "bar", "table"],
  },
  {
    id: "churn_rate",
    name: "Customer Churn Rate",
    category: "Customer",
    formula: "(Customers at Start - Customers at End) / Customers at Start * 100",
    description: "Percentage of customers lost during the period.",
    unit: "%",
    cube: "CustomersCube",
    dimensions: ["region", "customer_tier", "date"],
    compatibleCharts: ["line", "bar"],
  },
  {
    id: "nrr",
    name: "Net Revenue Retention",
    category: "Growth",
    formula: "(Starting MRR + Expansion - Contraction - Churn) / Starting MRR * 100",
    description: "Net revenue retained from existing customers, including expansion and churn.",
    unit: "%",
    cube: "CustomersCube",
    dimensions: ["region", "customer_tier", "date"],
    compatibleCharts: ["line", "bar"],
  },
  {
    id: "arpu",
    name: "Average Revenue Per User",
    category: "Revenue",
    formula: "SUM(net_revenue) / COUNT(DISTINCT customer_id)",
    description: "Average revenue generated per unique customer in the period.",
    unit: "USD",
    cube: "OrdersCube",
    dimensions: ["region", "customer_tier", "product_category", "date"],
    compatibleCharts: ["line", "bar"],
  },
  {
    id: "total_orders",
    name: "Total Orders",
    category: "Efficiency",
    formula: "COUNT(DISTINCT order_id)",
    description: "Total number of unique orders placed in the period.",
    unit: "#",
    cube: "OrdersCube",
    dimensions: ["region", "product_category", "customer_tier", "date"],
    compatibleCharts: ["line", "bar", "table"],
  },
  {
    id: "avg_order_value",
    name: "Average Order Value",
    category: "Efficiency",
    formula: "SUM(net_revenue) / COUNT(DISTINCT order_id)",
    description: "Average revenue per order.",
    unit: "USD",
    cube: "OrdersCube",
    dimensions: ["region", "product_category", "customer_tier", "date"],
    compatibleCharts: ["line", "bar"],
  },
  {
    id: "customer_count",
    name: "Active Customers",
    category: "Customer",
    formula: "COUNT(DISTINCT customer_id)",
    description: "Number of unique customers with at least one order in the period.",
    unit: "#",
    cube: "CustomersCube",
    dimensions: ["region", "customer_tier", "date"],
    compatibleCharts: ["line", "bar", "table"],
  },
  {
    id: "new_customers",
    name: "New Customers",
    category: "Growth",
    formula: "COUNT(DISTINCT CASE WHEN first_order_date IN period THEN customer_id END)",
    description: "Number of customers who placed their first order in the period.",
    unit: "#",
    cube: "CustomersCube",
    dimensions: ["region", "customer_tier", "date"],
    compatibleCharts: ["bar", "line"],
  },
  {
    id: "revenue_by_region",
    name: "Revenue by Region",
    category: "Revenue",
    formula: "SUM(net_revenue) GROUP BY region",
    description: "Total revenue broken down by geographic region.",
    unit: "USD",
    cube: "OrdersCube",
    dimensions: ["region", "date"],
    compatibleCharts: ["bar", "pie", "table"],
  },
  {
    id: "revenue_by_category",
    name: "Revenue by Product Category",
    category: "Revenue",
    formula: "SUM(net_revenue) GROUP BY product_category",
    description: "Total revenue broken down by product category.",
    unit: "USD",
    cube: "OrdersCube",
    dimensions: ["product_category", "date"],
    compatibleCharts: ["bar", "pie", "table"],
  },
  {
    id: "cogs",
    name: "Cost of Goods Sold",
    category: "Profitability",
    formula: "SUM(cost_of_goods_sold)",
    description: "Total direct costs attributable to the production of goods sold.",
    unit: "USD",
    cube: "OrdersCube",
    dimensions: ["region", "product_category", "date"],
    compatibleCharts: ["line", "bar", "table"],
  },
  {
    id: "operating_expense_ratio",
    name: "Operating Expense Ratio",
    category: "Efficiency",
    formula: "SUM(operating_expenses) / SUM(net_revenue) * 100",
    description: "Operating expenses as a percentage of revenue. Lower is more efficient.",
    unit: "%",
    cube: "OrdersCube",
    dimensions: ["region", "date"],
    compatibleCharts: ["line", "bar"],
  },
  {
    id: "customer_ltv",
    name: "Customer Lifetime Value",
    category: "Customer",
    formula: "ARPU * Average Customer Lifespan (months)",
    description: "Estimated total revenue a customer generates over their entire relationship.",
    unit: "USD",
    cube: "CustomersCube",
    dimensions: ["region", "customer_tier", "date"],
    compatibleCharts: ["bar", "table"],
  },
];

// ─── Mock Data Generator ───
const REGIONS = ["North America", "Europe", "Asia-Pacific", "Latin America"];
const CATEGORIES = ["Electronics", "SaaS", "Consulting", "Hardware"];
const TIERS = ["Enterprise", "Mid-Market", "SMB"];
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
};

// ─── Query Executor ───
export function executeMetricQuery(query: MetricQuery): MetricResult {
  const metric = METRIC_CATALOG.find((m) => m.id === query.metricId);
  if (!metric) throw new Error(`Metric not found: ${query.metricId}`);

  const d = DATA[query.metricId];
  if (!d) throw new Error(`No data for metric: ${query.metricId}`);

  const granularity = query.granularity || "monthly";
  const dimension = query.dimensions?.[0];
  const timeData = granularity === "quarterly" ? d.quarterly : d.monthly;
  const timeLabels = granularity === "quarterly" ? QUARTERS : MONTHS;

  // Build chart config based on the query
  let chartConfig: ChartConfig;
  let data: Record<string, string | number>[];
  let summary: string;

  if (dimension === "region" || query.metricId === "revenue_by_region") {
    chartConfig = {
      type: "bar",
      title: `${metric.name} by Region (${granularity === "quarterly" ? "FY 2025" : "FY 2025"})`,
      series: [{ name: metric.name, data: Object.values(d.regional), color: "#D4875A" }],
      xAxis: { label: "Region", data: Object.keys(d.regional) },
      yAxis: { label: metric.unit },
    };
    data = Object.entries(d.regional).map(([k, v]) => ({ region: k, value: v }));
    summary = `${metric.name} is highest in ${Object.keys(d.regional).reduce((a, b) => d.regional[a] > d.regional[b] ? a : b)} at $${Object.values(d.regional).reduce((a, b) => Math.max(a, b)).toLocaleString()} ${metric.unit}.`;
  } else if (dimension === "product_category" || query.metricId === "revenue_by_category") {
    const cats = Object.entries(d.byCategory);
    chartConfig = {
      type: "pie",
      title: `${metric.name} by Category`,
      series: [{ name: metric.name, data: cats.map(([, v]) => v), color: "#D4875A" }],
      xAxis: { label: "Category", data: cats.map(([k]) => k) },
    };
    data = cats.map(([k, v]) => ({ category: k, value: v }));
    const total = cats.reduce((s, [, v]) => s + v, 0);
    const top = cats.reduce((a, b) => b[1] > a[1] ? b : a);
    summary = `${top[0]} leads with $${top[1].toLocaleString()} (${((top[1] / total) * 100).toFixed(1)}% of total ${metric.name}).`;
  } else if (dimension === "customer_tier") {
    chartConfig = {
      type: "bar",
      title: `${metric.name} by Customer Tier`,
      series: [{ name: metric.name, data: Object.values(d.byTier), color: "#D4875A" }],
      xAxis: { label: "Tier", data: Object.keys(d.byTier) },
      yAxis: { label: metric.unit },
    };
    data = Object.entries(d.byTier).map(([k, v]) => ({ tier: k, value: v }));
    summary = `Enterprise tier contributes the highest ${metric.name.toLowerCase()} at ${Object.values(d.byTier)[0].toLocaleString()} ${metric.unit}.`;
  } else {
    // Time series (default)
    const trend = timeData[timeData.length - 1] - timeData[0];
    const trendPct = ((trend / timeData[0]) * 100).toFixed(1);
    const trendDir = trend > 0 ? "increased" : "decreased";
    const avg = (timeData.reduce((s, v) => s + v, 0) / timeData.length).toFixed(0);
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
    summary = `${metric.name} has ${trendDir} by ${Math.abs(parseFloat(trendPct))}% over FY 2025, from ${timeData[0].toLocaleString()} to ${timeData[timeData.length - 1].toLocaleString()} ${metric.unit}. Average: ${Number(avg).toLocaleString()} ${metric.unit}. Peak: ${max.toLocaleString()} ${metric.unit} in ${timeLabels[maxIdx]}.`;
  }

  return { metricId: query.metricId, metricName: metric.name, query, data, summary, chartConfig };
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