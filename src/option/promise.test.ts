import {describe, it, expect, vi} from "vitest"
import {Panic, UnwrapPanic, PromiseOption, Some, None} from "../internal"

function promiseSome<T>(value: T) {
	return new PromiseOption<T>(Promise.resolve(Some<T>(value)))
}

function promiseNone() {
	return new PromiseOption<any>(Promise.resolve(None))
}

describe.concurrent("and", () => {
	it("returns the other option when Some and None", async () => {
		const a = promiseSome(2)
		const b = promiseNone()
		expect(a.and(b)).toEqual(b)
	})

	it("returns the other option when Some and Some", async () => {
		const a = promiseSome(2)
		const b = promiseSome("str")
		expect(a.and(b)).toEqual(b)
	})

	it("returns None when None and Some", async () => {
		const a = promiseNone()
		const b = promiseSome("foo")
		expect(a.and(b)).toEqual(a)
	})

	it("returns None when None and None", async () => {
		const a = promiseNone()
		const b = promiseNone()
		expect(a.and(b)).toEqual(a)
	})
})

describe.concurrent("andThen", () => {
	it("returns the mapped value for a Some option", async () => {
		const a = promiseSome(0)
		await expect(a.andThen((value) => Some(value + 1))).resolves.toEqual(Some(1))
	})

	it("returns None for a None option", async () => {
		const a = promiseNone()
		expect(a.andThen((value) => Some(value + 1))).toEqual(a)
	})
})

describe.concurrent("expect", () => {
	it("returns the value when called on a Some option", async () => {
		const option = promiseSome(42)
		await expect(option.expect("error")).resolves.toEqual(42)
	})

	it("throws Panic when called on a None option", async () => {
		const option = promiseNone()
		await expect(option.expect("msg")).rejects.toEqual(new Panic("msg"))
	})
})

describe.concurrent("filter", () => {
	it("returns the option when the predicate returns true", async () => {
		const option = promiseSome(42)
		await expect(option.filter((value) => value === 42)).resolves.toEqual(Some(42))
	})

	it("returns None when the predicate returns false", async () => {
		const option = promiseSome(42)
		await expect(option.filter((value) => value !== 42)).resolves.toEqual(None)
	})
})

describe.concurrent("inspect", () => {
	it("calls the function when called on a Some option", async () => {
		const option = promiseSome(42)
		const fn = vi.fn()
		await option.inspect(fn)
		expect(fn).toHaveBeenCalledWith(42)
	})

	it("does not call the function when called on a None option", async () => {
		const option = promiseNone()
		const fn = vi.fn()
		await option.inspect(fn)
		expect(fn).not.toHaveBeenCalled()
	})
})

describe.concurrent("map", () => {
	it("returns the mapped value for a Some option", async () => {
		const option = promiseSome(42)
		await expect(option.map((value) => value + 1)).resolves.toEqual(Some(43))
	})

	it("returns None for a None option", async () => {
		const option = promiseNone()
		await expect(option.map((value) => value + 1)).resolves.toEqual(None)
	})
})

describe.concurrent("mapOr", () => {
	it("returns the mapped value for a Some option", async () => {
		const option = promiseSome(42)
		await expect(option.mapOr("default", (value) => value + 1)).resolves.toEqual(43)
	})

	it("returns the default value for a None option", async () => {
		const option = promiseNone()
		await expect(option.mapOr("default", (value) => value + 1)).resolves.toEqual("default")
	})
})

describe.concurrent("mapOrElse", () => {
	it("returns the mapped value for a Some option", async () => {
		const option = promiseSome(42)
		await expect(
			option.mapOrElse(
				() => "default",
				(value) => value + 1,
			),
		).resolves.toEqual(43)
	})

	it("returns the default value for a None option", async () => {
		const option = promiseNone()
		await expect(
			option.mapOrElse(
				() => "default",
				(value) => value + 1,
			),
		).resolves.toEqual("default")
	})
})

describe.concurrent("or", () => {
	it("returns the option when Some and None", () => {
		const a = promiseSome(2)
		const b = promiseNone()
		expect(a.or(b)).toEqual(a)
	})

	it("returns the option when Some and Some", () => {
		const a = promiseSome(2)
		const b = promiseSome("str")
		expect(a.or(b)).toEqual(a)
	})

	it("returns None when None and Some", () => {
		const a = promiseNone()
		const b = promiseSome("foo")
		expect(a.or(b)).toEqual(b)
	})

	it("returns None when None and None", () => {
		const a = promiseNone()
		const b = promiseNone()
		expect(a.or(b)).toEqual(a)
	})
})

describe.concurrent("orElse", () => {
	it("returns the result for a Some option", () => {
		const a = promiseSome(1)
		expect(a.orElse(() => Some(1))).toEqual(a)
	})

	it("returns the mapped value for a None option", () => {
		const a = promiseNone()
		expect(a.orElse(() => Some(1))).toEqual(promiseNone())
	})
})

describe.concurrent("unwrap", () => {
	it("returns the value when called on a Some option", async () => {
		const option = promiseSome(42)
		await expect(option.unwrap()).resolves.toEqual(42)
	})

	it("throws Panic when called on a None option", async () => {
		const option = promiseNone()
		await expect(() => option.unwrap()).rejects.toThrow(UnwrapPanic)
	})
})

describe.concurrent("unwrapOr", () => {
	it("returns the value when called on a Some option", async () => {
		const option = promiseSome(42)
		await expect(option.unwrapOr("default")).resolves.toEqual(42)
	})

	it("returns the default value when called on a None option", async () => {
		const option = promiseNone()
		await expect(option.unwrapOr("default")).resolves.toEqual("default")
	})
})

describe.concurrent("unwrapOrElse", () => {
	it("returns the value when called on a Some option", async () => {
		const option = promiseSome(42)
		await expect(option.unwrapOrElse(() => "default")).resolves.toEqual(42)
	})

	it("returns the default value when called on a None option", async () => {
		const option = promiseNone()
		await expect(option.unwrapOrElse(() => "default")).resolves.toEqual("default")
	})
})

describe.concurrent("xor", () => {
	it("returns Some when Some and None", async () => {
		const a = promiseSome(2)
		const b = promiseNone()
		expect(a.xor(b)).toEqual(a)
	})

	it("returns Some when None and Some", async () => {
		const a = promiseNone()
		const b = promiseSome("foo")
		expect(a.xor(b)).toEqual(b)
	})

	it("returns None when None and None", async () => {
		const a = promiseNone()
		const b = promiseNone()
		expect(a.xor(b)).toEqual(a)
	})

	it("returns None when Some and Some", async () => {
		const a = promiseSome(2)
		const b = promiseSome("str")
		expect(a.xor(b)).toEqual(a)
	})
})

describe.concurrent("match", () => {
	it("returns the mapped value for a Some option", async () => {
		const option = promiseSome(42)
		await expect(
			option.match(
				(value) => value + 1,
				() => "none",
			),
		).resolves.toEqual(43)
	})

	it("returns the mapped value for a None option", async () => {
		const option = promiseNone()
		await expect(
			option.match(
				(value) => value + 1,
				() => "none",
			),
		).resolves.toEqual("none")
	})
})
