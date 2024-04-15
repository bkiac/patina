import {expect, it, describe, expectTypeOf} from "vitest";
import {CaughtError, guard, guardAsync, Result, ResultPromise} from "../src";

describe.concurrent("guard", () => {
	it("transforms a function into a function that returns a Result object", () => {
		const fn = (x: number, y: number) => x + y;
		const wrappedFn = guard(fn);
		const result = wrappedFn(40, 2);
		expect(result.isOk).toEqual(true);
		expect(result.unwrap()).toEqual(42);
	});

	it("transforms a throwing function into a function that returns an Err result", () => {
		const error = new Error("Test error");
		const fn = () => {
			throw error;
		};
		const wrappedFn = guard(fn);
		const result = wrappedFn();
		expect(result.isOk).toEqual(false);
		expect(result.unwrapErr().cause).toEqual(error);
	});

	describe("types", () => {
		it("works with a function", () => {
			const f = (value: number) => value;
			const guarded = guard(f);
			expectTypeOf(guarded).toEqualTypeOf<(value: number) => Result<number, CaughtError>>();
		});

		it("works with a generic function", () => {
			const f = <A, B>(a: A, _b: B) => a;
			const guarded = guard(f);
			expectTypeOf(guarded).toEqualTypeOf<<A, B>(a: A, b: B) => Result<A, CaughtError>>();
		});
	});
});

describe.concurrent("guardAsync", () => {
	it("transforms an async function into a function that returns a Promise of a Result object", async () => {
		const fn = async (x: number, y: number) => Promise.resolve(x + y);
		const wrappedFn = guardAsync(fn);
		const result = await wrappedFn(40, 2);
		expect(result.isOk).toEqual(true);
		expect(result.unwrap()).toEqual(42);
	});

	it("transforms a throwing async function into a function that returns a Promise of an Err result", async () => {
		const error = new Error("Test error");
		const fn = async (): Promise<number> => {
			throw error;
		};
		const wrappedFn = guardAsync(fn);
		const result = await wrappedFn();
		expect(result.isOk).toEqual(false);
		expect(result.unwrapErr().cause).toEqual(error);
	});

	describe("types", () => {
		it("works with a function", () => {
			const f = async (value: number) => value;
			const guarded = guardAsync(f);
			expectTypeOf(guarded).toEqualTypeOf<
				(value: number) => ResultPromise<number, CaughtError>
			>();
		});

		it("works with a generic function", () => {
			const f = async <A, B>(a: A, _b: B) => a;
			const guarded = guardAsync(f);
			expectTypeOf(guarded).toEqualTypeOf<
				<A, B>(a: A, b: B) => ResultPromise<A, CaughtError>
			>();
		});
	});
});
