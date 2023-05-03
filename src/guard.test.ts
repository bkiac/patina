import {expect, it} from "vitest"
import {R} from "."

it("transforms a function into a function that returns a Result object", () => {
	const fn = (x: number, y: number) => x + y
	const wrappedFn = R.guard(fn)
	const result = wrappedFn(40, 2)
	expect(result.ok).toEqual(true)
	expect(result.unwrap()).toEqual(42)
})

it("transforms a throwing function into a function that returns an Err result", () => {
	const error = new Error("Test error")
	const fn = () => {
		throw error
	}
	const wrappedFn = R.guard(fn)
	const result = wrappedFn()
	expect(result.ok).toEqual(false)
	expect(result.unwrapErr()).toEqual(error)
})

it("transforms an async function into a function that returns a Promise of a Result object", async () => {
	const fn = async (x: number, y: number) => Promise.resolve(x + y)
	const wrappedFn = R.guard(fn)
	const result = await wrappedFn(40, 2)
	expect(result.ok).toEqual(true)
	expect(result.unwrap()).toEqual(42)
})

it("transforms a throwing async function into a function that returns a Promise of an Err result", async () => {
	const error = new Error("Test error")
	const fn = async () => {
		throw error
		// @ts-expect-error It's supposed to throw
		return Promise.resolve(42)
	}
	const wrappedFn = R.guard(fn)
	const result = await wrappedFn()
	expect(result.ok).toEqual(false)
	expect(result.unwrapErr()).toEqual(error)
})
