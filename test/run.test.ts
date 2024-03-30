import {it, expect, expectTypeOf, describe, test} from "vitest"
import {run, Ok, Err, Result, runAsync, ResultPromise, genFn, asyncGenFn} from "../src"

/**
 * Adding an iterator to the Result class has introduced behavior that affects how testing libraries handle deep comparisons of instances of this class.
 * This is interfering with how deep equality checks are performed, as the tests rely on iterating over object properties or their prototypes to determine equality.
 *
 * The followings tests ensure that equality checks are still working as expected between Results.
 */
it("should not be equal every time", () => {
	expect(Ok()).not.toEqual(Ok(1))
	expect(Err()).not.toEqual(Err(1))
	expect(Ok()).not.toEqual(Err())

	expect(new ResultPromise(Promise.resolve(Ok()))).not.toEqual(
		new ResultPromise(Promise.resolve(Ok(1))),
	)
	expect(new ResultPromise(Promise.resolve(Err()))).not.toEqual(
		new ResultPromise(Promise.resolve(Err(1))),
	)
	expect(new ResultPromise(Promise.resolve(Ok()))).not.toEqual(
		new ResultPromise(Promise.resolve(Err())),
	)
})

async function wait<T>(ms: number): Promise<T> {
	return new Promise((resolve) => setTimeout(resolve, ms))
}

describe("run", () => {
	it("should run with all Oks", () => {
		const result = run(function* () {
			const x = yield* Ok(42)
			const y = yield* Ok(1)
			return x + y
		})
		expectTypeOf(result).toEqualTypeOf<Result<number, never>>()
		expect(result.unwrap()).toEqual(43)
	})

	it("should handle transformed return type", () => {
		const result = run(function* () {
			const x = yield* Ok(42)
			const y = yield* Ok(1)
			return x.toString() + y.toString()
		})
		expectTypeOf(result).toEqualTypeOf<Result<string, never>>()
		expect(result.unwrap()).toEqual("421")
	})

	it("works with function call", () => {
		function fn() {
			return run(function* () {
				const x = yield* Ok(1)
				const y = yield* Ok(1)
				return x + y
			})
		}

		const result = run(function* () {
			const x = yield* Ok(1)
			const y = yield* fn()
			return x + y
		})

		expectTypeOf(result).toEqualTypeOf<Result<number, never>>()
		expect(result.unwrap()).toEqual(3)
	})

	it("should run with early Err", () => {
		const result = run(function* () {
			const x = yield* Ok(42)
			const y = yield* Err("error")
			return x + y
		})
		expectTypeOf(result).toEqualTypeOf<Result<number, string>>()
		expect(result.unwrapErr()).toEqual("error")
	})
})

describe("runAsync", () => {
	it("should run async with all Oks", async () => {
		const result = runAsync(async function* () {
			const x = yield* Ok(42)
			const y = yield* new ResultPromise(Promise.resolve(Ok(1)))
			return x + y
		})
		expectTypeOf(result).toEqualTypeOf<ResultPromise<number, never>>()
		await expect(result.unwrap()).resolves.toEqual(43)
	})

	it("should run async with early Err", async () => {
		const result = runAsync(async function* () {
			const x = yield* Ok(42)
			const y = yield* new ResultPromise(Promise.resolve(Err("error")))
			return x + y
		})
		expectTypeOf(result).toEqualTypeOf<ResultPromise<number, string>>()
		await expect(result.unwrapErr()).resolves.toEqual("error")
	})

	it("works with function call", async () => {
		function fn() {
			return runAsync(async function* () {
				const x = yield* Ok(1)
				const y = yield* new ResultPromise(Promise.resolve(Ok(1)))
				return x + y
			})
		}

		const result = runAsync(async function* () {
			const x = yield* Ok(1)
			const y = yield* fn()
			return x + y
		})

		expectTypeOf(result).toEqualTypeOf<ResultPromise<number, never>>()
		await expect(result.unwrap()).resolves.toEqual(3)
	})

	it("should handle transformed return type", async () => {
		const result = runAsync(async function* () {
			const x = yield* Ok(42)
			const y = yield* new ResultPromise(Promise.resolve(Ok(1)))
			return x.toString() + y.toString()
		})
		expectTypeOf(result).toEqualTypeOf<ResultPromise<string, never>>()
		await expect(result.unwrap()).resolves.toEqual("421")
	})

	it(
		"should not block",
		async () => {
			const duration = 1000

			function shouldNotBlock() {
				return runAsync(async function* () {
					const x = yield* Ok(1)
					await wait(duration)
					const y = yield* new ResultPromise(Promise.resolve(Ok(1)))
					return x + y
				})
			}

			const start = Date.now()
			setTimeout(() => {
				expect(Date.now() - start).toBeLessThan(duration)
			}, duration / 2)

			const result = await shouldNotBlock()
			expect(result.unwrap()).toEqual(2)
		},
		60 * 1000,
	)
})

test("genFn", () => {
	const fn = genFn(function* () {
		const x = yield* Ok(42)
		const y = yield* Err("error")
		return x + y
	})
	expectTypeOf(fn).toEqualTypeOf<() => Result<number, string>>()
})

test("asyncGenFn", () => {
	const fn = asyncGenFn(async function* () {
		const x = yield* new ResultPromise(Promise.resolve(Ok(42)))
		const y = yield* new ResultPromise(Promise.resolve(Err("string")))
		return x + y
	})
	expectTypeOf(fn).toEqualTypeOf<() => ResultPromise<number, string>>()
})
