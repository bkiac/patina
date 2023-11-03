import {describe, expect, it} from "vitest"
import {InvalidErrorPanic, Panic, ResultError, toStdError, StdError} from "../src"

describe.concurrent("ResultError", () => {
	it("returns instance", () => {
		const error = new StdError()
		expect(error).toBeInstanceOf(ResultError)
		expect(error).toBeInstanceOf(StdError)
		expect(error.name).toEqual("ResultError")
		expect(error.tag).toEqual(StdError.tag)
	})

	it("returns message", () => {
		const error = new StdError("Test error")
		expect(error.message).toEqual("Test error")
	})

	it("returns the origin", () => {
		const origin = new Error("Origin error")
		const error = new StdError(origin)
		expect(error.stack).toContain("StdError: Origin error")
		expect(error.origin).toEqual(origin)
	})

	it("returns stack", () => {
		const error = new StdError("Test error")
		expect(error.stack).toBeDefined()
		expect(error.stack).toContain("StdError: Test error")
	})
})

describe.concurrent("toStdError", () => {
	it("returns an StdError when given an Error", () => {
		class TestError extends Error {}
		const error = new TestError("Test error")
		const stdError = toStdError(error)
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
