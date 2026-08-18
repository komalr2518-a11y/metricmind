export interface QuestionGroup {
  id: "growth" | "customers" | "profitability" | "efficiency";
  label: string;
  description: string;
  questions: string[];
}

export const QUESTION_GROUPS: QuestionGroup[] = [
  {
    id: "growth",
    label: "Revenue & growth",
    description: "Track momentum and recurring income",
    questions: [
      "Show me Total Revenue trend",
      "Which region leads Total Revenue?",
      "Show Monthly Recurring Revenue trend",
      "Which month had the highest Conversion Rate?",
    ],
  },
  {
    id: "customers",
    label: "Customer health",
    description: "Understand retention, value, and churn",
    questions: [
      "Show Customer Churn Rate by customer tier",
      "Which region has the lowest Net Revenue Retention?",
      "Show ARPU by customer tier",
      "Which month had the highest New Customers?",
    ],
  },
  {
    id: "profitability",
    label: "Profitability",
    description: "Inspect margins, costs, and profit",
    questions: [
      "Why did Gross Margin change last quarter?",
      "Show EBITDA Margin trend",
      "Which product category has the highest Gross Margin?",
      "Compare Net Profit with last quarter",
    ],
  },
  {
    id: "efficiency",
    label: "Efficiency",
    description: "Find acquisition and operational signals",
    questions: [
      "Show Customer Acquisition Cost trend",
      "Which region has the lowest Customer Acquisition Cost?",
      "Show Refund Rate by product category",
      "Compare Average Order Value with last quarter",
    ],
  },
];

export const FEATURED_QUESTIONS = QUESTION_GROUPS.flatMap(
  (group) => group.questions
);
