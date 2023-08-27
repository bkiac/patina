import { test, assert, describe } from "vitest"
import { isPromiseLike } from "./util"

describe("isPromiseLike", () => {
	describe("true", () => {
		test("native Promise", () => {
			// eslint-disable-next-line @typescript-eslint/no-empty-function
			assert(isPromiseLike(new Promise<string>(() => { })))
		})

		test("Promise-like object", () => {
			assert(isPromiseLike({
				then: (onFulfill: () => void) => onFulfill(),
			}))
		})
	})

	describe("false", () => {
		test("primitive", () => {
			assert(!isPromiseLike(42))
			assert(!isPromiseLike("Hello, World!"))
			assert(!isPromiseLike(true))
			assert(!isPromiseLike(undefined))
			assert(!isPromiseLike(null))
		})

		test("non-primitive", () => {
			assert(!isPromiseLike({}))
			assert(!isPromiseLike([]))
			assert(!isPromiseLike(new class Test { }))
		})
	})
});
