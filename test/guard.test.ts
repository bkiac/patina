import {expect, it, describe} from "vitest"
import {R} from "../src"

describe.concurrent("guard", () => {
	it("transforms a function into a function that returns a Result object", () => {
		const fn = (x: number, y: number) => x + y
		const wrappedFn = R.guard(fn)
		const result = wrappedFn(40, 2)
		expect(result.ok).toEqual(true)
		expect(result.unwrapUnsafe()).toEqual(42)
	})

	it("transforms a throwing function into a function that returns an Err result", () => {
		const error = new Error("Test error")
		const fn = () => {
			throw error
		}
		const wrappedFn = R.guard(fn)
		const result = wrappedFn()
		expect(result.ok).toEqual(false)
		expect(result.unwrapErrUnsafe()).toEqual(error)
	})
})

describe.concurrent("guardAsync", () => {
	it("transforms an async function into a function that returns a Promise of a Result object", async () => {
		const fn = async (x: number, y: number) => Promise.resolve(x + y)
		const wrappedFn = R.guardAsync(fn)
		const result = await wrappedFn(40, 2)
		expect(result.ok).toEqual(true)
		expect(result.unwrapUnsafe()).toEqual(42)
	})

	it("transforms a throwing async function into a function that returns a Promise of an Err result", async () => {
		const error = new Error("Test error")
		const fn = async (): Promise<number> => {
			throw error
		}
		const wrappedFn = R.guardAsync(fn)
		const result = await wrappedFn()
		expect(result.ok).toEqual(false)
		expect(result.unwrapErrUnsafe()).toEqual(error)
	})
})
