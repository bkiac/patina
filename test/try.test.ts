import {it, expect, expectTypeOf, describe} from "vitest";
import {trySync, Ok, Err, Result, tryAsync, AsyncResult} from "../src";

async function wait<T>(ms: number): Promise<T> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

describe("trySync", () => {
	it("should try with all Oks", () => {
		const result = trySync(function* () {
			const x = yield* Ok(42);
			const y = yield* Ok(1);
			return x + y;
		});
		expectTypeOf(result).toEqualTypeOf<Result<number, never>>();
		expect(result.unwrap()).toEqual(43);
	});

	it("should handle transformed return type", () => {
		const result = trySync(function* () {
			const x = yield* Ok(42);
			const y = yield* Ok(1);
			return x.toString() + y.toString();
		});
		expectTypeOf(result).toEqualTypeOf<Result<string, never>>();
		expect(result.unwrap()).toEqual("421");
	});

	it("works with function call", () => {
		function fn() {
			return trySync(function* () {
				const x = yield* Ok(1);
				const y = yield* Ok(1);
				return x + y;
			});
		}

		const result = trySync(function* () {
			const x = yield* Ok(1);
			const y = yield* fn();
			return x + y;
		});

		expectTypeOf(result).toEqualTypeOf<Result<number, never>>();
		expect(result.unwrap()).toEqual(3);
	});

	it("should try with early Err", () => {
		const result = trySync(function* () {
			const x = yield* Ok(42);
			const y = yield* Err("error");
			return x + y;
		});
		expectTypeOf(result).toEqualTypeOf<Result<number, string>>();
		expect(result.unwrapErr()).toEqual("error");
	});
});

describe("tryAsyncFn", () => {
	it("should try async with all Oks", async () => {
		const result = tryAsync(async function* () {
			const x = yield* Ok(42);
			const y = yield* new AsyncResult(Promise.resolve(Ok(1)));
			return x + y;
		});
		expectTypeOf(result).toEqualTypeOf<AsyncResult<number, never>>();
		await expect(result.unwrap()).resolves.toEqual(43);
	});

	it("should try async with early Err", async () => {
		const result = tryAsync(async function* () {
			const x = yield* Ok(42);
			const y = yield* new AsyncResult(Promise.resolve(Err("error")));
			return x + y;
		});
		expectTypeOf(result).toEqualTypeOf<AsyncResult<number, string>>();
		await expect(result.unwrapErr()).resolves.toEqual("error");
	});

	it("works with function call", async () => {
		function fn() {
			return tryAsync(async function* () {
				const x = yield* Ok(1);
				const y = yield* new AsyncResult(Promise.resolve(Ok(1)));
				return x + y;
			});
		}

		const result = tryAsync(async function* () {
			const x = yield* Ok(1);
			const y = yield* fn();
			return x + y;
		});

		expectTypeOf(result).toEqualTypeOf<AsyncResult<number, never>>();
		await expect(result.unwrap()).resolves.toEqual(3);
	});

	it("should handle transformed return type", async () => {
		const result = tryAsync(async function* () {
			const x = yield* Ok(42);
			const y = yield* new AsyncResult(Promise.resolve(Ok(1)));
			return x.toString() + y.toString();
		});
		expectTypeOf(result).toEqualTypeOf<AsyncResult<string, never>>();
		await expect(result.unwrap()).resolves.toEqual("421");
	});

	it(
		"should not block",
		async () => {
			const duration = 1000;

			function shouldNotBlock() {
				return tryAsync(async function* () {
					const x = yield* Ok(1);
					await wait(duration);
					const y = yield* new AsyncResult(Promise.resolve(Ok(1)));
					return x + y;
				});
			}

			const start = Date.now();
			setTimeout(() => {
				expect(Date.now() - start).toBeLessThan(duration);
			}, duration / 2);

			const result = await shouldNotBlock();
			expect(result.unwrap()).toEqual(2);
		},
		60 * 1000,
	);
});
