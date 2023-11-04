import {test, expect, vi} from "vitest"
import {ResultModule, module} from "./module"
import {ResultError} from ".."

test("constructor", () => {
	const handleError = vi.fn()
	const result = module(handleError)

	expect(result).toBeInstanceOf(ResultModule)
	// @ts-expect-error
	expect(result.handleError).toBe(handleError)
})

class FooError extends ResultError {
	readonly tag = "foo"
}

class BarError extends ResultError {
	readonly tag = "bar"
}

const m = module(() => new FooError())

test("tryFn", () => {
	const result = m.tryFn(() => {
		throw new Error("error")
	})
	expect(result.unwrapErr()).toBeInstanceOf(FooError)
})

test("tryFnWith", () => {
	const result = m.tryFnWith(
		() => {
			throw new Error("error")
		},
		() => new BarError(),
	)
	expect(result.unwrapErr()).toBeInstanceOf(BarError)
})

test("tryPromise", async () => {
	const result = m.tryPromise(Promise.reject(new Error("error")))
	await expect(result.unwrapErr()).resolves.toBeInstanceOf(FooError)
})

test("tryPromiseWith", async () => {
	const result = m.tryPromiseWith(Promise.reject(new Error("error")), () => new BarError())
	await expect(result.unwrapErr()).resolves.toBeInstanceOf(BarError)
})

test("tryAsyncFn", async () => {
	const result = m.tryAsyncFn(async () => {
		throw new Error("error")
	})
	await expect(result.unwrapErr()).resolves.toBeInstanceOf(FooError)
})

test("tryAsyncFnWith", async () => {
	const result = m.tryAsyncFnWith(
		async () => {
			throw new Error("error")
		},
		() => new BarError(),
	)
	await expect(result.unwrapErr()).resolves.toBeInstanceOf(BarError)
})

test("guard", () => {
	const f = m.guard(() => {
		throw new Error("error")
	})
	expect(f().unwrapErr()).toBeInstanceOf(FooError)
})

test("guardWith", () => {
	const f = m.guardWith(
		() => {
			throw new Error("error")
		},
		() => new BarError(),
	)
	expect(f().unwrapErr()).toBeInstanceOf(BarError)
})

test("guardAsync", async () => {
	const f = m.guardAsync(async () => {
		throw new Error("error")
	})
	await expect(f().unwrapErr()).resolves.toBeInstanceOf(FooError)
})

test("guardAsyncWith", async () => {
	const f = m.guardAsyncWith(
		async () => {
			throw new Error("error")
		},
		() => new BarError(),
	)
	await expect(f().unwrapErr()).resolves.toBeInstanceOf(BarError)
})
