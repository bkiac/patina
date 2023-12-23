import {describe, expect, it, test} from "vitest"
import {ResultError, StdError, inspectSymbol} from "../src"
import {expectTypeOf} from "vitest"

describe.concurrent("ResultError", () => {
	class MyResultError extends ResultError {
		static TAG = "MyResultError" as const
		readonly tag = MyResultError.TAG
	}

	describe.concurrent("returns instance", () => {
		test("without params", () => {
			const error = new MyResultError()

			expect(error).toBeInstanceOf(ResultError)
			expect(error).toBeInstanceOf(MyResultError)

			expect(error.tag).toEqual(MyResultError.TAG)
			expect(error.name).toEqual(error.tag)
			expect(error.stack).toBeDefined()

			expect(error.message).toEqual("")
			expect(error.cause).toBeNull()
			expect(error.toString()).toEqual(error.name)
			expect(error[inspectSymbol]()).toEqual(error.stack)
		})

		test("with message", () => {
			const msg = "msg"
			const error = new MyResultError({message: msg})

			expect(error).toBeInstanceOf(ResultError)
			expect(error).toBeInstanceOf(MyResultError)

			expect(error.tag).toEqual(MyResultError.TAG)
			expect(error.name).toEqual(error.tag)
			expect(error.stack).toBeDefined()

			expect(error.message).toEqual(msg)
			expect(error.cause).toBeNull()
			expect(error.toString()).toEqual(`${error.name}: ${error.message}`)
			expect(error[inspectSymbol]()).toEqual(error.stack)
		})

		test("with cause", () => {
			let cause = new Error("msg")
			let error = new MyResultError({cause})

			expect(error).toBeInstanceOf(ResultError)
			expect(error).toBeInstanceOf(MyResultError)

			expect(error.tag).toEqual(MyResultError.TAG)
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
			let error = new MyResultError({message: msg, cause})

			expect(error).toBeInstanceOf(ResultError)
			expect(error).toBeInstanceOf(MyResultError)

			expect(error.tag).toEqual(MyResultError.TAG)
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

	describe("types", () => {
		it("works with optional", () => {
			class ErrorWithMaybeCause extends ResultError {
				readonly tag = "ErrorWithoutCause"
			}

			let error = new ErrorWithMaybeCause()
			error = new ErrorWithMaybeCause({message: "msg"})
			error = new ErrorWithMaybeCause({cause: new Error()})
			error = new ErrorWithMaybeCause({message: "msg", cause: new Error()})
		})

		it("works without cause", () => {
			class ErrorWithoutCause extends ResultError<null> {
				readonly tag = "ErrorWithoutCause"
			}

			let error = new ErrorWithoutCause()
			error = new ErrorWithoutCause({message: "msg"})
			// @ts-expect-error
			error = new ErrorWithoutCause({cause: new Error()})
			// @ts-expect-error
			error = new ErrorWithoutCause({message: "msg", cause: new Error()})
		})

		it("works with cause", () => {
			class ErrorWithCause extends ResultError<Error> {
				readonly tag = "ErrorWithoutCause"
			}

			// @ts-expect-error
			let error = new ErrorWithCause()
			// @ts-expect-error
			error = new ErrorWithCause({message: "msg"})
			error = new ErrorWithCause({cause: new Error()})
			error = new ErrorWithCause({message: "msg", cause: new Error()})
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
