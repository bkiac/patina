import {test, expect, vi} from "vitest"
import {ErrorWithTag, ResultGroup} from "../src"

test("constructor", () => {
	const handleError = vi.fn()
	const result = ResultGroup.with(handleError)
	expect(result).toBeInstanceOf(ResultGroup)
	// @ts-expect-error
	expect(result.handleError).toBe(handleError)
})

class FooError extends ErrorWithTag {
	readonly tag = "foo"
}

class BarError extends ErrorWithTag {
	readonly tag = "bar"
}

const g = ResultGroup.with(() => new FooError())

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
