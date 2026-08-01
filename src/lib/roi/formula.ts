// Safe expression evaluator for ROI template formulas.
// Supports identifiers, numbers, + - * / ( ) and a Math.* allowlist.

const ALLOWED_CHARS = /^[\s\d+\-*/().,a-zA-Z_]+$/;
const IDENT = /[a-zA-Z_][a-zA-Z0-9_]*/g;
const MATH_ALLOWED = new Set([
  "Math",
  "abs",
  "min",
  "max",
  "round",
  "floor",
  "ceil",
  "sqrt",
  "pow",
  "log",
  "log2",
  "log10",
  "exp",
  "sign",
  "trunc",
]);

export function isSafeFormulaExpression(
  expression: string,
  scopeKeys: Iterable<string>,
): boolean {
  if (!expression || !ALLOWED_CHARS.test(expression)) return false;
  const allowed = new Set<string>(MATH_ALLOWED);
  for (const k of scopeKeys) allowed.add(k);
  const idents = expression.match(IDENT) ?? [];
  for (const id of idents) {
    if (!allowed.has(id)) return false;
  }
  return true;
}

export function evalFormula(expression: string, scope: Record<string, number>): number {
  const keys = Object.keys(scope);
  if (!isSafeFormulaExpression(expression, keys)) return 0;
  const values = keys.map((k) => Number(scope[k]) || 0);
  try {
    // eslint-disable-next-line no-new-func
    const fn = new Function(...keys, "Math", `"use strict"; return (${expression});`);
    const out = fn(...values, Math);
    return Number.isFinite(out) ? Number(out) : 0;
  } catch {
    return 0;
  }
}
