import {describe, it, expect} from "vitest"
import type {Result} from "./core"
import {R} from "."
import {Panic, PropagationPanic} from "./panic"

it("creates an Ok result", () => {
	const result = R.ok(42)
	expect(result.ok).toEqual(true)
	expect(result.value).toEqual(42)
})

it("creates an Err result", () => {
	const error = new Error("Test error")
	const result = R.err(error)
	expect(result.ok).toEqual(false)
	expect(result.error).toEqual(error)
})

it("creates an Err result from string", () => {
	const result = R.err("Test error")
	expect(result.ok).toEqual(false)
	expect(result.error).toEqual(new Error("Test error"))
})

describe("expect", () => {
	it("returns the value when called on an Ok result", () => {
		const result = R.ok(42)
		const value = result.expect()
		expect(value).to.equal(42)
	})

	it("throws a Panic with the provided message when called on an Err result", () => {
		const error = new Error("Original error")
		const result = R.err(error)
		expect(() => result.expect("Panic message")).to.throw(Panic, "Panic message")
	})

	it("throws a Panic with the provided Panic object when called on an Err result", () => {
		const error = new Error("Original error")
		const result = R.err(error)
		const panic = new Panic("Panic object")
		expect(() => result.expect(panic)).to.throw(Panic, "Panic object")
	})
})

describe("unwrap", () => {
	it("unwrap returns the value for an Ok result", () => {
		const result = R.ok(42)
		expect(result.unwrap()).toEqual(42)
	})

	it("unwrap throws a Panic for an Err result", () => {
		const error = new Error("Test error")
		const result = R.err(error)
		expect(() => result.unwrap()).toThrow(Panic)
	})

	it("unwrapErr returns the error for an Err result", () => {
		const error = new Error("Test error")
		const result = R.err(error)
		expect(result.unwrapErr()).toEqual(error)
	})

	it("unwrapErr throws for an Ok result", () => {
		const result = R.ok(42)
		expect(() => result.unwrapErr()).toThrow()
	})

	it("unwrapOr returns the value for an Ok result", () => {
		const result = R.ok(42) as Result<number>
		expect(result.unwrapOr(0)).toEqual(42)
	})

	it("unwrapOr returns the default value for an Err result", () => {
		const error = new Error("Test error")
		const result = R.err(error) as Result<number>
		expect(result.unwrapOr(42)).toEqual(42)
	})

	it("unwrapOrElse returns the value for an Ok result", () => {
		const result = R.ok(42) as Result<number>
		expect(result.unwrapOrElse(() => 0)).toEqual(42)
	})

	it("unwrapOrElse returns the default value from a function for an Err result", () => {
		const error = new Error("Test error")
		const result = R.err(error) as Result<number>
		const unwrapped = result.unwrapOrElse(() => 42)
		expect(unwrapped).toEqual(42)
	})

	it("unwrapOrElse can panic", () => {
		const error = new Error("Test error")
		expect(() =>
			R.err(error).unwrapOrElse((error) => {
				throw new Panic(error)
			}),
		).toThrow(Panic)
	})
})

describe("match", () => {
	it("calls the ok function for an Ok result", () => {
		const result = R.ok(42)
		const output = result.match({
			ok: (value) => value * 2,
			err: () => 0,
		})
		expect(output).toEqual(84)
	})

	it("calls the err function for an Err result", () => {
		const error = new Error("Test error")
		const result = R.err(error) as Result<number>
		const output = result.match({
			ok: (value) => value * 2,
			err: () => 0,
		})
		expect(output).toEqual(0)
	})
})

describe("propagate", () => {
	it("returns the value for an Ok result", () => {
		const result = R.ok(42)
		const propagatedResult = result.propagate()
		expect(propagatedResult).toEqual(42)
	})

	it("throws a PropagationPanic for an Err result", () => {
		const error = new Error("Test error")
		const result = R.err(error)
		expect(() => result.propagate()).toThrow(PropagationPanic)
	})
})
