/**
 * Deterministic retry execution with exponential backoff.
 *
 * Retries are only attempted for errors classified as retryable. Clearly
 * permanent failures — invalid credentials, invalid node configuration, missing
 * variables, 4xx responses (except 429) — are thrown immediately so they land in
 * the dead-letter queue rather than being retried pointlessly.
 */

import { RetryPolicy, DEFAULT_RETRY_POLICY } from "./types";
import { MissingVariableError } from "./variables";
import { ConditionError } from "./conditions";

/** Marks an error as permanently non-retryable regardless of other heuristics. */
export class NonRetryableError extends Error {
  readonly cause?: unknown;
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "NonRetryableError";
    this.cause = cause;
  }
}

/** Carries an HTTP status so retryability can be judged accurately. */
export class HttpError extends Error {
  readonly status: number;
  readonly body?: string;
  constructor(status: number, message: string, body?: string) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.body = body;
  }
}

export function isRetryableError(err: unknown): boolean {
  if (err instanceof NonRetryableError) return false;
  if (err instanceof MissingVariableError) return false;
  if (err instanceof ConditionError) return false;

  if (err instanceof HttpError) {
    if (err.status === 429) return true; // rate limited → retry
    if (err.status >= 400 && err.status < 500) return false; // client error → permanent
    return err.status >= 500; // server error → retry
  }

  // Network-ish errors default to retryable.
  return true;
}

/** Compute the backoff delay (ms) before the given attempt number (1-based retry). */
export function computeBackoff(retryNumber: number, policy: RetryPolicy): number {
  const delay = policy.initialDelayMs * Math.pow(policy.backoffMultiplier, retryNumber - 1);
  return Math.min(delay, policy.maxDelayMs);
}

const defaultSleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export interface WithRetryOptions {
  policy?: RetryPolicy;
  /** Called before each retry with the upcoming attempt number and the error. */
  onRetry?: (attempt: number, delayMs: number, err: unknown) => void | Promise<void>;
  /** Injectable sleep for deterministic tests. */
  sleep?: (ms: number) => Promise<void>;
}

export interface RetryResult<T> {
  value: T;
  attempts: number;
}

/**
 * Run `fn` with retries. The callback receives the 1-based attempt number.
 * On exhaustion or a non-retryable error, the last error is re-thrown with an
 * `attempts` count attached.
 */
export async function withRetry<T>(
  fn: (attempt: number) => Promise<T>,
  options: WithRetryOptions = {}
): Promise<RetryResult<T>> {
  const policy = options.policy ?? DEFAULT_RETRY_POLICY;
  const sleep = options.sleep ?? defaultSleep;
  const maxAttempts = Math.max(1, policy.maxAttempts);

  let lastError: unknown;
  let attemptsPerformed = 0;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    attemptsPerformed = attempt;
    try {
      const value = await fn(attempt);
      return { value, attempts: attempt };
    } catch (err) {
      lastError = err;
      const canRetry = isRetryableError(err) && attempt < maxAttempts;
      if (!canRetry) break;
      const delay = computeBackoff(attempt, policy);
      await options.onRetry?.(attempt + 1, delay, err);
      await sleep(delay);
    }
  }

  if (lastError instanceof Error) {
    (lastError as Error & { attempts?: number }).attempts = attemptsPerformed;
  }
  throw lastError;
}
