import {describe, expect, it, test} from "vitest"
import {ResultError, StdError, inspectSymbol} from "../internal.js"

describe.concurrent("ResultError", () => {
	class MyResultError extends ResultError<Error> {
		static _tag = "MyResultError" as const
		readonly tag = MyResultError._tag

		constructor(message?: string, origin?: Error) {
			super(message, origin)
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
			expect(error.origin).toBeNull()
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
			expect(error.origin).toBeNull()
			expect(error.toString()).toEqual(`${error.name}: ${error.message}`)
			expect(error[inspectSymbol]()).toEqual(error.stack)
		})

		test("with origin", () => {
			let origin = new Error("msg")
			let error = new MyResultError("", origin)

			expect(error).toBeInstanceOf(ResultError)
			expect(error).toBeInstanceOf(MyResultError)

			expect(error.tag).toEqual(MyResultError._tag)
			expect(error.name).toEqual(error.tag)
			expect(error.stack).toBeDefined()

			expect(error.message).toEqual("")
			expect(error.origin).toEqual(origin)
			expect(error.toString()).toEqual(
				`${error.name}\nCaused by: ${error.origin?.toString()}`,
			)
			expect(error[inspectSymbol]()).toEqual(error.stack + `\nCaused by: ${origin.stack}`)
		})

		test("with message and origin", () => {
			const msg = "panic message"
			let origin = new Error("error message")
			let error = new MyResultError(msg, origin)

			expect(error).toBeInstanceOf(ResultError)
			expect(error).toBeInstanceOf(MyResultError)

			expect(error.tag).toEqual(MyResultError._tag)
			expect(error.name).toEqual(error.tag)
			expect(error.stack).toBeDefined()

			expect(error.message).toEqual(msg)
			expect(error.origin).toEqual(origin)
			expect(error.toString()).toEqual(
				`${error.name}: ${error.message}\nCaused by: ${error.origin?.toString()}`,
			)
			expect(error[inspectSymbol]()).toEqual(error.stack + `\nCaused by: ${origin.stack}`)
		})
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
			expect(stdError.origin).toBeInstanceOf(TypeError)
			expect(stdError.origin.message).toEqual(`Unexpected error type: "${String(value)}"`)
			expect(stdError.originRaw).toEqual(value)
		}
	})
})
