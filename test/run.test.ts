import {it, expect, expectTypeOf} from "vitest"
import {run, Ok, Err, Result, runAsync, ResultPromise} from "../src"

// TODO: Adding an async generator in the class messes up test runner deep equal algo
// it("should not be equal every time", () => {
// 	expect(Ok()).not.toEqual(Err())
// 	expect(Ok()).not.toEqual(Ok(1))
// 	expect(Err()).not.toEqual(Err(1))
// })

it("should run with all Oks", () => {
	const result = run(function* () {
		const x = yield* Ok(42)
		const y = yield* Ok(1)
		return x + y
	})
	expectTypeOf(result).toEqualTypeOf<Result<number, never>>()
	expect(result.unwrap()).toEqual(43)
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

it("should run async with all Oks", async () => {
	const result = runAsync(function* () {
		const x = yield* Ok(42)
		const y = yield* new ResultPromise(Promise.resolve(Ok(1)))
		return x + y
	})
	expectTypeOf(result).toEqualTypeOf<ResultPromise<number, never>>()
	await expect(result.unwrap()).resolves.toEqual(43)
})

it("should run async with early Err", async () => {
	const result = runAsync(function* () {
		const x = yield* Ok(42)
		const y = yield* new ResultPromise(Promise.resolve(Err("error")))
		return x + y
	})
	expectTypeOf(result).toEqualTypeOf<ResultPromise<number, string>>()
	await expect(result.unwrapErr()).resolves.toEqual("error")
})
