import {expect, it, describe} from "vitest"
import {ResultError, guard, guardAsync, guardAsyncWith, guardWith} from ".."

class MyError extends ResultError {
	readonly tag = "MyError"
}

describe.concurrent("guard", () => {
	it("transforms a function into a function that returns a Result object", () => {
		const fn = (x: number, y: number) => x + y
		const wrappedFn = guard(fn)
		const result = wrappedFn(40, 2)
		expect(result.ok).toEqual(true)
		expect(result.unwrap()).toEqual(42)
	})

	it("transforms a throwing function into a function that returns an Err result", () => {
		const error = new Error("Test error")
		const fn = () => {
			throw error
		}
		const wrappedFn = guard(fn)
		const result = wrappedFn()
		expect(result.ok).toEqual(false)
		expect(result.unwrapErr().origin).toEqual(error)
	})
})

describe.concurrent("guardWith", () => {
	it("transforms a function into a function that returns a Result object", () => {
		const fn = (x: number, y: number) => x + y
		const wrappedFn = guardWith(fn, () => new MyError())
		const result = wrappedFn(40, 2)
		expect(result.ok).toEqual(true)
		expect(result.unwrap()).toEqual(42)
	})

	it("transforms a throwing function into a function that returns an Err result", () => {
		const error = new Error("Test error")
		const fn = () => {
			throw error
		}
		const myError = new MyError("My error")
		const wrappedFn = guardWith(fn, () => myError)
		const result = wrappedFn()
		expect(result.ok).toEqual(false)
		expect(result.unwrapErr()).toEqual(myError)
	})
})

describe.concurrent("guardAsync", () => {
	it("transforms an async function into a function that returns a Promise of a Result object", async () => {
		const fn = async (x: number, y: number) => Promise.resolve(x + y)
		const wrappedFn = guardAsync(fn)
		const result = await wrappedFn(40, 2)
		expect(result.ok).toEqual(true)
		expect(result.unwrap()).toEqual(42)
	})

	it("transforms a throwing async function into a function that returns a Promise of an Err result", async () => {
		const error = new Error("Test error")
		const fn = async (): Promise<number> => {
			throw error
		}
		const wrappedFn = guardAsync(fn)
		const result = await wrappedFn()
		expect(result.ok).toEqual(false)
		expect(result.unwrapErr().origin).toEqual(error)
	})
})

describe.concurrent("guardAsyncWith", () => {
	it("transforms an async function into a function that returns a Promise of a Result object", async () => {
		const fn = async (x: number, y: number) => Promise.resolve(x + y)
		const wrappedFn = guardAsyncWith(fn, () => new MyError())
		const result = await wrappedFn(40, 2)
		expect(result.ok).toEqual(true)
		expect(result.unwrap()).toEqual(42)
	})

	it("transforms a throwing async function into a function that returns a Promise of an Err result", async () => {
		const error = new Error("Test error")
		const fn = async (): Promise<number> => {
			throw error
		}
		const myError = new MyError("My error")
		const wrappedFn = guardAsyncWith(fn, () => myError)
		const result = await wrappedFn()
		expect(result.ok).toEqual(false)
		expect(result.unwrapErr()).toEqual(myError)
	})
})
