import {describe, expect, it} from "vitest"
import {InvalidErrorPanic, Panic, ResultError, toStdError, StdError} from "../src"

describe.concurrent("ResultError", () => {
	class CustomError extends ResultError {
		static readonly tag = "CustomError"
		readonly name = CustomError.tag
	}

	it("returns name", () => {
		const error = new CustomError()
		expect(error.name).toEqual(CustomError.tag)
	})

	it("returns message", () => {
		const error = new CustomError("Test error")
		expect(error.message).toEqual("Test error")
	})

	it("returns stack", () => {
		const error = new CustomError("Test error")
		expect(error.stack).toContain("CustomError: Test error")
	})

	it("returns the origin", () => {
		const origin = new Error("Origin error")
		const error = new CustomError(origin)
		expect(error.stack).toContain("CustomError: Origin error")
		expect(error.stack).toContain("Origin error")
		expect(error.origin).toEqual(origin)
	})
})

describe.concurrent("toStdError", () => {
	it("returns an StdError when given an Error", () => {
		class TestError extends Error {}
		const error = new TestError("Test error")
		const stdError = toStdError(error)
		expect(stdError.name).toEqual("StdError")
		expect(stdError).toBeInstanceOf(StdError)
		expect(stdError.origin).toEqual(error)
	})

	it("throws a Panic when given a Panic", () => {
		const msg = "Test panic"
		const panic = new Panic(msg)
		expect(() => toStdError(panic)).toThrow(panic)
	})

	it("throws a Panic when given an unknown value", () => {
		expect(() => toStdError(0)).toThrow(InvalidErrorPanic)
		expect(() => toStdError("")).toThrow(InvalidErrorPanic)
		expect(() => toStdError(true)).toThrow(InvalidErrorPanic)
		expect(() => toStdError(undefined)).toThrow(InvalidErrorPanic)
		expect(() => toStdError(null)).toThrow(InvalidErrorPanic)
		expect(() => toStdError({})).toThrow(InvalidErrorPanic)
		expect(() => toStdError([])).toThrow(InvalidErrorPanic)
	})
})
