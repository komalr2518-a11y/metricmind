import { METRIC_CATALOG } from "./catalog";
import { formatMetricValue } from "./format";
import { executeMetricQuery } from "./semantic-layer";
import type {
  AgentResponse,
  MetricDefinition,
  MetricResult,
} from "./types";

interface ParsedIntent {
  metricId: string;
  dimension?: string;
  granularity: "monthly" | "quarterly";
  questionType:
    | "trend"
    | "breakdown"
    | "comparison"
    | "ranking"
    | "single"
    | "why";
}

const DEFAULT_FOLLOW_UPS = [
  "Show me Total Revenue trend",
  "Break down Total Revenue by region",
  "Show me Customer Churn Rate trend",
  "Which month had the highest Monthly Recurring Revenue?",
  "Show Conversion Rate by product category",
  "List all available metrics",
];

function includesAny(message: string, terms: string[]): boolean {
  return terms.some((term) => message.includes(term));
}

export function parseIntent(userMessage: string): ParsedIntent {
  const message = userMessage.toLowerCase();
  let metricId = "total_revenue";

  if (message.includes("net profit")) metricId = "net_profit";
  else if (message.includes("ebitda")) metricId = "ebitda_margin";
  else if (message.includes("margin")) metricId = "gross_margin";
  else if (message.includes("churn")) metricId = "churn_rate";
  else if (includesAny(message, ["refund", "return rate"])) {
    metricId = "refund_rate";
  } else if (message.includes("conversion")) metricId = "conversion_rate";
  else if (
    includesAny(message, ["acquisition cost", "customer acquisition cost", "cac"])
  ) metricId = "cac";
  else if (includesAny(message, ["monthly recurring", "mrr"])) metricId = "mrr";
  else if (includesAny(message, ["retention", "nrr"])) metricId = "nrr";
  else if (
    includesAny(message, ["arpu", "revenue per user", "per user", "per customer"])
  ) metricId = "arpu";
  else if (includesAny(message, ["new customer", "customer acquisit"])) {
    metricId = "new_customers";
  } else if (includesAny(message, ["order value", "avg order", "aov"])) {
    metricId = "avg_order_value";
  } else if (
    message.includes("order") &&
    includesAny(message, ["count", "total order", "how many order"])
  ) metricId = "total_orders";
  else if (
    message.includes("customer") &&
    includesAny(message, ["count", "active", "how many customer"])
  ) metricId = "customer_count";
  else if (includesAny(message, ["cogs", "cost of goods"])) metricId = "cogs";
  else if (includesAny(message, ["operating expense", "opex"])) {
    metricId = "operating_expense_ratio";
  } else if (includesAny(message, ["ltv", "lifetime value"])) {
    metricId = "customer_ltv";
  } else if (message.includes("revenue") && message.includes("region")) {
    metricId = "revenue_by_region";
  } else if (
    message.includes("revenue") &&
    includesAny(message, ["category", "product"])
  ) metricId = "revenue_by_category";

  let questionType: ParsedIntent["questionType"] = "single";

  if (includesAny(message, ["why", "reason", "cause", "what happened"])) {
    questionType = "why";
  } else if (
    includesAny(message, ["compare", " vs ", "versus", "difference"])
  ) {
    questionType = "comparison";
  } else if (
    includesAny(message, [
      "highest",
      "lowest",
      "best",
      "worst",
      "leader",
      "leading",
      "strongest",
      "weakest",
      "top ",
    ])
  ) {
    questionType = "ranking";
  } else if (
    includesAny(message, [
      "trend",
      "over time",
      "monthly",
      "quarterly",
      "last year",
      "history",
    ])
  ) {
    questionType = "trend";
  } else if (includesAny(message, ["break", " by ", "split"])) {
    questionType = "breakdown";
  }

  let dimension: string | undefined;
  if (
    includesAny(message, [
      "region",
      "geography",
      "north america",
      "europe",
      "asia",
      "latin america",
    ])
  ) {
    dimension = "region";
  } else if (includesAny(message, ["category", "product"])) {
    dimension = "product_category";
  } else if (includesAny(message, ["tier", "segment"])) {
    dimension = "customer_tier";
  }

  const granularity = includesAny(message, [
    "quarter",
    "q1",
    "q2",
    "q3",
    "q4",
  ])
    ? "quarterly"
    : "monthly";

  return { metricId, dimension, granularity, questionType };
}

function percentChange(current: number, previous: number): number | null {
  return previous === 0 ? null : ((current - previous) / previous) * 100;
}

function rowLabel(row: Record<string, string | number> | undefined): string {
  if (!row) return "latest period";

  for (const key of ["period", "region", "category", "tier"]) {
    if (typeof row[key] === "string") return row[key];
  }

  return "latest period";
}

function sourceNotice(result: MetricResult): string {
  return `> **Demo data:** ${result.source.label} (${result.source.period}). This prototype is not connected to a production warehouse.`;
}

function generateWhyAnalysis(
  intent: ParsedIntent,
  result: MetricResult,
  metric: MetricDefinition
): string {
  const values = result.data.map((row) => Number(row.value));
  const current = values.at(-1);
  const previous = values.at(-2);

  if (current === undefined || previous === undefined) {
    return `## ${metric.name} analysis\n\nThere is not enough historical data to analyze a change.\n\n${sourceNotice(
      result
    )}`;
  }

  const change = current - previous;
  const changePct = percentChange(current, previous);
  const direction =
    change > 0 ? "increased" : change < 0 ? "decreased" : "was flat";
  const period = rowLabel(result.data.at(-1));
  let narrative = `## Why did ${metric.name} change?\n\n`;

  narrative += `${metric.name} ${direction} from **${formatMetricValue(
    previous,
    metric.unit
  )}** to **${formatMetricValue(current, metric.unit)}** in ${period}`;
  narrative += changePct === null
    ? ".\n\n"
    : ` (${Math.abs(changePct).toFixed(1)}%).\n\n`;

  if (metric.id !== "gross_margin") {
    narrative += `The demo contains the outcome series but not the driver-level events needed to establish causation. It can show **what changed**, but a reliable “why” would require linked operational dimensions such as pricing, cohort, product mix, support, or campaign data.\n\n`;
    narrative += sourceNotice(result);
    return narrative;
  }

  const revenue = executeMetricQuery({
    metricId: "total_revenue",
    granularity: intent.granularity,
  });
  const cogs = executeMetricQuery({
    metricId: "cogs",
    granularity: intent.granularity,
  });
  const categoryMargins = executeMetricQuery({
    metricId: "gross_margin",
    dimensions: ["product_category"],
  });

  const revenueValues = revenue.data.map((row) => Number(row.value));
  const cogsValues = cogs.data.map((row) => Number(row.value));
  const revenueGrowth = percentChange(
    revenueValues.at(-1)!,
    revenueValues.at(-2)!
  );
  const cogsGrowth = percentChange(cogsValues.at(-1)!, cogsValues.at(-2)!);
  const lowestCategory = [...categoryMargins.data].sort(
    (a, b) => Number(a.value) - Number(b.value)
  )[0];

  narrative += `### Supporting signals\n\n`;
  narrative += `- Revenue changed by **${revenueGrowth?.toFixed(
    1
  ) ?? "N/A"}%** while COGS changed by **${cogsGrowth?.toFixed(
    1
  ) ?? "N/A"}%** in the same period. Faster cost growth is consistent with margin compression.\n`;
  narrative += `- ${rowLabel(
    lowestCategory
  )} has the lowest category margin in the current snapshot at **${formatMetricValue(
    Number(lowestCategory?.value),
    "%"
  )}**. A shift toward that category could add pressure.\n\n`;
  narrative += `### Interpretation\n\nThese are correlations in the demo data, not proof of causation. Confirm the hypothesis with transaction-level price, volume, cost, discount, and product-mix data before making a business decision.\n\n`;
  narrative += sourceNotice(result);

  return narrative;
}

function generateComparison(
  result: MetricResult,
  metric: MetricDefinition
): string {
  if (result.query.dimensions?.length) {
    const ranked = [...result.data].sort(
      (a, b) => Number(b.value) - Number(a.value)
    );
    const leader = ranked[0];
    const trailer = ranked.at(-1);
    const gap = Number(leader?.value) - Number(trailer?.value);

    return `## ${metric.name} comparison\n\n**${rowLabel(
      leader
    )}** leads at ${formatMetricValue(
      Number(leader?.value),
      metric.unit
    )}, a gap of ${formatMetricValue(gap, metric.unit)} over **${rowLabel(
      trailer
    )}**.\n\n${sourceNotice(result)}`;
  }

  const currentRow = result.data.at(-1);
  const previousRow = result.data.at(-2);
  const current = Number(currentRow?.value);
  const previous = Number(previousRow?.value);
  const change = current - previous;
  const changePct = percentChange(current, previous);

  return `## ${metric.name}: ${rowLabel(previousRow)} vs ${rowLabel(
    currentRow
  )}\n\n${rowLabel(currentRow)} is **${formatMetricValue(
    current,
    metric.unit
  )}**, ${formatMetricValue(Math.abs(change), metric.unit)} ${
    change >= 0 ? "higher" : "lower"
  } than ${rowLabel(previousRow)}${
    changePct === null ? "" : ` (${Math.abs(changePct).toFixed(1)}%)`
  }.\n\n${sourceNotice(result)}`;
}

function generateRanking(
  result: MetricResult,
  metric: MetricDefinition,
  userMessage: string
): string {
  const ranked = [...result.data].sort(
    (a, b) => Number(b.value) - Number(a.value)
  );
  const wantsLowest = includesAny(userMessage.toLowerCase(), [
    "lowest",
    "worst",
    "weakest",
  ]);
  const selected = wantsLowest ? ranked.at(-1) : ranked[0];
  const runnerUp = wantsLowest ? ranked.at(-2) : ranked[1];
  const direction = wantsLowest ? "lowest" : "highest";
  const ranking = (wantsLowest ? [...ranked].reverse() : ranked)
    .slice(0, 3)
    .map(
      (row, index) =>
        `${index + 1}. **${rowLabel(row)}** — ${formatMetricValue(
          Number(row.value),
          metric.unit
        )}`
    )
    .join("\n");
  const gap =
    selected && runnerUp
      ? Math.abs(Number(selected.value) - Number(runnerUp.value))
      : null;

  return `## ${direction === "highest" ? "Top" : "Lowest"} ${
    metric.name
  }\n\n**${rowLabel(selected)}** has the ${direction} value at **${formatMetricValue(
    Number(selected?.value),
    metric.unit
  )}**${
    gap === null
      ? "."
      : `, a ${formatMetricValue(gap, metric.unit)} gap from ${rowLabel(
          runnerUp
        )}.`
  }\n\n### ${wantsLowest ? "Bottom" : "Top"} 3\n\n${ranking}\n\n${sourceNotice(
    result
  )}`;
}

function generateBreakdownAnalysis(
  result: MetricResult,
  metric: MetricDefinition
): string {
  const ranked = [...result.data].sort(
    (a, b) => Number(b.value) - Number(a.value)
  );
  const top = ranked[0];
  const bottom = ranked.at(-1);
  const total = ranked.reduce((sum, row) => sum + Number(row.value), 0);
  const topShare =
    metric.summaryOperation === "sum" && total !== 0
      ? `, representing **${((Number(top?.value) / total) * 100).toFixed(
          1
        )}%** of the displayed total`
      : "";

  return `## ${result.chartConfig.title}\n\n${result.summary}\n\n### Key takeaways\n\n- **${rowLabel(
    top
  )}** leads at ${formatMetricValue(Number(top?.value), metric.unit)}${topShare}.\n- **${rowLabel(
    bottom
  )}** is lowest at ${formatMetricValue(Number(bottom?.value), metric.unit)}.\n- The spread between them is ${formatMetricValue(
    Math.abs(Number(top?.value) - Number(bottom?.value)),
    metric.unit
  )}.\n\n**Definition:** \`${metric.formula}\`\n\n${sourceNotice(result)}`;
}

function buildFollowUps(metric: MetricDefinition): string[] {
  const suggestions = [
    `Show me ${metric.name} trend`,
    `Compare ${metric.name} with last quarter`,
    `Which month had the highest ${metric.name}?`,
  ];

  if (metric.dimensions.includes("region")) {
    suggestions.push(`Break down ${metric.name} by region`);
  }
  if (metric.dimensions.includes("product_category")) {
    suggestions.push(`Break down ${metric.name} by product category`);
  }
  if (metric.dimensions.includes("customer_tier")) {
    suggestions.push(`Break down ${metric.name} by customer tier`);
  }
  if (metric.category === "Profitability") {
    suggestions.push(`Why did ${metric.name} change last quarter?`);
  }

  const relatedByMetric: Partial<Record<string, string>> = {
    total_revenue: "Show Monthly Recurring Revenue trend",
    gross_margin: "Show EBITDA Margin trend",
    churn_rate: "Which customer tier has the highest Customer Churn Rate?",
    nrr: "Which region has the lowest Net Revenue Retention?",
    arpu: "Show Customer Acquisition Cost trend",
    mrr: "Break down Monthly Recurring Revenue by customer tier",
    ebitda_margin: "Break down EBITDA Margin by product category",
    cac: "Which region has the lowest Customer Acquisition Cost?",
    conversion_rate: "Show Conversion Rate by product category",
    refund_rate: "Which product category has the highest Refund Rate?",
  };
  const related = relatedByMetric[metric.id];
  if (related) suggestions.push(related);

  return [...new Set(suggestions)].slice(0, 5);
}

export function processUserQuery(userMessage: string): AgentResponse {
  const message = userMessage.trim();
  const normalized = message.toLowerCase();

  if (
    includesAny(normalized, [
      "what metric",
      "list metric",
      "available metric",
      "help",
    ])
  ) {
    const categories = [
      ...new Set(METRIC_CATALOG.map((metric) => metric.category)),
    ];
    const byCategory = categories.map((category) => {
      const metrics = METRIC_CATALOG.filter(
        (metric) => metric.category === category
      );
      return `**${category}**: ${metrics.map((metric) => metric.name).join(", ")}`;
    });

    return {
      message: `MetricMind defines **${
        METRIC_CATALOG.length
      } demo metrics** across ${categories.length} categories:\n\n${byCategory.join(
        "\n\n"
      )}\n\nThe formulas and sample values are local to this prototype; no production data source is connected.`,
      suggestedFollowUps: DEFAULT_FOLLOW_UPS.slice(0, 3),
    };
  }

  const intent = parseIntent(message);
  const metric = METRIC_CATALOG.find((item) => item.id === intent.metricId);

  if (!metric) {
    return {
      message:
        "I could not find a matching metric. Try Revenue, Margin, Churn Rate, NRR, ARPU, or Customer Count.",
      suggestedFollowUps: DEFAULT_FOLLOW_UPS,
    };
  }

  if (intent.dimension && !metric.dimensions.includes(intent.dimension)) {
    const available = metric.dimensions
      .filter((dimension) => dimension !== "date")
      .map((dimension) => dimension.replaceAll("_", " "));

    return {
      message: `**${metric.name}** cannot be grouped by ${intent.dimension.replaceAll(
        "_",
        " "
      )} in this demo. Available breakdowns: ${
        available.length ? available.join(", ") : "none"
      }.`,
      metricDef: metric,
      suggestedFollowUps: buildFollowUps(metric),
    };
  }

  const isWhyWithDimension =
    intent.questionType === "why" && Boolean(intent.dimension);
  const result = executeMetricQuery({
    metricId: intent.metricId,
    granularity: intent.granularity,
    dimensions:
      intent.dimension && !isWhyWithDimension ? [intent.dimension] : undefined,
  });

  let narrative: string;
  if (intent.questionType === "why") {
    narrative = generateWhyAnalysis(intent, result, metric);
    if (isWhyWithDimension) {
      narrative = `*Regional/category time-series drivers are not available in the demo, so this analysis uses the overall metric trend.*\n\n${narrative}`;
    }
  } else if (intent.questionType === "comparison") {
    narrative = generateComparison(result, metric);
  } else if (intent.questionType === "ranking") {
    narrative = generateRanking(result, metric, message);
  } else if (intent.dimension || intent.questionType === "breakdown") {
    narrative = generateBreakdownAnalysis(result, metric);
  } else if (intent.questionType === "trend") {
    narrative = `## ${result.chartConfig.title}\n\n${result.summary}\n\n**Definition:** \`${metric.formula}\`\n\n${sourceNotice(
      result
    )}`;
  } else {
    const latest = result.data.at(-1);
    narrative = `## ${metric.name}: ${formatMetricValue(
      Number(latest?.value),
      metric.unit
    )}\n\nLatest period: **${rowLabel(latest)}**. ${result.summary}\n\n**Metric ID:** \`${metric.id}\` · **Demo cube:** ${metric.cube}\n\n**Formula:** \`${metric.formula}\`\n\n${sourceNotice(
      result
    )}`;
  }

  return {
    message: narrative,
    metricResult: result,
    metricDef: metric,
    suggestedFollowUps: buildFollowUps(metric),
  };
}

export type { AgentResponse } from "./types";
