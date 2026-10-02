/**
 * Safe conditional expression evaluator for workflow edges and IF nodes.
 *
 * This is deliberately NOT a JavaScript evaluator — arbitrary user expressions
 * are never executed. A small, fixed grammar is parsed instead:
 *
 *   {{ai.category}} == "critical"
 *   {{issue.priority}} > 7
 *   {{email.from}} contains "@company.com"
 *   {{flags.isUrgent}}            // bare truthiness
 *
 * Left-hand side is always a `{{path}}` reference. Right-hand side may be a
 * quoted string, a number, a boolean/null literal, or another `{{path}}`.
 */

import { resolveExpression, MissingVariableError } from "./variables";

export class ConditionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConditionError";
  }
}

export type ComparisonOperator =
  | "=="
  | "!="
  | ">"
  | ">="
  | "<"
  | "<="
  | "contains"
  | "notContains"
  | "startsWith"
  | "endsWith";

// Longer operators first so "==" is not mis-split by ">" etc.
const OPERATORS: ComparisonOperator[] = [
  "==",
  "!=",
  ">=",
  "<=",
  ">",
  "<",
  "contains",
  "notContains",
  "startsWith",
  "endsWith",
];

const LHS_REFERENCE = /^\s*\{\{\s*([^}]+?)\s*\}\}\s*$/;

function parseLiteral(token: string, context: Record<string, unknown>): unknown {
  const t = token.trim();
  if (t.length === 0) throw new ConditionError("Empty right-hand operand");

  // Reference
  const ref = t.match(LHS_REFERENCE);
  if (ref) return resolveExpression(ref[1], context);

  // Quoted string
  if (
    (t.startsWith('"') && t.endsWith('"')) ||
    (t.startsWith("'") && t.endsWith("'"))
  ) {
    return t.slice(1, -1);
  }

  if (t === "true") return true;
  if (t === "false") return false;
  if (t === "null") return null;

  const num = Number(t);
  if (!Number.isNaN(num) && t !== "") return num;

  // Bareword → treat as string
  return t;
}

function toNumber(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(n)) {
    throw new ConditionError(`Cannot compare non-numeric value: ${JSON.stringify(value)}`);
  }
  return n;
}

function looseEquals(a: unknown, b: unknown): boolean {
  if (typeof a === "number" || typeof b === "number") {
    const na = Number(a);
    const nb = Number(b);
    if (!Number.isNaN(na) && !Number.isNaN(nb)) return na === nb;
  }
  return String(a) === String(b);
}

function findOperator(expr: string): { op: ComparisonOperator; index: number } | null {
  for (const op of OPERATORS) {
    // Word operators must be surrounded by whitespace to avoid matching inside tokens.
    const needle = /^[a-z]/.test(op) ? ` ${op} ` : op;
    const index = expr.indexOf(needle);
    if (index !== -1) {
      return { op, index: /^[a-z]/.test(op) ? index + 1 : index };
    }
  }
  return null;
}

/**
 * Evaluate a condition expression to a boolean. Returns `true` for an empty or
 * whitespace-only expression (an unconditioned edge always passes).
 */
export function evaluateCondition(
  expression: string | undefined | null,
  context: Record<string, unknown>
): boolean {
  if (expression == null) return true;
  const expr = expression.trim();
  if (expr.length === 0) return true;

  const found = findOperator(expr);

  // No operator → bare truthiness of a reference or literal.
  if (!found) {
    const value = parseLiteral(expr, context);
    return Boolean(value);
  }

  const op = found.op;
  const opToken = op;
  const left = expr.slice(0, found.index).trim();
  const right = expr.slice(found.index + opToken.length).trim();

  const lhsRef = left.match(LHS_REFERENCE);
  const leftValue = lhsRef ? resolveExpression(lhsRef[1], context) : parseLiteral(left, context);
  const rightValue = parseLiteral(right, context);

  switch (op) {
    case "==":
      return looseEquals(leftValue, rightValue);
    case "!=":
      return !looseEquals(leftValue, rightValue);
    case ">":
      return toNumber(leftValue) > toNumber(rightValue);
    case ">=":
      return toNumber(leftValue) >= toNumber(rightValue);
    case "<":
      return toNumber(leftValue) < toNumber(rightValue);
    case "<=":
      return toNumber(leftValue) <= toNumber(rightValue);
    case "contains":
      return String(leftValue).includes(String(rightValue));
    case "notContains":
      return !String(leftValue).includes(String(rightValue));
    case "startsWith":
      return String(leftValue).startsWith(String(rightValue));
    case "endsWith":
      return String(leftValue).endsWith(String(rightValue));
    default:
      throw new ConditionError(`Unsupported operator: ${op}`);
  }
}

export { MissingVariableError };
