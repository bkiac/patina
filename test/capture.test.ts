import {expect, it} from "vitest"
import {R} from "."
import {Panic, PropagationPanic} from "./core"

it("works", () => {})

// it("returns Ok result when provided function does not throw", () => {
// 	const fn = () => R.ok(42)
// 	const capturedFn = R.capture(fn)
// 	const result = capturedFn()
// 	expect(result.unwrap()).toEqual(42)
// })

// it("returns Err result when provided function returns Err", () => {
// 	const fn = () => R.err("rekt")
// 	const capturedFn = R.capture(fn)
// 	const result = capturedFn()
// 	expect(result.unwrapErr()).toEqual(new Error("rekt"))
// })

// it("returns Err result when provided function throws PropagationPanic", () => {
// 	const error = new Error("Original error")
// 	const fn = () => {
// 		throw new PropagationPanic(error)
// 	}
// 	const capturedFn = R.capture(fn)
// 	const result = capturedFn()
// 	expect(result.unwrapErr()).toEqual(error)
// })

// it("throws when provided function throws an error other than PropagationPanic", () => {
// 	const error = new Error("Other error")
// 	const fn = () => {
// 		throw error
// 	}
// 	const capturedFn = R.capture(fn)
// 	expect(() => capturedFn()).toThrow(Panic)
// })

// it("returns Ok result when provided async function does not throw", async () => {
// 	const fn = async () => Promise.resolve(R.ok(42))
// 	const capturedFn = R.capture(fn)
// 	const result = await capturedFn()
// 	expect(result.unwrap()).toEqual(42)
// })

// it("returns Err result when provided async function throws PropagationPanic", async () => {
// 	const error = new Error("Original error")
// 	const fn = async () => Promise.reject(new PropagationPanic(error))
// 	const capturedFn = R.capture(fn)
// 	const result = await capturedFn()
// 	expect(result.unwrapErr()).toEqual(error)
// })

// it("throws when provided async function throws an error other than PropagationPanic", async () => {
// 	const error = new Error("Other error")
// 	const fn = async () => Promise.reject(error)
// 	const capturedFn = R.capture(fn)
// 	await expect(capturedFn()).rejects.toThrow(error)
// })
