import type { Template } from "./types";

export const SCENARIOS = [
  { key: "conservative", label: "Conservative" },
  { key: "expected", label: "Expected" },
  { key: "optimistic", label: "Optimistic" },
] as const;

const DEFAULT_SCENARIOS = { conservative: 0.75, expected: 1, optimistic: 1.25 };

export const TEMPLATES: Template[] = [
  {
    id: "saas",
    name: "SaaS / Software",
    description: "Per-seat subscription with productivity gains",
    industry: "saas",
    parameters: [
      {
        key: "seats",
        label: "Number of Seats",
        type: "slider",
        min: 5,
        max: 5000,
        step: 5,
        default: 250,
        unit: "users",
        help: "Total active platform seats",
      },
      {
        key: "price_per_seat",
        label: "Price per Seat",
        type: "currency",
        min: 10,
        max: 2000,
        step: 10,
        default: 120,
        help: "Annual price per seat",
      },
      {
        key: "implementation_cost",
        label: "Implementation Cost",
        type: "currency",
        min: 0,
        max: 500000,
        step: 1000,
        default: 25000,
        help: "One-time onboarding/setup",
      },
    ],
    returns: [
      {
        key: "cost_per_member",
        label: "Cost per Team Member",
        type: "currency",
        min: 20000,
        max: 400000,
        step: 1000,
        default: 120000,
        help: "Fully-loaded annual cost per seat",
      },
      {
        key: "expected_improvement",
        label: "Expected Improvement",
        type: "percent",
        min: 1,
        max: 50,
        step: 1,
        default: 12,
        help: "Estimated productivity lift",
      },
      {
        key: "churn_reduction",
        label: "Churn Reduction",
        type: "percent",
        min: 0,
        max: 50,
        step: 1,
        default: 8,
        help: "Estimated retention lift",
      },
    ],
    formulas: [
      {
        key: "annual_cost",
        label: "Annual Investment",
        expression: "seats * price_per_seat + implementation_cost",
      },
      {
        key: "productivity_savings",
        label: "Productivity Savings",
        expression: "seats * cost_per_member * (expected_improvement / 100)",
      },
      {
        key: "churn_savings",
        label: "Retention Value",
        expression: "seats * price_per_seat * (churn_reduction / 100)",
      },
      {
        key: "annual_gain",
        label: "Annual Gain",
        expression: "productivity_savings + churn_savings",
      },
    ],
    scenarios: DEFAULT_SCENARIOS,
  },
  {
    id: "services",
    name: "Professional Services",
    description: "Billable hours, utilization & margin uplift",
    industry: "services",
    parameters: [
      {
        key: "billable_consultants",
        label: "Billable Consultants",
        type: "slider",
        min: 1,
        max: 500,
        step: 1,
        default: 25,
        unit: "FTE",
        help: "Headcount on billable work",
      },
      {
        key: "engagement_cost",
        label: "Tooling Investment",
        type: "currency",
        min: 0,
        max: 1000000,
        step: 1000,
        default: 80000,
        help: "Annual platform cost",
      },
      {
        key: "current_utilization",
        label: "Current Utilization",
        type: "percent",
        min: 20,
        max: 95,
        step: 1,
        default: 62,
        help: "Today's billable utilization",
      },
    ],
    returns: [
      {
        key: "cost_per_member",
        label: "Cost per Team Member",
        type: "currency",
        min: 50000,
        max: 500000,
        step: 1000,
        default: 180000,
        help: "Fully-loaded annual cost per consultant",
      },
      {
        key: "expected_improvement",
        label: "Expected Improvement",
        type: "percent",
        min: 1,
        max: 40,
        step: 1,
        default: 10,
        help: "Estimated utilization / output lift",
      },
    ],
    formulas: [
      { key: "annual_cost", label: "Annual Investment", expression: "engagement_cost" },
      {
        key: "annual_gain",
        label: "Annual Gain",
        expression: "billable_consultants * cost_per_member * (expected_improvement / 100)",
      },
    ],
    scenarios: DEFAULT_SCENARIOS,
  },
  {
    id: "ai",
    name: "AI / Automation",
    description: "Workflow automation with FTE equivalent savings",
    industry: "ai",
    parameters: [
      {
        key: "platform_cost",
        label: "Platform / License Cost",
        type: "currency",
        min: 0,
        max: 1000000,
        step: 1000,
        default: 60000,
        help: "Annual subscription",
      },
      {
        key: "implementation_cost",
        label: "Implementation",
        type: "currency",
        min: 0,
        max: 500000,
        step: 1000,
        default: 40000,
        help: "Setup & integration",
      },
      {
        key: "workflows",
        label: "Workflows Automated",
        type: "slider",
        min: 1,
        max: 200,
        step: 1,
        default: 12,
        unit: "flows",
        help: "Distinct processes automated",
      },
    ],
    returns: [
      {
        key: "team_size",
        label: "Team Size Impacted",
        type: "slider",
        min: 1,
        max: 1000,
        step: 1,
        default: 50,
        unit: "people",
        help: "Headcount whose work is automated",
      },
      {
        key: "cost_per_member",
        label: "Cost per Team Member",
        type: "currency",
        min: 20000,
        max: 400000,
        step: 1000,
        default: 110000,
        help: "Fully-loaded annual cost per person",
      },
      {
        key: "expected_improvement",
        label: "Expected Improvement",
        type: "percent",
        min: 1,
        max: 60,
        step: 1,
        default: 15,
        help: "Productivity gained from automation",
      },
      {
        key: "error_reduction_value",
        label: "Error / Rework Cost Avoided",
        type: "currency",
        min: 0,
        max: 2000000,
        step: 1000,
        default: 75000,
        help: "Annual cost of errors eliminated",
      },
    ],
    formulas: [
      {
        key: "annual_cost",
        label: "Annual Investment",
        expression: "platform_cost + implementation_cost",
      },
      {
        key: "labor_savings",
        label: "Labor Savings",
        expression: "team_size * cost_per_member * (expected_improvement / 100)",
      },
      {
        key: "annual_gain",
        label: "Annual Gain",
        expression: "labor_savings + error_reduction_value",
      },
    ],
    scenarios: DEFAULT_SCENARIOS,
  },
  {
    id: "custom",
    name: "Blank / Custom",
    description: "Start from scratch — investment vs. annual benefit",
    industry: "custom",
    parameters: [
      {
        key: "investment",
        label: "Initial Investment",
        type: "currency",
        min: 0,
        max: 1000000,
        step: 1000,
        default: 50000,
        help: "One-time or annual cost",
      },
      {
        key: "recurring_cost",
        label: "Recurring Annual Cost",
        type: "currency",
        min: 0,
        max: 1000000,
        step: 1000,
        default: 20000,
        help: "Ongoing yearly spend",
      },
    ],
    returns: [
      {
        key: "annual_benefit",
        label: "Annual Benefit",
        type: "currency",
        min: 0,
        max: 5000000,
        step: 1000,
        default: 180000,
        help: "Value created per year",
      },
    ],
    formulas: [
      {
        key: "annual_cost",
        label: "Annual Investment",
        expression: "investment + recurring_cost",
      },
      { key: "annual_gain", label: "Annual Gain", expression: "annual_benefit" },
    ],
    scenarios: DEFAULT_SCENARIOS,
  },
];

export function getTemplate(id: string): Template {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0]!;
}

export function defaultValues(template: Template): Record<string, number> {
  const out: Record<string, number> = {};
  [...template.parameters, ...template.returns].forEach((f) => {
    out[f.key] = f.default;
  });
  return out;
}
