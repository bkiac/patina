import {expect, it} from "vitest"
import {Panic} from "./panic.js"
import {inspectSymbol} from "../util.js"

it("returns an instance without params", () => {
	const panic = new Panic()

	expect(panic).toBeInstanceOf(Error)
	expect(panic).toBeInstanceOf(Panic)

	expect(panic.name).toEqual("Panic")
	expect(panic.message).toEqual("")
	expect(panic.stack).toBeDefined()
	expect(panic.origin).toBeUndefined()
})

it("returns an instance with message", () => {
	const msg = "msg"
	const panic = new Panic(msg)

	expect(panic).toBeInstanceOf(Error)
	expect(panic).toBeInstanceOf(Panic)

	expect(panic.name).toEqual("Panic")
	expect(panic.message).toEqual(msg)
	expect(panic.stack).toBeDefined()
	expect(panic.origin).toBeUndefined()
})

it("returns an instance with error", () => {
	const panicMsg = "panic message"
	const errorMsg = "error message"
	let origin = new Error(errorMsg)
	let panic = new Panic(panicMsg, origin)

	expect(panic).toBeInstanceOf(Error)
	expect(panic).toBeInstanceOf(Panic)

	expect(panic.name).toEqual("Panic")
	expect(panic.message).toEqual(panicMsg)
	expect(panic.stack).toBeDefined()
	expect(panic.origin).toEqual(origin)
	expect(panic[inspectSymbol]()).toEqual(panic.stack + "\nCaused by: " + origin.stack)

	origin.name = "MyError"
	panic = new Panic(panicMsg, origin)
	expect(panic.stack).toBeDefined()
	expect(panic[inspectSymbol]()).toEqual(panic.stack + "\nCaused by: " + origin.stack)
})

it("returns an instance with unknown", () => {
	const panicMsg = "panic message"
	let origin = "string origin"
	let panic = new Panic(panicMsg, origin)

	expect(panic).toBeInstanceOf(Error)
	expect(panic).toBeInstanceOf(Panic)

	expect(panic.name).toEqual("Panic")
	expect(panic.message).toEqual(panicMsg)
	expect(panic.stack).toBeDefined()
	expect(panic.origin).toEqual(origin)
	expect(panic[inspectSymbol]()).toEqual(panic.stack + "\nCaused by: " + String(origin))
})
