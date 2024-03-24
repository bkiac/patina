import {describe, expect, expectTypeOf, it, vi} from "vitest"
import {Panic, None, Some, Option} from "../src"

function TestSome<T>(value: T): Option<T> {
	return Some(value) as Option<T>
}

function TestNone<T>(): Option<T> {
	return None as Option<T>
}

describe.concurrent("basic", () => {
	it("returns a Some option", () => {
		const option = Some(42)

		expect(option.isSome).toEqual(true)
		expect(option.isNone).toEqual(false)
		expect(option.value).toEqual(42)

		expectTypeOf(option.isSome).toEqualTypeOf<true>()
		expectTypeOf(option.isNone).toEqualTypeOf<false>()
		expectTypeOf(option.value).toEqualTypeOf<number>()
		expectTypeOf(option.unwrap).toEqualTypeOf<() => number>()
	})

	it("returns a None option", () => {
		const option = None

		expect(option.isSome).toEqual(false)
		expect(option.isNone).toEqual(true)
		expect(option.value).toEqual(null)

		expectTypeOf(option.isSome).toEqualTypeOf<false>()
		expectTypeOf(option.isNone).toEqualTypeOf<true>()
		expectTypeOf(option.value).toEqualTypeOf<null>()

		expectTypeOf(option.unwrap).toEqualTypeOf<() => never>()
		expectTypeOf(option.expect).toEqualTypeOf<(msg: string) => never>()
	})

	it("works with discriminated union", () => {
		const option = TestSome(42)
		if (option.isSome) {
			expectTypeOf(option.isSome).toEqualTypeOf<true>()
			expectTypeOf(option.isNone).toEqualTypeOf<false>()
			expectTypeOf(option.value).toEqualTypeOf<number>()

			expectTypeOf(option.unwrap).toEqualTypeOf<() => number>()
			expectTypeOf(option.expect).toEqualTypeOf<(msg: string) => number>()
		} else {
			expectTypeOf(option.isSome).toEqualTypeOf<false>()
			expectTypeOf(option.isNone).toEqualTypeOf<true>()
			expectTypeOf(option.value).toEqualTypeOf<null>()

			expectTypeOf(option.unwrap).toEqualTypeOf<() => never>()
			expectTypeOf(option.expect).toEqualTypeOf<(msg: string) => never>()
		}
	})
})

describe.concurrent("and", () => {
	it("returns the other option when Some and None", () => {
		const a = TestSome(2)
		const b = TestNone<string>()
		expect(a.and(b)).toEqual(b)
	})

	it("returns the other option when Some and Some", () => {
		const a = TestSome(2)
		const b = TestSome("str")
		expect(a.and(b)).toEqual(b)
	})

	it("returns None when None and Some", () => {
		const a = TestNone<string>()
		const b = TestSome("foo")
		expect(a.and(b)).toEqual(a)
	})

	it("returns None when None and None", () => {
		const a = TestNone<string>()
		const b = TestNone<string>()
		expect(a.and(b)).toEqual(a)
	})
})

describe.concurrent("andThen", () => {
	it("returns the mapped value for a Some option", () => {
		const a = TestSome(0)
		expect(a.andThen((value) => TestSome(value + 1))).toEqual(Some(1))
	})

	it("returns None for a None option", () => {
		const a = TestNone<string>()
		expect(a.andThen((value) => Some(value + 1))).toEqual(a)
	})
})

describe.concurrent("expect", () => {
	it("returns the value when called on a Some option", () => {
		const option = TestSome(42)
		expect(option.expect("error")).toEqual(42)
	})

	it("throws when called on a None option", () => {
		const option = TestNone<string>()
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
		const option = TestSome(42)
		expect(option.filter((value) => value !== 42)).toEqual(None)
	})

	it("returns None when called on a None option", () => {
		const option = TestNone<string>()
		expect(option.filter((value) => value === "hello")).toEqual(option)
	})
})

describe.concurrent("flatten", () => {
	it("returns the inner option when called on a Some option", () => {
		const inner = TestSome(42)
		const option = TestSome(inner)
		expect(option.flatten()).toEqual(inner)
	})

	it("returns None when called on a None option", () => {
		const option = TestNone<Option<string>>()
		expect(option.flatten()).toEqual(option)
	})
})

describe.concurrent("examine", () => {
	it("calls the function with the value when called on a Some option", () => {
		const option = TestSome(42)
		const callback = vi.fn()
		expect(option.examine(callback)).toEqual(option)
		expect(callback).toHaveBeenCalledWith(42)
	})

	it("does not call the function when called on a None option", () => {
		const option = TestNone<string>()
		const callback = vi.fn()
		expect(option.examine(callback)).toEqual(option)
		expect(callback).not.toHaveBeenCalled()
	})
})

describe.concurrent("map", () => {
	it("returns the mapped value for a Some option", () => {
		const option = TestSome(42)
		expect(option.map((value) => value + 1)).toEqual(Some(43))
	})

	it("returns None for a None option", () => {
		const option = TestNone<string>()
		expect(option.map((value) => value + 1)).toEqual(option)
	})
})

describe.concurrent("mapOr", () => {
	it("returns the mapped value for a Some option", () => {
		const option = TestSome(42)
		expect(option.mapOr("default", (value) => value + 1)).toEqual(43)
	})

	it("returns the default value for a None option", () => {
		const option = TestNone<string>()
		expect(option.mapOr("default", (value) => value + 1)).toEqual("default")
	})
})

describe.concurrent("mapOrElse", () => {
	it("returns the mapped value for a Some option", () => {
		const option = TestSome(42)
		expect(
			option.mapOrElse(
				() => "default",
				(value) => value + 1,
			),
		).toEqual(43)
	})

	it("returns the default value for a None option", () => {
		const option = TestNone<string>()
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
		const a = TestSome(2)
		const b = TestNone<string>()
		expect(a.or(b)).toEqual(a)
	})

	it("returns the original option when Some and Some", () => {
		const a = TestSome(2)
		const b = TestSome("str")
		expect(a.or(b)).toEqual(a)
	})

	it("returns the other option when None and Some", () => {
		const a = TestNone<string>()
		const b = TestSome("foo")
		expect(a.or(b)).toEqual(b)
	})

	it("returns None when None and None", () => {
		const a = TestNone<string>()
		const b = TestNone<string>()
		expect(a.or(b)).toEqual(a)
	})
})

describe.concurrent("orElse", () => {
	it("returns the original option for a Some option", () => {
		const a = TestSome(0)
		expect(a.orElse(() => Some(1))).toEqual(a)
	})

	it("returns the result of the function for a None option", () => {
		const a = TestNone<string>()
		expect(a.orElse(() => Some(1))).toEqual(Some(1))
	})
})

describe.concurrent("unwrap", () => {
	it("returns the value when called on a Some option", () => {
		const option = TestSome(42)
		expect(option.unwrap()).toEqual(42)
	})

	it("throws when called on a None option", () => {
		const option = TestNone<string>()
		expect(() => option.unwrap()).toThrow(Panic)
	})
})

describe.concurrent("unwrapOr", () => {
	it("returns the value when called on a Some option", () => {
		const option = TestSome(42)
		expect(option.unwrapOr("default")).toEqual(42)
	})

	it("returns the default value when called on a None option", () => {
		const option = TestNone<string>()
		expect(option.unwrapOr("default")).toEqual("default")
	})
})

describe.concurrent("unwrapOrElse", () => {
	it("returns the value when called on a Some option", () => {
		const option = TestSome(42)
		expect(option.unwrapOrElse(() => "default")).toEqual(42)
	})

	it("returns the default value when called on a None option", () => {
		const option = TestNone<string>()
		expect(option.unwrapOrElse(() => "default")).toEqual("default")
	})
})

describe.concurrent("xor", () => {
	it("returns Some when Some and None", () => {
		const a = TestSome(2)
		const b = TestNone<string>()
		expect(a.xor(b)).toEqual(a)
	})

	it("returns Some when None and Some", () => {
		const a = TestNone<string>()
		const b = TestSome("foo")
		expect(a.xor(b)).toEqual(b)
	})

	it("returns None when None and None", () => {
		const a = TestNone<string>()
		const b = TestNone<string>()
		expect(a.xor(b)).toEqual(a)
	})

	it("returns None when Some and Some", () => {
		const a = TestSome(2)
		const b = TestSome("str")
		expect(a.xor(b)).toEqual(None)
	})
})

describe.concurrent("match", () => {
	it("returns the result of the some callback when called on a Some option", () => {
		const option = TestSome(42)
		expect(
			option.match({
				Some: (value) => value + 1,
				None: () => "default",
			}),
		).toEqual(43)
	})

	it("returns the result of the none callback when called on a None option", () => {
		const option = TestNone<string>()
		expect(
			option.match({
				Some: (value) => value + 1,
				None: () => "default",
			}),
		).toEqual("default")
	})
})

describe.concurrent("from", () => {
	it("returns Some when the value is not null or undefined", () => {
		expect(Option.from(42)).toEqual(Some(42))
	})

	it("returns Some when the value is falsy", () => {
		expect(Option.from(false)).toEqual(Some(false))
		expect(Option.from(0)).toEqual(Some(0))
		expect(Option.from("")).toEqual(Some(""))
	})

	it("returns None when the value is null or undefined", () => {
		expect(Option.from(null)).toEqual(None)
		expect(Option.from(undefined)).toEqual(None)
	})
})
