import {describe, expect, it, test} from "vitest"
import {ResultError, StdError, inspectSymbol} from "../src"

describe.concurrent("ResultError", () => {
	class MyResultError extends ResultError<Error> {
		static _tag = "MyResultError" as const
		readonly tag = MyResultError._tag

		constructor(message?: string, cause?: Error) {
			super({message, cause})
		}
	}

	describe("returns instance", () => {
		test("without params", () => {
			const error = new MyResultError()

			expect(error).toBeInstanceOf(ResultError)
			expect(error).toBeInstanceOf(MyResultError)

			expect(error.tag).toEqual(MyResultError._tag)
			expect(error.name).toEqual(error.tag)
			expect(error.stack).toBeDefined()

			expect(error.message).toEqual("")
			expect(error.cause).toBeNull()
			expect(error.toString()).toEqual(error.name)
			expect(error[inspectSymbol]()).toEqual(error.stack)
		})

		test("with message", () => {
			const msg = "msg"
			const error = new MyResultError(msg)

			expect(error).toBeInstanceOf(ResultError)
			expect(error).toBeInstanceOf(MyResultError)

			expect(error.tag).toEqual(MyResultError._tag)
			expect(error.name).toEqual(error.tag)
			expect(error.stack).toBeDefined()

			expect(error.message).toEqual(msg)
			expect(error.cause).toBeNull()
			expect(error.toString()).toEqual(`${error.name}: ${error.message}`)
			expect(error[inspectSymbol]()).toEqual(error.stack)
		})

		test("with cause", () => {
			let cause = new Error("msg")
			let error = new MyResultError("", cause)

			expect(error).toBeInstanceOf(ResultError)
			expect(error).toBeInstanceOf(MyResultError)

			expect(error.tag).toEqual(MyResultError._tag)
			expect(error.name).toEqual(error.tag)
			expect(error.stack).toBeDefined()

			expect(error.message).toEqual("")
			expect(error.cause).toEqual(cause)
			expect(error.toString()).toEqual(`${error.name}\nCaused by: ${error.cause?.toString()}`)
			expect(error[inspectSymbol]()).toEqual(error.stack + `\nCaused by: ${cause.stack}`)
		})

		test("with message and cause", () => {
			const msg = "panic message"
			let cause = new Error("error message")
			let error = new MyResultError(msg, cause)

			expect(error).toBeInstanceOf(ResultError)
			expect(error).toBeInstanceOf(MyResultError)

			expect(error.tag).toEqual(MyResultError._tag)
			expect(error.name).toEqual(error.tag)
			expect(error.stack).toBeDefined()

			expect(error.message).toEqual(msg)
			expect(error.cause).toEqual(cause)
			expect(error.toString()).toEqual(
				`${error.name}: ${error.message}\nCaused by: ${error.cause?.toString()}`,
			)
			expect(error[inspectSymbol]()).toEqual(error.stack + `\nCaused by: ${cause.stack}`)
		})
	})
})

describe.concurrent("StdError", () => {
	it("creates an instance when given an Error", () => {
		const error = new Error("Test error")
		const stdError = new StdError(error)
		expect(stdError).toBeInstanceOf(StdError)
		expect(stdError.cause).toEqual(error)
		expect(stdError.causeRaw).toEqual(error)
	})

	it("creates an instance when given an unknown value", () => {
		const values = [1, "str", true, undefined, null, {}, [], new Date()] as const
		for (const value of values) {
			const stdError = new StdError(value)
			expect(stdError).toBeInstanceOf(StdError)
			expect(stdError.cause).toBeInstanceOf(TypeError)
			expect(stdError.cause.message).toEqual(`Unexpected error type: "${String(value)}"`)
			expect(stdError.causeRaw).toEqual(value)
		}
	})
})
