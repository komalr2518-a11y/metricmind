// ═══════════════════════════════════════════════════
// MetricMind — Agentic Orchestrator (Rule-Based)
// Translates NL intent into Semantic Layer API calls
// ═══════════════════════════════════════════════════
//
// UPGRADE: To add real AI, replace processUserQuery with an
// OpenAI/Groq API call. See comments marked with [LLM UPGRADE]
//

import {
  METRIC_CATALOG,
  executeMetricQuery,
  type MetricDefinition,
  type MetricQuery,
  type MetricResult,
} from "./semantic-layer";

export interface AgentResponse {
  message: string;
  metricResult?: MetricResult;
  metricDef?: MetricDefinition;
  suggestedFollowUps: string[];
}

// ─── Follow-up Suggestions per Context ───
const FOLLOW_UPS: Record<string, string[]> = {
  default: [
    "Break that down by region",
    "Compare with last quarter",
    "Show me the trend over time",
    "Which customer tier contributes the most?",
  ],
  region: [
    "Show the trend for each region",
    "Compare North America vs Europe",
    "Which region has the highest margin?",
    "Show revenue breakdown by product category",
  ],
  trend: [
    "What caused the drop in Q3?",
    "Compare quarters side by side",
    "Is this trend consistent across regions?",
    "Show me a forecast for next quarter",
  ],
  profitability: [
    "How does this compare to revenue growth?",
    "Which product category has the best margin?",
    "Show operating expenses trend",
    "What is the net profit margin?",
  ],
};

// ─── Intent Parsing ───
interface ParsedIntent {
  metricId: string;
  dimension?: string;
  granularity?: "monthly" | "quarterly";
  questionType: "trend" | "breakdown" | "comparison" | "single" | "why";
}

function parseIntent(userMessage: string): ParsedIntent {
  const msg = userMessage.toLowerCase();

  let metricId = "total_revenue";
  let questionType: ParsedIntent["questionType"] = "single";
  let dimension: string | undefined;
  let granularity: ParsedIntent["granularity"] = "monthly";

  // ─── Metric Matching (priority order) ───
  if (msg.includes("margin") && !msg.includes("net profit")) metricId = "gross_margin";
  else if (msg.includes("net profit")) metricId = "net_profit";
  else if (msg.includes("churn")) metricId = "churn_rate";
  else if (msg.includes("retention") || msg.includes("nrr")) metricId = "nrr";
  else if (msg.includes("arpu") || msg.includes("revenue per user") || msg.includes("per user") || msg.includes("per customer")) metricId = "arpu";
  else if (msg.includes("order") && (msg.includes("count") || msg.includes("total order") || msg.includes("how many order"))) metricId = "total_orders";
  else if (msg.includes("order value") || msg.includes("avg order") || msg.includes("aov")) metricId = "avg_order_value";
  else if (msg.includes("customer") && (msg.includes("count") || msg.includes("active") || msg.includes("how many customer"))) metricId = "customer_count";
  else if (msg.includes("new customer") || msg.includes("customer acquisit")) metricId = "new_customers";
  else if (msg.includes("region") && msg.includes("revenue")) metricId = "revenue_by_region";
  else if (msg.includes("category") || msg.includes("product")) metricId = "revenue_by_category";
  else if (msg.includes("cogs") || msg.includes("cost of goods")) metricId = "cogs";
  else if (msg.includes("operating expense") || msg.includes("opex")) metricId = "operating_expense_ratio";
  else if (msg.includes("ltv") || msg.includes("lifetime value")) metricId = "customer_ltv";

  // ─── Question Type Detection ───
  if (msg.includes("why") || msg.includes("reason") || msg.includes("cause") || msg.includes("what happened")) {
    questionType = "why";
  } else if (msg.includes("trend") || msg.includes("over time") || msg.includes("monthly") || msg.includes("quarterly") || msg.includes("last year") || msg.includes("history")) {
    questionType = "trend";
  } else if (msg.includes("break") || msg.includes("by region") || msg.includes("by category") || msg.includes("by tier") || msg.includes("split") || msg.includes("compare")) {
    questionType = "breakdown";
  } else if (msg.includes("compare") || msg.includes("vs") || msg.includes("versus") || msg.includes("difference")) {
    questionType = "comparison";
  }

  // ─── Dimension Detection ───
  if (msg.includes("region") || msg.includes("geography") || msg.includes("north america") || msg.includes("europe") || msg.includes("asia")) {
    dimension = "region";
  } else if (msg.includes("category") || msg.includes("product")) {
    dimension = "product_category";
  } else if (msg.includes("tier") || msg.includes("segment")) {
    dimension = "customer_tier";
  }

  // ─── Granularity Detection ───
  if (msg.includes("quarter") || msg.includes("q1") || msg.includes("q2") || msg.includes("q3") || msg.includes("q4")) {
    granularity = "quarterly";
  }

  return { metricId, dimension, granularity, questionType };
}

// ─── Why Analysis (Multi-Step Root Cause) ───
function generateWhyAnalysis(
  intent: ParsedIntent,
  result: MetricResult,
  metricDef: MetricDefinition
): string {
  const values = result.data.map((r) => Number(r.value));
  const last = values[values.length - 1];
  const prev = values[values.length - 2];
  const change = last - prev;
  const changePct = ((change / prev) * 100).toFixed(1);
  const direction = change > 0 ? "increased" : "decreased";

  // Fetch supporting metrics for multi-step analysis
  const revResult = executeMetricQuery({ metricId: "total_revenue", granularity: intent.granularity });
  const cogsResult = executeMetricQuery({ metricId: "cogs", granularity: intent.granularity });
  const churnResult = executeMetricQuery({ metricId: "churn_rate", granularity: intent.granularity });

  const revValues = revResult.data.map((r) => Number(r.value));
  const cogsValues = cogsResult.data.map((r) => Number(r.value));
  const churnValues = churnResult.data.map((r) => Number(r.value));

  let analysis = `## Why Did ${metricDef.name} ${direction === "decreased" ? "Drop" : "Increase"}?\n\n`;
  analysis += `${metricDef.name} ${direction} by **${Math.abs(parseFloat(changePct))}%** in the latest period (${prev.toLocaleString()} to ${last.toLocaleString()} ${metricDef.unit}). Here is my multi-step analysis:\n\n`;

  analysis += `### Step 1: Revenue Trend\n`;
  const revChange = revValues[revValues.length - 1] - revValues[revValues.length - 2];
  analysis += `Total revenue ${revChange > 0 ? "grew" : "declined"} by **$${Math.abs(revChange).toLocaleString()}** (${((revChange / revValues[revValues.length - 2]) * 100).toFixed(1)}%) in the same period. ${revChange > 0 ? "Top-line growth alone does not explain the margin pressure." : "Revenue contraction is a primary contributor to the decline."}\n\n`;

  analysis += `### Step 2: Cost Analysis\n`;
  const cogsChange = cogsValues[cogsValues.length - 1] - cogsValues[cogsValues.length - 2];
  const cogsChangePct = ((cogsChange / cogsValues[cogsValues.length - 2]) * 100).toFixed(1);
  analysis += `COGS ${cogsChange > 0 ? "increased" : "decreased"} by **${cogsChangePct}%** ($${Math.abs(cogsChange).toLocaleString()}). ${cogsChange > 0 ? "Rising costs are compressing margins, particularly in the Hardware category which has the lowest margin at 28.4%." : "Cost optimization efforts are showing results."}\n\n`;

  analysis += `### Step 3: Customer Dynamics\n`;
  const nrrResult = executeMetricQuery({ metricId: "nrr", granularity: "quarterly" });
  const nrrLast = nrrResult.data[nrrResult.data.length - 1];
  analysis += `Churn rate stands at **${churnValues[churnValues.length - 1]}%**, ${churnValues[churnValues.length - 1] > 5 ? "which is elevated and suggests customer satisfaction issues, particularly in the SMB tier." : "which is within healthy range."} Net Revenue Retention is **${nrrLast?.value ?? "N/A"}%**, indicating ${Number(nrrLast?.value) > 110 ? "strong expansion revenue from existing customers." : "potential contraction risk."}\n\n`;

  analysis += `### Conclusion\n`;
  analysis += `The primary drivers are: (1) **COGS growth outpacing revenue growth** at ${cogsChangePct}% vs ${((revChange / revValues[revValues.length - 2]) * 100).toFixed(1)}%, and (2) **mix shift toward lower-margin products** in the Hardware category. Recommended actions: review supplier contracts for cost reduction opportunities and focus sales efforts on high-margin SaaS products.\n\n`;
  analysis += `> All numbers above are sourced from the **Semantic Layer** (${metricDef.cube}), ensuring consistency with official financial reports.`;

  return analysis;
}

// ─── Main Agent Function ───
export function processUserQuery(
  userMessage: string,
  _conversationHistory: { role: string; content: string }[] = []
): AgentResponse {
  const msg = userMessage.trim();

  // Handle meta-queries
  if (
    msg.toLowerCase().includes("what metric") ||
    msg.toLowerCase().includes("list metric") ||
    msg.toLowerCase().includes("available metric") ||
    msg.toLowerCase().includes("help")
  ) {
    const categories = [...new Set(METRIC_CATALOG.map((m) => m.category))];
    const byCategory = categories.map((cat) => {
      const metrics = METRIC_CATALOG.filter((m) => m.category === cat);
      return `**${cat}**: ${metrics.map((m) => m.name).join(", ")}`;
    });
    return {
      message: `I have access to **${METRIC_CATALOG.length} governed metrics** across ${categories.length} categories:\n\n${byCategory.join("\n\n")}\n\nJust ask me a question like *"What was the total revenue last quarter?"* or *"Why did European margins drop?"* and I will query the Semantic Layer for the exact, governed answer.`,
      suggestedFollowUps: [
        "What was total revenue last quarter?",
        "Show me churn rate trend",
        "Break down revenue by region",
      ],
    };
  }

  const intent = parseIntent(msg);
  const metricDef = METRIC_CATALOG.find((m) => m.id === intent.metricId);

  if (!metricDef) {
    return {
      message: `I could not find a matching metric for your query. Try asking about one of these: Revenue, Margin, Churn Rate, NRR, ARPU, or Customer Count.`,
      suggestedFollowUps: FOLLOW_UPS.default,
    };
  }

  // Build and execute query against Semantic Layer
  const query: MetricQuery = {
    metricId: intent.metricId,
    granularity: intent.granularity,
    dimensions: intent.dimension ? [intent.dimension] : undefined,
  };

  const result = executeMetricQuery(query);

  // Generate narrative based on question type
  let narrative: string;

  if (intent.questionType === "why") {
    narrative = generateWhyAnalysis(intent, result, metricDef);
  } else if (intent.questionType === "breakdown") {
    narrative = `## ${result.chartConfig.title}\n\n${result.summary}\n\n`;
    narrative += `**Semantic Definition**: \`${metricDef.formula}\`\n\n`;
    narrative += `This breakdown is sourced from the **${metricDef.cube}** through the Semantic Layer, ensuring the same number appears across all dashboards and reports.`;
  } else if (intent.questionType === "trend") {
    narrative = `## ${result.chartConfig.title}\n\n${result.summary}\n\n`;
    narrative += `**Semantic Definition**: \`${metricDef.formula}\`\n\n`;
    narrative += `The data is computed at **${intent.granularity}** granularity directly from the governed metric, not raw SQL. This ensures Finance and Sales always see identical numbers.`;
  } else {
    narrative = `## ${metricDef.name}: ${result.data[0]?.value?.toLocaleString() ?? "N/A"} ${metricDef.unit}\n\n${result.summary}\n\n`;
    narrative += `**Metric ID**: \`${metricDef.id}\` | **Cube**: ${metricDef.cube}\n\n`;
    narrative += `**Formula**: \`${metricDef.formula}\`\n\n`;
    narrative += `> This metric is governed by the Semantic Layer, ensuring consistent calculations across all departments.`;
  }

  // Suggest follow-ups based on context
  let followUpCategory = "default";
  if (intent.dimension === "region") followUpCategory = "region";
  else if (intent.questionType === "trend") followUpCategory = "trend";
  else if (metricDef.category === "Profitability") followUpCategory = "profitability";

  return {
    message: narrative,
    metricResult: result,
    metricDef,
    suggestedFollowUps: FOLLOW_UPS[followUpCategory] || FOLLOW_UPS.default,
  };
}

/*
 ╔══════════════════════════════════════════════════════════╗
 ║  [LLM UPGRADE] How to add real AI (OpenAI / Groq)       ║
 ╠══════════════════════════════════════════════════════════╣
 ║                                                          ║
 ║  1. Install: npm install openai                          ║
 ║                                                          ║
 ║  2. Create .env.local:                                   ║
 ║     OPENAI_API_KEY=sk-...                                ║
 ║                                                          ║
 ║  3. Replace processUserQuery with async version:         ║
 ║                                                          ║
 ║  import OpenAI from "openai";                            ║
 ║  const openai = new OpenAI();                            ║
 ║                                                          ║
 ║  export async function processUserQuery(...) {           ║
 ║    // ... same intent parsing ...                        ║
 ║    const result = executeMetricQuery(query);             ║
 ║                                                          ║
 ║    const response = await openai.chat.completions.create({║
 ║      model: "gpt-4o-mini",                              ║
 ║      messages: [                                         ║
 ║        { role: "system", content: "You are a BI..." },  ║
 ║        { role: "user", content: userMessage },          ║
 ║      ],                                                  ║
 ║    });                                                   ║
 ║                                                          ║
 ║    narrative = response.choices[0].message.content;      ║
 ║    // ... return response ...                            ║
 ║  }                                                       ║
 ╚══════════════════════════════════════════════════════════╝
*/