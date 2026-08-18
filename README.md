# MetricMind

MetricMind is a Next.js 16 semantic-BI prototype. It turns a small set of natural-language business questions into deterministic metric queries, explanations, charts, and tables.

> [!IMPORTANT]
> The repository uses local demo data. It is not connected to a data warehouse, an LLM, or official financial reports. The rule-based parser and seeded dataset are intended for product exploration only.

## What works

- 20 metric definitions with formulas, dimensions, units, and aggregation semantics
- Monthly and quarterly trends
- Region, product-category, and customer-tier breakdowns where supported
- Period comparisons plus highest/lowest and top-three ranking answers
- Transparent root-cause hypotheses that distinguish correlation from causation
- Switchable line, area, bar, and donut visualizations with KPI insight summaries
- Category-based question starters, clickable KPI cards, sortable tables, and local conversation history
- Open username/password registration with salted password hashes and server-side sessions
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

`npm run check` runs ESLint, TypeScript, and the focused metric, query, and
authentication test suites.

On first launch, open `/register` and create any valid username. Accounts are
stored locally in `.data/auth.json`; this file is ignored by Git. Conversations
are stored separately in the browser for each user.

## Architecture

```text
app/
  login/, register/       Public authentication screens
  api/auth/               Registration, login, and logout handlers
  api/chat/route.ts       Validates HTTP input and returns agent responses
components/metricmind/    Interactive chat, catalog, chart, KPI, and table UI
lib/metricmind/
  types.ts                Shared data contracts
  catalog.ts              Client-safe metric metadata
  semantic-layer.ts       Deterministic demo data and query execution
  agent.ts                Rule-based intent parsing and narratives
  format.ts               Unit-aware value formatting
  questions.ts            Curated question groups for guided exploration
lib/auth/                 Password hashing, validation, sessions, and local store
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
2. Replace the local JSON account store with a managed database/auth provider, then add tenant-aware authorization, email verification, password reset, audit logging, and a deployment-grade rate limiter.
3. Replace or augment the rule parser with structured LLM tool calling; validate every generated query against the metric catalog.
4. Add real time ranges, filters, currency/locale settings, freshness metadata, and lineage links.
5. Add browser-level tests for mobile navigation, keyboard access, API failures, and chart/table synchronization.
6. Add observability for latency, failed intents, unsupported questions, and data-source errors.

The current rule-based path is deliberately deterministic, which makes it useful as a safe baseline and as an evaluation oracle for a future AI implementation.
