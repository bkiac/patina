import {expect, it} from "vitest"
import {Panic} from "./panic"

it("returns an instance without params", () => {
	const panic = new Panic()

	expect(panic).toBeInstanceOf(Error)
	expect(panic).toBeInstanceOf(Panic)

	expect(panic.name).toEqual("Panic")
	expect(panic.message).toEqual("")
	expect(panic.stack).toMatch("Panic()")
	expect(panic.origin).toBeUndefined()
})

it("returns an instance with message", () => {
	const msg = "msg"
	const panic = new Panic(msg)

	expect(panic).toBeInstanceOf(Error)
	expect(panic).toBeInstanceOf(Panic)

	expect(panic.name).toEqual("Panic")
	expect(panic.message).toEqual(msg)
	expect(panic.stack).toMatch(`Panic(${msg})`)
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
	expect(panic.stack).toMatch(`Panic(${panicMsg}) from Error(${errorMsg})`)
	expect(panic.origin).toEqual(origin)

	origin.name = "MyError"
	panic = new Panic(panicMsg, origin)
	expect(panic.stack).toMatch(`Panic(${panicMsg}) from ${origin.name}(${errorMsg})`)
})
