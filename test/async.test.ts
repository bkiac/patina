import {describe, it, expect} from "vitest"
import {err, Panic, PromiseResult, ok, UnwrapPanic} from "../src"

describe.concurrent("expect", () => {
	it("returns the value when called on an Ok result", async () => {
		const result = new PromiseResult(Promise.resolve(ok(42)))
		const value = await result.expect("")
		expect(value).to.equal(42)
	})

	it("throws a Panic with the provided message when called on an Err result", async () => {
		const error = new Error("Original error")
		const result = new PromiseResult(Promise.resolve(err(error)))
		await expect(result.expect("Panic message")).rejects.toThrow(Panic)
	})

	it("throws a Panic with the provided Panic when called on an Err result", async () => {
		const error = new Error("Original error")
		const result = new PromiseResult(Promise.resolve(err(error)))
		const panic = new Panic("Panic")
		await expect(result.expect(panic)).rejects.toEqual(panic)
	})
})

describe.concurrent("unwrapUnsafe", () => {
	it("returns the value for an Ok result", async () => {
		const result = new PromiseResult(Promise.resolve(ok(42)))
		await expect(result.unwrapUnsafe()).resolves.toEqual(42)
	})

	it("throws a Panic for an Err result", async () => {
		const error = new Error("Test error")
		const result = new PromiseResult(Promise.resolve(err(error)))
		await expect(result.unwrapUnsafe()).rejects.toThrow(UnwrapPanic)
	})
})

describe.concurrent("unwrapErrUnsafe", () => {
	it("returns the error for an Err result", async () => {
		const error = new Error("Test error")
		const result = new PromiseResult(Promise.resolve(err(error)))
		await expect(result.unwrapErrUnsafe()).resolves.toEqual(error)
	})

	it("throws for an Ok result", async () => {
		const result = new PromiseResult(Promise.resolve(ok(42)))
		await expect(result.unwrapErrUnsafe()).rejects.toThrow(UnwrapPanic)
	})
})

describe.concurrent("unwrapOr", () => {
	it("returns the value for an Ok result", async () => {
		const result = new PromiseResult(Promise.resolve(ok(42)))
		await expect(result.unwrapOr(0)).resolves.toEqual(42)
	})

	it("returns the default value for an Err result", async () => {
		const error = new Error("Test error")
		const result = new PromiseResult(Promise.resolve(err(error)))
		await expect(result.unwrapOr(42)).resolves.toEqual(42)
	})
})

describe.concurrent("unwrapOrElse", () => {
	it("returns the value for an Ok result", async () => {
		const result = new PromiseResult(Promise.resolve(ok(42)))
		await expect(result.unwrapOrElse(() => 0)).resolves.toEqual(42)
	})

	it("returns the default value from a function for an Err result", async () => {
		const error = new Error("Test error")
		const result = new PromiseResult(Promise.resolve(err(error)))
		await expect(result.unwrapOrElse(() => 42)).resolves.toEqual(42)
	})

	it("can panic", async () => {
		const error = new Error("Test error")
		const result = new PromiseResult(Promise.resolve(err(error)))
		await expect(() =>
			result.unwrapOrElse((error) => {
				throw new Panic(error)
			}),
		).rejects.toThrow(Panic)
	})
})

describe.concurrent("match", () => {
	it("calls the ok function for an Ok result", async () => {
		const result = new PromiseResult(Promise.resolve(ok(42)))
		const output = result.match({
			ok: (value) => value * 2,
			err: () => 0,
		})
		await expect(output).resolves.toEqual(84)
	})

	it("calls the err function for an Err result", async () => {
		const error = new Error("Test error")
		const result = new PromiseResult<number>(Promise.resolve(err(error)))
		const output = result.match({
			ok: (value) => value * 2,
			err: () => 0,
		})
		await expect(output).resolves.toEqual(0)
	})
})
