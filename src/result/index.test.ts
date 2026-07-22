import { describe, expect, it } from "vitest";
import { ValidationError } from "../errors/index.js";
import { ok, err, mapResult, flatMapResult, unwrapOr, isOk, isErr, fromPromise } from "./index.js";

describe("Result helpers", () => {
  it("ok/err construct tagged results", () => {
    expect(ok(1)).toEqual({ ok: true, value: 1 });
    const error = new ValidationError("bad");
    expect(err(error)).toEqual({ ok: false, error });
  });

  it("mapResult transforms only ok values", () => {
    expect(mapResult(ok(2), (n) => n * 2)).toEqual({ ok: true, value: 4 });
    const failure = err(new ValidationError("bad"));
    expect(mapResult(failure, (n: number) => n * 2)).toBe(failure);
  });

  it("flatMapResult chains results", () => {
    const half = (n: number) => (n % 2 === 0 ? ok(n / 2) : err(new ValidationError("odd")));
    expect(flatMapResult(ok(4), half)).toEqual({ ok: true, value: 2 });
    expect(flatMapResult(ok(3), half).ok).toBe(false);
  });

  it("unwrapOr returns fallback on error", () => {
    expect(unwrapOr(ok(5), 0)).toBe(5);
    expect(unwrapOr(err(new ValidationError("bad")), 0)).toBe(0);
  });

  it("isOk/isErr narrow correctly", () => {
    const success = ok(1);
    const failure = err(new ValidationError("bad"));
    expect(isOk(success)).toBe(true);
    expect(isErr(success)).toBe(false);
    expect(isOk(failure)).toBe(false);
    expect(isErr(failure)).toBe(true);
  });

  it("fromPromise wraps resolution and rejection", async () => {
    const resolved = await fromPromise(Promise.resolve(42), (e) => new ValidationError(String(e)));
    expect(resolved).toEqual({ ok: true, value: 42 });

    const rejected = await fromPromise(
      Promise.reject(new Error("boom")),
      (e) => new ValidationError(e instanceof Error ? e.message : String(e)),
    );
    expect(rejected.ok).toBe(false);
    if (!rejected.ok) expect(rejected.error.message).toBe("boom");
  });
});
