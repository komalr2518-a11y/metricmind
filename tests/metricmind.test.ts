import assert from "node:assert/strict";
import test from "node:test";
import { processUserQuery, parseIntent } from "../lib/metricmind/agent";
import { METRIC_CATALOG } from "../lib/metricmind/catalog";
import { formatMetricValue } from "../lib/metricmind/format";
import { executeMetricQuery } from "../lib/metricmind/semantic-layer";
import {
  getMetricTableDimensionLabel,
  summarizeMetricTable,
} from "../lib/metricmind/table-insights";

test("catalog exposes complete metric metadata", () => {
  assert.equal(METRIC_CATALOG.length, 20);
  assert.ok(
    METRIC_CATALOG.every(
      (metric) =>
        metric.summaryOperation &&
        metric.favorableDirection &&
        metric.dimensions.length > 0
    )
  );
});

test("metric values are formatted according to their unit", () => {
  assert.equal(formatMetricValue(40.9, "%"), "40.9%");
  assert.equal(formatMetricValue(1520000, "USD", { compact: true }), "$1.52M");
  assert.equal(formatMetricValue(18300, "#"), "18,300");
});

test("unsupported dimensions are rejected", () => {
  assert.throws(
    () =>
      executeMetricQuery({
        metricId: "gross_margin",
        dimensions: ["customer_tier"],
      }),
    /cannot be grouped by customer tier/
  );
});

test("tier summaries identify the actual highest value", () => {
  const result = executeMetricQuery({
    metricId: "churn_rate",
    dimensions: ["customer_tier"],
  });

  assert.match(result.summary, /^SMB has the highest/);
  assert.doesNotMatch(result.summary, /\$/);
});

test("new customer queries are not mistaken for active customer count", () => {
  assert.equal(parseIntent("How many new customers did we acquire?").metricId, "new_customers");
});

test("new growth and efficiency metrics resolve from natural language", () => {
  assert.equal(parseIntent("Show our monthly recurring revenue").metricId, "mrr");
  assert.equal(parseIntent("How is EBITDA margin trending?").metricId, "ebitda_margin");
  assert.equal(parseIntent("Show customer acquisition cost").metricId, "cac");
  assert.equal(parseIntent("What is our conversion rate?").metricId, "conversion_rate");
  assert.equal(parseIntent("Show refund rate by category").metricId, "refund_rate");
});

test("ranking questions identify leaders and return a ranked answer", () => {
  const intent = parseIntent("Which region has the highest Total Revenue?");
  const response = processUserQuery(
    "Which region has the highest Total Revenue?"
  );

  assert.equal(intent.questionType, "ranking");
  assert.equal(intent.dimension, "region");
  assert.match(response.message, /Top Revenue by Region/);
  assert.match(response.message, /### Top 3/);
});

test("best and worst rankings respect lower-is-better metrics", () => {
  const best = processUserQuery(
    "Which region has the best Customer Churn Rate?"
  );
  const worst = processUserQuery(
    "Which region has the worst Customer Churn Rate?"
  );

  assert.match(best.message, /North America/);
  assert.match(best.message, /best \(lowest\)/);
  assert.match(worst.message, /Latin America/);
  assert.match(worst.message, /worst \(highest\)/);
});

test("breakdown tables use dimension-aware labels and totals", () => {
  const breakdown = executeMetricQuery({
    metricId: "mrr",
    dimensions: ["customer_tier"],
  });
  const trend = executeMetricQuery({ metricId: "mrr" });

  assert.equal(getMetricTableDimensionLabel(breakdown), "Customer tier");
  assert.deepEqual(summarizeMetricTable(breakdown), {
    label: "Total",
    value: 1158000,
  });
  assert.deepEqual(summarizeMetricTable(trend), {
    label: "Latest",
    value: 1158000,
  });
});

test("comparison intent is reachable and compares the latest quarters", () => {
  const intent = parseIntent("Compare Total Revenue with last quarter");
  const response = processUserQuery("Compare Total Revenue with last quarter");

  assert.equal(intent.questionType, "comparison");
  assert.equal(intent.granularity, "quarterly");
  assert.match(response.message, /Q3 vs Q4/);
});

test("single-value answers use the latest period", () => {
  const response = processUserQuery("What is the Customer Churn Rate?");
  const latest = Number(response.metricResult?.data.at(-1)?.value);

  assert.match(response.message, /Latest period: \*\*Dec\*\*/);
  assert.ok(response.message.includes(formatMetricValue(latest, "%")));
});

test("causal answers disclose demo limitations", () => {
  const response = processUserQuery("Why did churn change?");

  assert.match(response.message, /not the driver-level events/i);
  assert.match(response.message, /not connected to a production warehouse/i);
});

test("all query results identify the demo data source", () => {
  const response = processUserQuery("Show me Total Revenue trend");

  assert.equal(response.metricResult?.source.kind, "demo");
  assert.match(response.message, /Demo data/);
});
