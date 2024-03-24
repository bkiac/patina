import {expect, it} from "vitest"
import {Panic} from "../src/panic"

it("returns an instance without params", () => {
	const panic = new Panic()

	expect(panic).toBeInstanceOf(Error)
	expect(panic).toBeInstanceOf(Panic)

	expect(panic.name).toEqual("Panic")
	expect(panic.message).toEqual("")
	expect(panic.stack).toBeDefined()
	expect(panic.cause).toBeUndefined()
})

it("returns an instance with message", () => {
	const msg = "msg"
	const panic = new Panic(msg)

	expect(panic).toBeInstanceOf(Error)
	expect(panic).toBeInstanceOf(Panic)

	expect(panic.name).toEqual("Panic")
	expect(panic.message).toEqual(msg)
	expect(panic.stack).toBeDefined()
	expect(panic.cause).toBeUndefined()
})

it("returns an instance with error", () => {
	const panicMsg = "panic message"
	const errorMsg = "error message"
	let cause = new Error(errorMsg)
	let panic = new Panic(panicMsg, {cause})

	expect(panic).toBeInstanceOf(Error)
	expect(panic).toBeInstanceOf(Panic)

	expect(panic.name).toEqual("Panic")
	expect(panic.message).toEqual(panicMsg)
	expect(panic.stack).toBeDefined()
	expect(panic.cause).toEqual(cause)

	cause.name = "MyError"
	panic = new Panic(panicMsg, {cause})
	expect(panic.stack).toBeDefined()
})

it("returns an instance with unknown", () => {
	const panicMsg = "panic message"
	let cause = "string cause"
	let panic = new Panic(panicMsg, {cause})

	expect(panic).toBeInstanceOf(Error)
	expect(panic).toBeInstanceOf(Panic)

	expect(panic.name).toEqual("Panic")
	expect(panic.message).toEqual(panicMsg)
	expect(panic.stack).toBeDefined()
	expect(panic.cause).toEqual(cause)
})
