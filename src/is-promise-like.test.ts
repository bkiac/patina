import {test, assert} from "vitest"
import {isPromiseLike} from "./is-promise-like"

test("detects native Promise", () => {
	// eslint-disable-next-line @typescript-eslint/no-empty-function
	const promise = new Promise<string>(() => {})
	assert(isPromiseLike(promise))
})

test("detects Promise-like object", () => {
	const promiseLike = {
		then: (onFulfill: () => void) => onFulfill(),
	}
	assert(isPromiseLike(promiseLike))
})

test("rejects non-Promise object", () => {
	const notPromise = {foo: "bar"}
	assert(!isPromiseLike(notPromise))
})

test("rejects null", () => {
	assert(!isPromiseLike(null))
})

test("rejects undefined", () => {
	assert(!isPromiseLike(undefined))
})

test("rejects primitive types", () => {
	assert(!isPromiseLike(42))
	assert(!isPromiseLike("Hello, World!"))
	assert(!isPromiseLike(true))
})
