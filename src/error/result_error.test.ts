import {describe, expect, it} from "vitest"
import {ResultError, StdError} from "../internal"

describe.concurrent("ResultError", () => {
	class MyResultError extends ResultError {
		readonly tag = "MyResultError"

		constructor() {
			super(new Error())
		}
	}

	it("returns instance with no args", () => {
		const error = new MyResultError()

		expect(error).toBeInstanceOf(ResultError)
		expect(error).toBeInstanceOf(StdError)

		expect(error.tag).toEqual("StdError")

		expect(error.message).toEqual("")
		expect(error.stack).toContain("StdError: ")
	})

	it("returns instance with message", () => {
		const msg = "msg"
		const error = new StdError(msg)

		expect(error).toBeInstanceOf(ResultError)
		expect(error).toBeInstanceOf(StdError)

		expect(error.tag).toEqual("StdError")

		expect(error.message).toEqual(msg)
		expect(error.stack).toContain(`StdError: ${msg}`)
	})

	it("returns instance with error", () => {
		let origin = new Error("msg")
		let error = new StdError(origin)

		expect(error).toBeInstanceOf(ResultError)
		expect(error).toBeInstanceOf(StdError)

		expect(error.tag).toEqual("StdError")

		expect(error.origin).toEqual(origin)
		expect(error.message).toEqual(origin.message)
		expect(error.stack).toContain(`StdError: ${origin.message}`)

		origin = new Error("msg")
		origin.name = "MyError"
		error = new StdError(origin)
		expect(error.stack).toContain(`StdError from MyError: ${origin.message}`)
	})
})

describe.concurrent("StdError", () => {
	it("creates an instance when given an Error", () => {
		const error = new Error("Test error")
		const stdError = new StdError(error)
		expect(stdError).toBeInstanceOf(StdError)
		expect(stdError.origin).toEqual(error)
		expect(stdError.originRaw).toEqual(error)
	})

	it("creates an instance when given an unknown value", () => {
		const values = [1, "str", true, undefined, null, {}, [], new Date()] as const
		for (const value of values) {
			const stdError = new StdError(value)
			expect(stdError).toBeInstanceOf(StdError)
			expect(stdError.origin).toBeInstanceOf(Error)
			expect(stdError.origin.message).toContain("Unexpected error type")
			expect(stdError.originRaw).toEqual(value)
		}
	})
})
