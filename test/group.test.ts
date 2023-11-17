import {test, expect, vi} from "vitest"
import {ResultGroup, createGroup} from "../src/group"
import {ResultError} from "../src/internal"

test("constructor", () => {
	const handleError = vi.fn()
	const result = createGroup(handleError)
	expect(result).toBeInstanceOf(ResultGroup)
	// @ts-expect-error
	expect(result.handleError).toBe(handleError)
})

class FooError extends ResultError {
	readonly tag = "foo"
}

class BarError extends ResultError {
	readonly tag = "bar"
}

const g = createGroup(() => new FooError())

test("tryFn", () => {
	const result = g.tryFn(() => {
		throw new Error("error")
	})
	expect(result.unwrapErr()).toBeInstanceOf(FooError)
})

test("tryFnWith", () => {
	const result = g.tryFnWith(
		() => {
			throw new Error("error")
		},
		() => new BarError(),
	)
	expect(result.unwrapErr()).toBeInstanceOf(BarError)
})

test("tryPromise", async () => {
	const result = g.tryPromise(Promise.reject(new Error("error")))
	await expect(result.unwrapErr()).resolves.toBeInstanceOf(FooError)
})

test("tryPromiseWith", async () => {
	const result = g.tryPromiseWith(Promise.reject(new Error("error")), () => new BarError())
	await expect(result.unwrapErr()).resolves.toBeInstanceOf(BarError)
})

test("tryAsyncFn", async () => {
	const result = g.tryAsyncFn(async () => {
		throw new Error("error")
	})
	await expect(result.unwrapErr()).resolves.toBeInstanceOf(FooError)
})

test("tryAsyncFnWith", async () => {
	const result = g.tryAsyncFnWith(
		async () => {
			throw new Error("error")
		},
		() => new BarError(),
	)
	await expect(result.unwrapErr()).resolves.toBeInstanceOf(BarError)
})

test("guard", () => {
	const f = g.guard(() => {
		throw new Error("error")
	})
	expect(f().unwrapErr()).toBeInstanceOf(FooError)
})

test("guardWith", () => {
	const f = g.guardWith(
		() => {
			throw new Error("error")
		},
		() => new BarError(),
	)
	expect(f().unwrapErr()).toBeInstanceOf(BarError)
})

test("guardAsync", async () => {
	const f = g.guardAsync(async () => {
		throw new Error("error")
	})
	await expect(f().unwrapErr()).resolves.toBeInstanceOf(FooError)
})

test("guardAsyncWith", async () => {
	const f = g.guardAsyncWith(
		async () => {
			throw new Error("error")
		},
		() => new BarError(),
	)
	await expect(f().unwrapErr()).resolves.toBeInstanceOf(BarError)
})
