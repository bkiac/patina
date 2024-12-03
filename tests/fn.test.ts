// deno-lint-ignore-file require-await
import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { expectTypeOf } from "expect-type";
import { asyncFn } from "../src/fn.ts";
import { Err, Ok, Result } from "../src/result.ts";
import { AsyncResult } from "../src/async_result.ts";
import { ErrorWithTag } from "../src/error.ts";

export class TaggedError extends ErrorWithTag {
	readonly tag = "TaggedError";
}

describe("asyncFn", () => {
	it("returns Ok result when provided async function does not throw", async () => {
		const wrappedFn = asyncFn(async () => Promise.resolve(Ok(42)));
		const result = await wrappedFn();
		expect(result.unwrapUnchecked()).toEqual(42);
	});

	it("returns Err result when provided async function returns Err", async () => {
		const wrappedFn = asyncFn(async () => Promise.resolve(Err("rekt")));
		const result = await wrappedFn();
		expect(result.unwrapErrUnchecked()).toEqual("rekt");
	});

	describe("types", () => {
		it("returns correct type with function returning Promise<Ok | Err>", () => {
			const f = async (_arg: number) => {
				if (Math.random() > 0.5) {
					return Ok(1);
				}
				if (Math.random() > 0.5) {
					return Ok("foo");
				}
				if (Math.random() > 0.5) {
					return Err(1);
				}
				return Err("error");
			};
			const wrapped = asyncFn(f);
			expectTypeOf(wrapped).parameter(0).toBeNumber();
			expectTypeOf(wrapped).returns.toEqualTypeOf<
				AsyncResult<number | string, number | string>
			>();
		});

		it("returns correct type with function returning Promise<Ok>", () => {
			const f = async (_arg: number) => Ok(1);
			const wrapped = asyncFn(f);
			expectTypeOf(wrapped).parameter(0).toBeNumber();
			expectTypeOf(wrapped).returns.toEqualTypeOf<AsyncResult<number, never>>();
		});

		it("returns correct type with function returning Promise<Err>", () => {
			const f = async (_arg: number) => Err(1);
			const wrapped = asyncFn(f);
			expectTypeOf(wrapped).parameter(0).toBeNumber();
			expectTypeOf(wrapped).returns.toEqualTypeOf<AsyncResult<never, number>>();
		});

		it("returns correct type with function returning AsyncResult", () => {
			const f = (_arg: number) => Result.fromPromise(Promise.resolve(1));
			const wrapped = asyncFn(f);
			expectTypeOf(wrapped).parameter(0).toBeNumber();
			expectTypeOf(wrapped).returns.toEqualTypeOf<AsyncResult<number, Error>>();
		});

		it("returns correct type with function returning Promise<Result>", () => {
			const f = async (_arg: number) => {
				const bar = Result.fromPromise(Promise.resolve(1));
				return bar;
			};
			const wrapped = asyncFn(f);
			expectTypeOf(wrapped).parameter(0).toBeNumber();
			expectTypeOf(wrapped).returns.toEqualTypeOf<AsyncResult<number, Error>>();
		});

		it("works with generics", () => {
			const wrapped = asyncFn(async <A, B>(a: A, b: B) => {
				if (Math.random() > 0.5) {
					return Ok(a);
				}
				return Err(b);
			});
			expectTypeOf(wrapped).branded.toEqualTypeOf<
				<A, B>(a: A, b: B) => AsyncResult<A, B>
			>();
		});

		it("works with short-circuit return", () => {
			const foo = asyncFn(async () => {
				if (Math.random() > 0.5) {
					return Ok(42);
				}
				return Err("error");
			});
			const wrapped = asyncFn(async () => {
				const r = await foo();
				if (r.isErr()) {
					return r;
				}
				return Ok(true);
			});
			expectTypeOf(wrapped).returns.toEqualTypeOf<AsyncResult<boolean, string>>();
		});
	});
});
