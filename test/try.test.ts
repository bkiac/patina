import {describe, expect, it} from "vitest"
import {InvalidErrorPanic, Panic, defaultErrorHandler, tryAsyncFn, tryFn, tryPromise} from "../src"

describe.concurrent("handleError", () => {
	it("returns an Error when given an Error", () => {
		class TestError extends Error {}
		const error = new TestError("Test error")
		const err = defaultErrorHandler(error)
		expect(err).to.be.instanceof(TestError)
	})

	it("throws a Panic when given a Panic", () => {
		const msg = "Test panic"
		const panic = new Panic(msg)
		expect(() => defaultErrorHandler(panic)).to.throw(Panic, msg)
	})

	it("throws a Panic when given an unknown value", () => {
		expect(() => defaultErrorHandler(0)).to.throw(InvalidErrorPanic)
		expect(() => defaultErrorHandler("")).to.throw(InvalidErrorPanic)
		expect(() => defaultErrorHandler(true)).to.throw(InvalidErrorPanic)
		expect(() => defaultErrorHandler(undefined)).to.throw(InvalidErrorPanic)
		expect(() => defaultErrorHandler(null)).to.throw(InvalidErrorPanic)
		expect(() => defaultErrorHandler({})).to.throw(InvalidErrorPanic)
		expect(() => defaultErrorHandler([])).to.throw(InvalidErrorPanic)
	})
})

describe.concurrent("tryPromise", () => {
	it("settles a Promise to an Ok result", async () => {
		const promise = Promise.resolve(42)
		const result = await tryPromise(promise)
		expect(result.ok).toEqual(true)
		expect(result.unwrap()).toEqual(42)
	})

	it("settles a rejected Promise to an Err result", async () => {
		const error = new Error("Test error")
		const promise = Promise.reject(error)
		const result = await tryPromise(promise)
		expect(result.ok).toEqual(false)
		expect(result.unwrapErr()).toEqual(error)
	})
})

describe.concurrent("tryFn", () => {
	it("wraps a function call into a Result object", () => {
		const fn = () => 42
		const result = tryFn(fn)
		expect(result.ok).toEqual(true)
		expect(result.unwrap()).toEqual(42)
	})

	it("wraps a throwing function call into an Err result", () => {
		const error = new Error("Test error")
		const fn = () => {
			throw error
		}
		const result = tryFn(fn)
		expect(result.ok).toEqual(false)
		expect(result.unwrapErr()).toEqual(error)
	})
})

describe.concurrent("tryAsyncFn", () => {
	it("wraps an async function call into a Result object", async () => {
		const fn = async () => Promise.resolve(42)
		const result = await tryAsyncFn(fn)
		expect(result.ok).toEqual(true)
		expect(result.unwrap()).toEqual(42)
	})

	it("wraps a throwing async function call into an Err result", async () => {
		const error = new Error("Test error")
		const fn = async (): Promise<number> => {
			throw error
		}
		const result = await tryAsyncFn(fn)
		expect(result.ok).toEqual(false)
		expect(result.unwrapErr()).toEqual(error)
	})
})
