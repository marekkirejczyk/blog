export type Result<S, E> =
  | { ok: true; value: S }
  | { ok: false; error: E };

export function ok<S>(value: S): Result<S, never> {
  return { ok: true, value };
}

export function err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}
