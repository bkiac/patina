import {describe, expect, it} from "vitest"
import {asyncFn, fn, Ok, Err} from ".."

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
})

describe.concurrent("asyncFn", () => {
	it("returns Ok result when provided async function does not throw", async () => {
		const wrappedFn = asyncFn(async () => Promise.resolve(Ok(42)))
		const result = await wrappedFn()
		expect(result.unwrap()).toEqual(42)
	})
})
