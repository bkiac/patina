import {expect, it} from "vitest"
import {Panic} from "./panic"

it("returns an instance without args", () => {
	const panic = new Panic()

	expect(panic).toBeInstanceOf(Error)
	expect(panic).toBeInstanceOf(Panic)

	expect(panic.message).toEqual("")
	expect(panic.stack).toContain("Panic: ")
})

it("returns an instance with message", () => {
	const msg = "msg"
	const panic = new Panic(msg)

	expect(panic).toBeInstanceOf(Error)
	expect(panic).toBeInstanceOf(Panic)

	expect(panic.message).toEqual(msg)
	expect(panic.stack).toContain(`Panic: ${msg}`)
})

it("returns an instance with error", () => {
	let origin = new Error("msg")
	let panic = new Panic(origin)
	expect(panic).toBeInstanceOf(Error)
	expect(panic).toBeInstanceOf(Panic)

	expect(panic.origin).toEqual(origin)
	expect(panic.message).toEqual(origin.message)
	expect(panic.stack).toContain(`Panic: ${origin.message}`)

	origin.name = "MyError"
	panic = new Panic(origin)
	expect(panic.stack).toContain(`Panic from MyError: ${origin.message}`)
})
