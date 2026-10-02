/**
 * Runtime variable interpolation for the workflow engine.
 *
 * Supports `{{ dotted.path.0.value }}` references resolved against the run
 * context (trigger payload, prior node outputs, workflow/user metadata).
 *
 * Per the engine contract, an unresolved variable is NEVER silently coerced to
 * `undefined` — it throws {@link MissingVariableError} so the run fails with a
 * structured, observable error.
 */

export class MissingVariableError extends Error {
  readonly path: string;
  constructor(path: string) {
    super(`Variable "{{${path}}}" could not be resolved from the execution context`);
    this.name = "MissingVariableError";
    this.path = path;
  }
}

/** A single `{{ ... }}` placeholder that spans the entire input string. */
const SINGLE_EXPRESSION = /^\s*\{\{\s*([^}]+?)\s*\}\}\s*$/;
/** Any `{{ ... }}` placeholder embedded in a larger string. */
const EMBEDDED_EXPRESSION = /\{\{\s*([^}]+?)\s*\}\}/g;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Resolve a dotted path (e.g. `nodes.classifier.output.category`, `items.0.id`)
 * against a context object. Array indices are written as plain numbers.
 */
export function resolvePath(
  context: Record<string, unknown>,
  path: string
): { found: boolean; value: unknown } {
  const segments = path
    .split(".")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  if (segments.length === 0) return { found: false, value: undefined };

  let current: unknown = context;
  for (const segment of segments) {
    if (current == null) return { found: false, value: undefined };

    if (Array.isArray(current)) {
      const index = Number(segment);
      if (!Number.isInteger(index) || index < 0 || index >= current.length) {
        return { found: false, value: undefined };
      }
      current = current[index];
      continue;
    }

    if (isPlainObject(current)) {
      if (!(segment in current)) return { found: false, value: undefined };
      current = current[segment];
      continue;
    }

    // Primitive reached before path was exhausted.
    return { found: false, value: undefined };
  }

  return { found: true, value: current };
}

/** Resolve a single `{{path}}` expression, throwing when it is missing. */
export function resolveExpression(
  path: string,
  context: Record<string, unknown>
): unknown {
  const { found, value } = resolvePath(context, path);
  if (!found) throw new MissingVariableError(path);
  return value;
}

function stringify(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

/**
 * Interpolate a string. When the whole string is a single `{{expr}}`, the raw
 * typed value is returned (number, object, array…). Otherwise every embedded
 * expression is substituted and a string is returned.
 */
export function interpolateString(
  input: string,
  context: Record<string, unknown>
): unknown {
  const single = input.match(SINGLE_EXPRESSION);
  if (single) {
    return resolveExpression(single[1], context);
  }
  return input.replace(EMBEDDED_EXPRESSION, (_match, expr: string) =>
    stringify(resolveExpression(expr, context))
  );
}

/**
 * Deeply interpolate any JSON-like value (strings, arrays, objects). Throws
 * {@link MissingVariableError} if any referenced path is absent.
 */
export function interpolateValue(value: unknown, context: Record<string, unknown>): unknown {
  if (typeof value === "string") return interpolateString(value, context);
  if (Array.isArray(value)) return value.map((v) => interpolateValue(v, context));
  if (isPlainObject(value)) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = interpolateValue(v, context);
    return out;
  }
  return value;
}

/** Collect every `{{path}}` referenced inside a value (for pre-validation). */
export function collectReferences(value: unknown, acc: string[] = []): string[] {
  if (typeof value === "string") {
    for (const m of value.matchAll(EMBEDDED_EXPRESSION)) acc.push(m[1].trim());
  } else if (Array.isArray(value)) {
    for (const v of value) collectReferences(v, acc);
  } else if (isPlainObject(value)) {
    for (const v of Object.values(value)) collectReferences(v, acc);
  }
  return acc;
}
