import {describe, it, expect} from "vitest"
import {R} from "../src"

describe.concurrent("handleError", () => {
	it("returns an Error when given an Error", () => {
		class TestError extends Error {}
		const error = new TestError("Test error")
		const err = R.handleError(error)
		expect(err).to.be.instanceof(TestError)
	})

	it("throws a Panic when given a Panic", () => {
		const msg = "Test panic"
		const panic = new R.Panic(msg)
		expect(() => R.handleError(panic)).to.throw(R.Panic, msg)
	})

	it("throws a Panic when given an unknown value", () => {
		expect(() => R.handleError(0)).to.throw(R.InvalidErrorPanic)
		expect(() => R.handleError("")).to.throw(R.InvalidErrorPanic)
		expect(() => R.handleError(true)).to.throw(R.InvalidErrorPanic)
		expect(() => R.handleError(undefined)).to.throw(R.InvalidErrorPanic)
		expect(() => R.handleError(null)).to.throw(R.InvalidErrorPanic)
		expect(() => R.handleError({})).to.throw(R.InvalidErrorPanic)
		expect(() => R.handleError([])).to.throw(R.InvalidErrorPanic)
	})
})

describe.concurrent("ok", () => {
	it("returns an Ok result", () => {
		const result = R.ok(42)
		expect(result.ok).toEqual(true)
		expect(result.value).toEqual(42)
	})
})

describe.concurrent("err", () => {
	it("returns an Err when given an Error", () => {
		const error = new Error("Test error")
		const result = R.err(error)
		expect(result.ok).toEqual(false)
		expect(result.error).toEqual(error)
	})

	it("returns an Err when given a string", () => {
		const msg = "Test error"
		const result = R.err(msg)
		expect(result.ok).toEqual(false)
		expect(result.error).toEqual(new Error(msg))
	})

	it("throws a Panic when given a Panic", () => {
		const panic = new R.Panic("Test panic")
		expect(() => R.err(panic)).to.throw(R.Panic)
	})
})

describe.concurrent("expect", () => {
	it("returns the value when called on an Ok result", () => {
		const result = R.ok(42)
		const value = result.expect()
		expect(value).to.equal(42)
	})

	it("throws a Panic with the provided message when called on an Err result", () => {
		const error = new Error("Original error")
		const result = R.err(error)
		expect(() => result.expect("Panic message")).to.throw(R.Panic, "Panic message")
	})

	it("throws a Panic with the provided Panic object when called on an Err result", () => {
		const error = new Error("Original error")
		const result = R.err(error)
		const panic = new R.Panic("Panic object")
		expect(() => result.expect(panic)).to.throw(R.Panic, "Panic object")
	})
})

describe.concurrent("unwrap", () => {
	it("returns the value for an Ok result", () => {
		const result = R.ok(42)
		expect(result.unwrap()).toEqual(42)
	})

	it("throws a Panic for an Err result", () => {
		const error = new Error("Test error")
		const result = R.err(error)
		expect(() => result.unwrap()).toThrow(R.UnwrapPanic)
	})
})

describe.concurrent("unwrapErr", () => {
	it("returns the error for an Err result", () => {
		const error = new Error("Test error")
		const result = R.err(error)
		expect(result.unwrapErr()).toEqual(error)
	})

	it("throws for an Ok result", () => {
		const result = R.ok(42)
		expect(() => result.unwrapErr()).toThrow(R.UnwrapPanic)
	})
})

describe.concurrent("unwrapOr", () => {
	it("returns the value for an Ok result", () => {
		const result = R.ok(42) as R.Result<number>
		expect(result.unwrapOr(0)).toEqual(42)
	})

	it("returns the default value for an Err result", () => {
		const error = new Error("Test error")
		const result = R.err(error) as R.Result<number>
		expect(result.unwrapOr(42)).toEqual(42)
	})
})

describe.concurrent("unwrapOrElse", () => {
	it("returns the value for an Ok result", () => {
		const result = R.ok(42) as R.Result<number>
		expect(result.unwrapOrElse(() => 0)).toEqual(42)
	})

	it("returns the default value from a function for an Err result", () => {
		const error = new Error("Test error")
		const result = R.err(error) as R.Result<number>
		const unwrapped = result.unwrapOrElse(() => 42)
		expect(unwrapped).toEqual(42)
	})

	it("can panic", () => {
		const error = new Error("Test error")
		expect(() =>
			R.err(error).unwrapOrElse((error) => {
				throw new R.Panic(error)
			}),
		).toThrow(R.Panic)
	})
})

describe.concurrent("match", () => {
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
		const result = R.err(error) as R.Result<number>
		const output = result.match({
			ok: (value) => value * 2,
			err: () => 0,
		})
		expect(output).toEqual(0)
	})
})
