import {describe, expect, it} from "vitest"
import {
	ErrorWithTag,
	tryAsyncFn,
	tryAsyncFnWith,
	tryFn,
	tryFnWith,
	tryPromise,
	tryPromiseWith,
} from "../src"
import {TaggedError} from "./util"

describe.concurrent("tryFn", () => {
	it("wraps a function call into a Result object", () => {
		const fn = () => 42
		const result = tryFn(fn)
		expect(result.isOk).toEqual(true)
		expect(result.unwrap()).toEqual(42)
	})

	it("wraps a throwing function call into an Err result", () => {
		const error = new Error("Test error")
		const fn = () => {
			throw error
		}
		const result = tryFn(fn)
		expect(result.isOk).toEqual(false)
		expect(result.unwrapErr().cause).toEqual(error)
	})
})

describe.concurrent("tryFnWith", () => {
	it("wraps a function call into a Result object", () => {
		const fn = () => 42
		const result = tryFnWith(fn, () => new TaggedError())
		expect(result.isOk).toEqual(true)
		expect(result.unwrap()).toEqual(42)
	})

	it("wraps a throwing function call into an Err result", () => {
		const error = new Error("Test error")
		const fn = () => {
			throw error
		}
		const myError = new TaggedError()
		const result = tryFnWith(fn, () => myError)
		expect(result.isOk).toEqual(false)
		expect(result.unwrapErr()).toEqual(myError)
	})
})

describe.concurrent("tryPromise", () => {
	it("settles a Promise to an Ok result", async () => {
		const promise = Promise.resolve(42)
		const result = await tryPromise(promise)
		expect(result.isOk).toEqual(true)
		expect(result.unwrap()).toEqual(42)
	})

	it("settles a rejected Promise to an Err result", async () => {
		const error = new Error("Test error")
		const promise = Promise.reject(error)
		const result = await tryPromise(promise)
		expect(result.isOk).toEqual(false)
		expect(result.unwrapErr().cause).toEqual(error)
	})
})

describe.concurrent("tryPromiseWith", () => {
	it("settles a Promise to an Ok result", async () => {
		const promise = Promise.resolve(42)
		const result = await tryPromiseWith(promise, () => new TaggedError())
		expect(result.isOk).toEqual(true)
		expect(result.unwrap()).toEqual(42)
	})

	it("settles a rejected Promise to an Err result", async () => {
		const error = new Error("Test error")
		const promise = Promise.reject(error)
		const myError = new TaggedError()
		const result = await tryPromiseWith(promise, () => myError)
		expect(result.isOk).toEqual(false)
		expect(result.unwrapErr()).toEqual(myError)
	})
})

describe.concurrent("tryAsyncFn", () => {
	it("wraps an async function call into a Result object", async () => {
		const fn = async () => Promise.resolve(42)
		const result = await tryAsyncFn(fn)
		expect(result.isOk).toEqual(true)
		expect(result.unwrap()).toEqual(42)
	})

	it("wraps a throwing async function call into an Err result", async () => {
		const error = new Error("Test error")
		const fn = async (): Promise<number> => {
			throw error
		}
		const result = await tryAsyncFn(fn)
		expect(result.isOk).toEqual(false)
		expect(result.unwrapErr().cause).toEqual(error)
	})
})

describe.concurrent("tryAsyncFnWith", () => {
	it("wraps an async function call into a Result object", async () => {
		const fn = async () => Promise.resolve(42)
		const result = await tryAsyncFnWith(fn, () => new TaggedError())
		expect(result.isOk).toEqual(true)
		expect(result.unwrap()).toEqual(42)
	})

	it("wraps a throwing async function call into an Err result", async () => {
		const error = new Error("Test error")
		const fn = async (): Promise<number> => {
			throw error
		}
		const myError = new TaggedError()
		const result = await tryAsyncFnWith(fn, () => myError)
		expect(result.isOk).toEqual(false)
		expect(result.unwrapErr()).toEqual(myError)
	})
})
