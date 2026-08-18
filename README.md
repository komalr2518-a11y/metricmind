# MetricMind

MetricMind is a Next.js 16 semantic-BI prototype. It turns a small set of natural-language business questions into deterministic metric queries, explanations, charts, and tables.

> [!IMPORTANT]
> The repository uses local demo data. It is not connected to a data warehouse, an LLM, or official financial reports. The rule-based parser and seeded dataset are intended for product exploration only.

## What works

- 15 metric definitions with formulas, dimensions, units, and aggregation semantics
- Monthly and quarterly trends
- Region, product-category, and customer-tier breakdowns where supported
- Period and dimension comparisons
- Transparent root-cause hypotheses that distinguish correlation from causation
- Responsive metric catalog, charts, sortable data tables, and local conversation history
- Validated `/api/chat` input with bounded payloads and non-cached responses

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Quality checks

```bash
npm run check
npm run build
```

`npm run check` runs ESLint, TypeScript, and the focused metric/query test suite.

## Architecture

```text
app/
  api/chat/route.ts       Validates HTTP input and returns agent responses
components/metricmind/    Interactive chat, catalog, chart, KPI, and table UI
lib/metricmind/
  types.ts                Shared data contracts
  catalog.ts              Client-safe metric metadata
  semantic-layer.ts       Deterministic demo data and query execution
  agent.ts                Rule-based intent parsing and narratives
  format.ts               Unit-aware value formatting
tests/                    Query, formatting, and correctness regression tests
```

Keeping catalog metadata separate from query execution prevents the demo datasets from being pulled into components that only need metric names and definitions.

## API

`POST /api/chat`

```json
{
  "message": "Break down Total Revenue by region"
}
```

Messages are required and limited to 500 characters. The endpoint returns an explanation, optional metric/chart data, the matched definition, and self-contained follow-up questions.

## Production roadmap

Before using MetricMind for real decisions:

1. Replace `semantic-layer.ts` with a server-only data-access layer backed by Cube, dbt Semantic Layer, Looker, or another governed metrics API.
2. Add authentication, tenant-aware authorization, audit logging, and a deployment-grade rate limiter.
3. Replace or augment the rule parser with structured LLM tool calling; validate every generated query against the metric catalog.
4. Add real time ranges, filters, currency/locale settings, freshness metadata, and lineage links.
5. Add browser-level tests for mobile navigation, keyboard access, API failures, and chart/table synchronization.
6. Add observability for latency, failed intents, unsupported questions, and data-source errors.

The current rule-based path is deliberately deterministic, which makes it useful as a safe baseline and as an evaluation oracle for a future AI implementation.
