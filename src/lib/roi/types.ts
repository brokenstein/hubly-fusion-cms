export type FieldType = "currency" | "number" | "percent" | "slider";

export interface Field {
  key: string;
  label: string;
  type: FieldType;
  min?: number;
  max?: number;
  step?: number;
  default: number;
  unit?: string;
  help?: string;
}

export interface Formula {
  key: string;
  label: string;
  expression: string;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  industry: string;
  parameters: Field[];
  returns: Field[];
  formulas: Formula[];
  scenarios: { conservative: number; expected: number; optimistic: number };
}

export type ScenarioKey = "conservative" | "expected" | "optimistic";

export interface RoiDeal {
  id: string;
  name: string;
  company: string | null;
  template_id: string;
  template_name: string | null;
  values: Record<string, number>;
  results: Record<string, number> & { scenario?: ScenarioKey };
  brand_kit_id: string | null;
  share_slug: string | null;
  created_at: string;
  updated_at: string;
}
