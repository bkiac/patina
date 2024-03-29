import {it, expect, expectTypeOf} from "vitest"
import {run, Ok, Err, Result} from "../src"

// TODO: Adding an async generator in the class messes up test runner deep equal algo
// it("should not be equal every time", () => {
// 	expect(Ok()).not.toEqual(Err())
// 	expect(Ok()).not.toEqual(Ok(1))
// 	expect(Err()).not.toEqual(Err(1))
// })

it("should run a generator with all Oks", () => {
	const result = run(function* () {
		const x = yield* Ok(42)
		const y = yield* Ok(1)
		return x + y
	})
	expectTypeOf(result).toEqualTypeOf<Result<number, never>>()
	expect(result.unwrap()).toEqual(43)
})

it("should run a generator with early Err", () => {
	const result = run(function* () {
		const x = yield* Ok(42)
		const y = yield* Err("error")
		return x + y
	})
	expectTypeOf(result).toEqualTypeOf<Result<number, string>>()
	expect(result.unwrapErr()).toEqual("error")
})
