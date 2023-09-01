import {describe, expect, it} from "vitest"
import {R, Panic, UnwrapPanic} from "../src"

describe.concurrent("fn", () => {
	it("returns Ok result when provided function does not throw", () => {
		const fn = () => R.ok(42)
		const wrappedFn = R.fn(fn)
		const result = wrappedFn()
		expect(result.unwrap()).toEqual(42)
	})

	it("returns Err result when provided function returns Err", () => {
		const fn = () => R.err("rekt")
		const wrappedFn = R.fn(fn)
		const result = wrappedFn()
		expect(result.unwrapErr()).toEqual(new Error("rekt"))
	})

	it("returns Err result when provided function throws UnwrapPanic", () => {
		const error = new Error("Original error")
		const fn = (): R.Result<number> => {
			throw new UnwrapPanic(error)
		}
		const wrappedFn = R.fn(fn)
		const result = wrappedFn()
		expect(result.unwrapErr()).toEqual(error)
	})

	it("throws when provided function throws an error other than UnwrapPanic", () => {
		const error = new Error("Other error")
		const fn = () => {
			throw error
		}
		const wrappedFn = R.fn(fn)
		expect(() => wrappedFn()).toThrow(Panic)
	})
})

describe.concurrent("asyncFn", () => {
	it("returns Ok result when provided async function does not throw", async () => {
		const fn = async () => Promise.resolve(R.ok(42))
		const wrappedFn = R.asyncFn(fn)
		const result = await wrappedFn()
		expect(result.unwrap()).toEqual(42)
	})

	it("returns Err result when provided async function throws UnwrapPanic", async () => {
		const error = new Error("Original error")
		const fn = async () => Promise.reject(new UnwrapPanic(error))
		const wrappedFn = R.asyncFn(fn)
		const result = await wrappedFn()
		expect(result.unwrapErr()).toEqual(error)
	})

	it("throws when provided async function throws an error other than UnwrapPanic", async () => {
		const error = new Error("Other error")
		const fn = async () => Promise.reject(error)
		const wrappedFn = R.asyncFn(fn)
		await expect(wrappedFn()).rejects.toThrow(error)
	})
})
