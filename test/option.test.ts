import {describe, expect, it, vi} from "vitest"
import {Panic, UnwrapPanic, None, Some} from "../src/internal"

it("returns a Some option", () => {
	const option = Some(42)
	expect(option.some).toEqual(true)
	expect(option.none).toEqual(false)
	expect(option.value).toEqual(42)
})

it("returns a None option", () => {
	const option = None
	expect(option.some).toEqual(false)
	expect(option.none).toEqual(true)
})

describe.concurrent("and", () => {
	it("returns the other option when Some and None", () => {
		const a = Some(2)
		const b = None
		expect(a.and(b)).toEqual(b)
	})

	it("returns the other option when Some and Some", () => {
		const a = Some(2)
		const b = Some("str")
		expect(a.and(b)).toEqual(b)
	})

	it("returns None when None and Some", () => {
		const a = None
		const b = Some("foo")
		expect(a.and(b)).toEqual(a)
	})

	it("returns None when None and None", () => {
		const a = None
		const b = None
		expect(a.and(b)).toEqual(a)
	})
})

describe.concurrent("andThen", () => {
	it("returns the mapped value for a Some option", () => {
		const a = Some(0)
		expect(a.andThen((value) => Some(value + 1))).toEqual(Some(1))
	})

	it("returns None for a None option", () => {
		const a = None
		expect(a.andThen((value) => Some(value + 1))).toEqual(a)
	})
})

describe.concurrent("expect", () => {
	it("returns the value when called on a Some option", () => {
		const option = Some(42)
		expect(option.expect("error")).toEqual(42)
	})

	it("throws when called on a None option", () => {
		const option = None
		expect(() => option.expect("error")).toThrow(Panic)
		expect(() => option.expect("error")).toThrow("error")
	})
})

describe.concurrent("filter", () => {
	it("returns the option when the predicate returns true", () => {
		const option = Some(42)
		expect(option.filter((value) => value === 42)).toEqual(option)
	})

	it("returns None when the predicate returns false", () => {
		const option = Some(42)
		expect(option.filter((value) => value !== 42)).toEqual(None)
	})

	it("returns None when called on a None option", () => {
		const option = None
		expect(option.filter((value) => value === 42)).toEqual(option)
	})
})

describe.concurrent("inspect", () => {
	it("calls the function with the value when called on a Some option", () => {
		const option = Some(42)
		const callback = vi.fn()
		expect(option.inspect(callback)).toEqual(option)
		expect(callback).toHaveBeenCalledWith(42)
	})

	it("does not call the function when called on a None option", () => {
		const option = None
		const callback = vi.fn()
		expect(option.inspect(callback)).toEqual(option)
		expect(callback).not.toHaveBeenCalled()
	})
})

describe.concurrent("map", () => {
	it("returns the mapped value for a Some option", () => {
		const option = Some(42)
		expect(option.map((value) => value + 1)).toEqual(Some(43))
	})

	it("returns None for a None option", () => {
		const option = None
		expect(option.map((value) => value + 1)).toEqual(option)
	})
})

describe.concurrent("mapOr", () => {
	it("returns the mapped value for a Some option", () => {
		const option = Some(42)
		expect(option.mapOr("default", (value) => value + 1)).toEqual(43)
	})

	it("returns the default value for a None option", () => {
		const option = None
		expect(option.mapOr("default", (value) => value + 1)).toEqual("default")
	})
})

describe.concurrent("mapOrElse", () => {
	it("returns the mapped value for a Some option", () => {
		const option = Some(42)
		expect(
			option.mapOrElse(
				() => "default",
				(value) => value + 1,
			),
		).toEqual(43)
	})

	it("returns the default value for a None option", () => {
		const option = None
		expect(
			option.mapOrElse(
				() => "default",
				(value) => value + 1,
			),
		).toEqual("default")
	})
})

describe.concurrent("or", () => {
	it("returns the original option when Some and None", () => {
		const a = Some(2)
		const b = None
		expect(a.or(b)).toEqual(a)
	})

	it("returns the original option when Some and Some", () => {
		const a = Some(2)
		const b = Some("str")
		expect(a.or(b)).toEqual(a)
	})

	it("returns the other option when None and Some", () => {
		const a = None
		const b = Some("foo")
		expect(a.or(b)).toEqual(b)
	})

	it("returns None when None and None", () => {
		const a = None
		const b = None
		expect(a.or(b)).toEqual(a)
	})
})

describe.concurrent("orElse", () => {
	it("returns the original option for a Some option", () => {
		const a = Some(0)
		expect(a.orElse(() => Some(1))).toEqual(a)
	})

	it("returns the result of the function for a None option", () => {
		const a = None
		expect(a.orElse(() => Some(1))).toEqual(Some(1))
	})
})

describe.concurrent("unwrap", () => {
	it("returns the value when called on a Some option", () => {
		const option = Some(42)
		expect(option.unwrap()).toEqual(42)
	})

	it("throws when called on a None option", () => {
		const option = None
		expect(() => option.unwrap()).toThrow(UnwrapPanic)
	})
})

describe.concurrent("unwrapOr", () => {
	it("returns the value when called on a Some option", () => {
		const option = Some(42)
		expect(option.unwrapOr("default")).toEqual(42)
	})

	it("returns the default value when called on a None option", () => {
		const option = None
		expect(option.unwrapOr("default")).toEqual("default")
	})
})

describe.concurrent("unwrapOrElse", () => {
	it("returns the value when called on a Some option", () => {
		const option = Some(42)
		expect(option.unwrapOrElse(() => "default")).toEqual(42)
	})

	it("returns the default value when called on a None option", () => {
		const option = None
		expect(option.unwrapOrElse(() => "default")).toEqual("default")
	})
})

describe.concurrent("xor", () => {
	it("returns Some when Some and None", () => {
		const a = Some(2)
		const b = None
		expect(a.xor(b)).toEqual(a)
	})

	it("returns Some when None and Some", () => {
		const a = None
		const b = Some("foo")
		expect(a.xor(b)).toEqual(b)
	})

	it("returns None when None and None", () => {
		const a = None
		const b = None
		expect(a.xor(b)).toEqual(a)
	})

	it("returns None when Some and Some", () => {
		const a = Some(2)
		const b = Some("str")
		expect(a.xor(b)).toEqual(None)
	})
})

describe.concurrent("match", () => {
	it("returns the result of the some callback when called on a Some option", () => {
		const option = Some(42)
		expect(
			option.match(
				(value) => value + 1,
				() => "default",
			),
		).toEqual(43)
	})

	it("returns the result of the none callback when called on a None option", () => {
		const option = None
		expect(
			option.match(
				(value) => value + 1,
				() => "default",
			),
		).toEqual("default")
	})
})
