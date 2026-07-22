import type { QaCoreError } from "../errors/index.js";

export type Result<T, E extends QaCoreError = QaCoreError> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

export function err<E extends QaCoreError>(error: E): Result<never, E> {
  return { ok: false, error };
}

export function mapResult<T, U, E extends QaCoreError>(
  result: Result<T, E>,
  fn: (value: T) => U,
): Result<U, E> {
  return result.ok ? ok(fn(result.value)) : result;
}

export function flatMapResult<T, U, E extends QaCoreError>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, E>,
): Result<U, E> {
  return result.ok ? fn(result.value) : result;
}

export function unwrapOr<T, E extends QaCoreError>(result: Result<T, E>, fallback: T): T {
  return result.ok ? result.value : fallback;
}

export function isOk<T, E extends QaCoreError>(
  result: Result<T, E>,
): result is { ok: true; value: T } {
  return result.ok;
}

export function isErr<T, E extends QaCoreError>(
  result: Result<T, E>,
): result is { ok: false; error: E } {
  return !result.ok;
}

export async function fromPromise<T>(
  promise: Promise<T>,
  onError: (error: unknown) => QaCoreError,
): Promise<Result<T>> {
  try {
    const value = await promise;
    return ok(value);
  } catch (error) {
    return err(onError(error));
  }
}
