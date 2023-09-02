import {describe, expect, it} from "vitest"
import {Panic, PropagationPanic, Result, asyncFn, fn, Ok, Err} from "../src"

describe.concurrent("fn", () => {
	it("returns Ok result when provided function does not throw", () => {
		const wrappedFn = fn(() => new Ok(42))
		const result = wrappedFn()
		expect(result.unwrapUnsafe()).toEqual(42)
	})

	it("returns Err result when provided function returns Err", () => {
		const wrappedFn = fn(() => new Err("rekt"))
		const result = wrappedFn()
		expect(result.unwrapErrUnsafe()).toEqual(new Error("rekt"))
	})

	it("returns Err result when provided function throws PropagationPanic", () => {
		const error = new Error("Original error")
		const wrappedFn = fn((): Result<number> => {
			throw new PropagationPanic(error)
		})
		const result = wrappedFn()
		expect(result.unwrapErrUnsafe()).toEqual(error)
	})

	it("throws when provided function throws an error other than PropagationPanic", () => {
		const error = new Error("Other error")
		const wrappedFn = fn(() => {
			throw error
		})
		expect(() => wrappedFn()).toThrow(Panic)
	})
})

describe.concurrent("asyncFn", () => {
	it("returns Ok result when provided async function does not throw", async () => {
		const wrappedFn = asyncFn(async () => Promise.resolve(new Ok(42)))
		const result = await wrappedFn()
		expect(result.unwrapUnsafe()).toEqual(42)
	})

	it("returns Err result when provided async function throws PropagationPanic", async () => {
		const error = new Error("Original error")
		const wrappedFn = asyncFn(async () => Promise.reject(new PropagationPanic(error)))
		const result = await wrappedFn()
		expect(result.unwrapErrUnsafe()).toEqual(error)
	})

	it("throws when provided async function throws an error other than PropagationPanic", async () => {
		const error = new Error("Other error")
		const wrappedFn = asyncFn(async () => Promise.reject(error))
		await expect(wrappedFn()).rejects.toThrow(error)
	})
})
