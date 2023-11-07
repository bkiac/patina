import {describe, expect, it, expectTypeOf} from "vitest"
import {
	asyncFn,
	fn,
	Ok,
	Err,
	tryAsyncFn,
	type PromiseResult,
	type StdError,
	type Result,
	tryFn,
} from "../internal"

describe.concurrent("fn", () => {
	it("returns Ok result when provided function does not throw", () => {
		const wrappedFn = fn(() => Ok(42))
		const result = wrappedFn()
		expect(result.unwrap()).toEqual(42)
	})

	it("returns Err result when provided function returns Err", () => {
		const wrappedFn = fn(() => Err("rekt"))
		const result = wrappedFn()
		expect(result.unwrapErr()).toEqual("rekt")
	})

	describe("types", () => {
		it("returns correct type with function returning Ok | Err", () => {
			const f = (_arg: number) => {
				if (Math.random() > 0.5) {
					return Ok(1)
				}
				return Err("error")
			}
			const wrapped = fn(f)
			expectTypeOf(wrapped).parameter(0).toBeNumber()
			expectTypeOf(wrapped).returns.toEqualTypeOf<Result<number, string>>()
		})

		it("returns correct type with function returning Ok", () => {
			const f = (_arg: number) => Ok(1)
			const wrapped = fn(f)
			expectTypeOf(wrapped).parameter(0).toBeNumber()
			expectTypeOf(wrapped).returns.toEqualTypeOf<Result<number, unknown>>()
		})

		it("returns correct type with function returning Err", () => {
			const f = (_arg: number) => Err(1)
			const wrapped = fn(f)
			expectTypeOf(wrapped).parameter(0).toBeNumber()
			expectTypeOf(wrapped).returns.toEqualTypeOf<Result<unknown, number>>()
		})

		it("returns correct type with function returning Result", () => {
			const f = (_arg: number) => tryFn(() => 1)
			const wrapped = fn(f)
			expectTypeOf(wrapped).parameter(0).toBeNumber()
			expectTypeOf(wrapped).returns.toEqualTypeOf<Result<number, StdError>>()
		})
	})
})

describe.concurrent("asyncFn", () => {
	it("returns Ok result when provided async function does not throw", async () => {
		const wrappedFn = asyncFn(async () => Promise.resolve(Ok(42)))
		const result = await wrappedFn()
		expect(result.unwrap()).toEqual(42)
	})

	it("returns Err result when provided async function returns Err", async () => {
		const wrappedFn = asyncFn(async () => Promise.resolve(Err("rekt")))
		const result = await wrappedFn()
		expect(result.unwrapErr()).toEqual("rekt")
	})

	describe("types", () => {
		it("returns correct type with function returning Promise<Ok | Err>", () => {
			const f = async (_arg: number) => {
				if (Math.random() > 0.5) {
					return Ok(1)
				}
				return Err("error")
			}
			const wrapped = asyncFn(f)
			expectTypeOf(wrapped).parameter(0).toBeNumber()
			expectTypeOf(wrapped).returns.toEqualTypeOf<PromiseResult<number, string>>()
		})

		it("returns correct type with function returning Promise<Ok>", () => {
			const f = async (_arg: number) => Ok(1)
			const wrapped = asyncFn(f)
			expectTypeOf(wrapped).parameter(0).toBeNumber()
			expectTypeOf(wrapped).returns.toEqualTypeOf<PromiseResult<number, unknown>>()
		})

		it("returns correct type with function returning Promise<Err>", () => {
			const f = async (_arg: number) => Err(1)
			const wrapped = asyncFn(f)
			expectTypeOf(wrapped).parameter(0).toBeNumber()
			expectTypeOf(wrapped).returns.toEqualTypeOf<PromiseResult<unknown, number>>()
		})

		it("returns correct type with function returning PromiseResult", () => {
			const f = (_arg: number) => tryAsyncFn(async () => 1)
			const wrapped = asyncFn(f)
			expectTypeOf(wrapped).parameter(0).toBeNumber()
			expectTypeOf(wrapped).returns.toEqualTypeOf<PromiseResult<number, StdError>>()
		})

		it("returns correct type with function returning Promise<Result>", () => {
			const f = async (_arg: number) => {
				const bar = tryAsyncFn(async () => {
					return 1
				})
				return bar
			}
			const wrapped = asyncFn(f)
			expectTypeOf(wrapped).parameter(0).toBeNumber()
			expectTypeOf(wrapped).returns.toEqualTypeOf<PromiseResult<number, StdError>>()
		})
	})
})
