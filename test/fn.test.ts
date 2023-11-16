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
} from "../src/internal"

declare const tag: unique symbol

export type TagContainer<Token> = {
	readonly [tag]: Token
}

export type Opaque<Type, Token = unknown> = Type & TagContainer<Token>

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
			const wrapped = fn((_arg: number) => {
				if (Math.random() > 0.5) {
					return Ok(1)
				}
				if (Math.random() > 0.5) {
					return Ok("foo")
				}
				if (Math.random() > 0.5) {
					return Err(1)
				}
				return Err("error")
			})
			expectTypeOf(wrapped).parameter(0).toBeNumber()
			expectTypeOf(wrapped).returns.toEqualTypeOf<Result<string | number, string | number>>()
		})

		it("returns correct type with function returning Ok", () => {
			const wrapped = fn((_arg: number) => Ok(1))
			expectTypeOf(wrapped).parameter(0).toBeNumber()
			expectTypeOf(wrapped).returns.toEqualTypeOf<Result<number, never>>()
		})

		it("returns correct type with function returning Err", () => {
			const wrapped = fn((_arg: number) => Err(1))
			expectTypeOf(wrapped).parameter(0).toBeNumber()
			expectTypeOf(wrapped).returns.toEqualTypeOf<Result<never, number>>()
		})

		it("returns correct type with function returning Result", () => {
			const wrapped = fn((_arg: number) => tryFn(() => 1))
			expectTypeOf(wrapped).parameter(0).toBeNumber()
			expectTypeOf(wrapped).returns.toEqualTypeOf<Result<number, StdError>>()
		})

		it("works with generics", () => {
			const wrapped = fn(<A, B>(a: A, b: B) => {
				if (Math.random() > 0.5) {
					return Ok(a)
				}
				return Err(b)
			})
			expectTypeOf(wrapped).toEqualTypeOf<<A, B>(a: A, b: B) => Result<A, B>>()
		})

		it("works with short-circuit return", () => {
			const foo = (): Result<number, string> => {
				if (Math.random() > 0.5) {
					return Ok(42)
				}
				return Err("error")
			}
			const wrapped = fn(() => {
				const r = foo()
				if (r.err) {
					return r
				}
				return Ok("foo")
			})
			expectTypeOf(wrapped).returns.toEqualTypeOf<Result<string, string>>()
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
				if (Math.random() > 0.5) {
					return Ok("foo")
				}
				if (Math.random() > 0.5) {
					return Err(1)
				}
				return Err("error")
			}
			const wrapped = asyncFn(f)
			expectTypeOf(wrapped).parameter(0).toBeNumber()
			expectTypeOf(wrapped).returns.toEqualTypeOf<
				PromiseResult<number | string, number | string>
			>()
		})

		it("returns correct type with function returning Promise<Ok>", () => {
			const f = async (_arg: number) => Ok(1)
			const wrapped = asyncFn(f)
			expectTypeOf(wrapped).parameter(0).toBeNumber()
			expectTypeOf(wrapped).returns.toEqualTypeOf<PromiseResult<number, never>>()
		})

		it("returns correct type with function returning Promise<Err>", () => {
			const f = async (_arg: number) => Err(1)
			const wrapped = asyncFn(f)
			expectTypeOf(wrapped).parameter(0).toBeNumber()
			expectTypeOf(wrapped).returns.toEqualTypeOf<PromiseResult<never, number>>()
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

		it("works with generics", () => {
			const wrapped = asyncFn(async <A, B>(a: A, b: B) => {
				if (Math.random() > 0.5) {
					return Ok(a)
				}
				return Err(b)
			})
			expectTypeOf(wrapped).toEqualTypeOf<<A, B>(a: A, b: B) => PromiseResult<A, B>>()
		})

		it("works with short-circuit return", () => {
			const foo = asyncFn(async () => {
				if (Math.random() > 0.5) {
					return Ok(42)
				}
				return Err("error")
			})
			const wrapped = asyncFn(async () => {
				const r = await foo()
				if (r.err) {
					return r
				}
				return Ok(true)
			})
			expectTypeOf(wrapped).returns.toEqualTypeOf<PromiseResult<boolean, string>>()
		})
	})
})
