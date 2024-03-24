import {describe, it, expect, expectTypeOf, vi} from "vitest"
import {Panic, Ok, Err, type Result, ResultError, Some, None} from "../src"

export function TestOk<T, E>(value: T): Result<T, E> {
	return Ok(value)
}

export function TestErr<T, E>(value: E): Result<T, E> {
	return Err(value)
}

describe.concurrent("basic", () => {
	it("returns an Ok result", () => {
		const r = Ok(42)

		expect(r.isOk).toEqual(true)
		expect(r.isErr).toEqual(false)
		expect(r.value).toEqual(42)

		expectTypeOf(r.isOk).toEqualTypeOf<true>()
		expectTypeOf(r.isErr).toEqualTypeOf<false>()
		expectTypeOf(r.value).toEqualTypeOf<number>()
		expectTypeOf(() => r.unwrap()).toEqualTypeOf<() => number>()
		expectTypeOf(() => r.unwrapErr()).toEqualTypeOf<() => never>()
	})

	it("returns an Err result", () => {
		const r = Err("error")

		expect(r.isOk).toEqual(false)
		expect(r.isErr).toEqual(true)
		expect(r.value).toEqual("error")

		expectTypeOf(r.isOk).toEqualTypeOf<false>()
		expectTypeOf(r.isErr).toEqualTypeOf<true>()
		expectTypeOf(r.value).toEqualTypeOf<string>()
		expectTypeOf(() => r.unwrap()).toEqualTypeOf<() => never>()
		expectTypeOf(() => r.unwrapErr()).toEqualTypeOf<() => string>()
	})

	it("works as discriminated union", () => {
		const r = TestOk<number, string>(42)
		expectTypeOf(r.value).toEqualTypeOf<number | string>()
		if (r.isOk) {
			expectTypeOf(r.isOk).toEqualTypeOf<true>()
			expectTypeOf(r.isErr).toEqualTypeOf<false>()
			expectTypeOf(r.value).toEqualTypeOf<number>()
			expectTypeOf(() => r.unwrap()).toEqualTypeOf<() => number>()
			expectTypeOf(() => r.unwrapErr()).toEqualTypeOf<() => never>()
		} else {
			expectTypeOf(r.isOk).toEqualTypeOf<false>()
			expectTypeOf(r.isErr).toEqualTypeOf<true>()
			expectTypeOf(r.value).toEqualTypeOf<string>()
			expectTypeOf(() => r.unwrap()).toEqualTypeOf<() => never>()
			expectTypeOf(() => r.unwrapErr()).toEqualTypeOf<() => string>()
		}
	})
})

describe.concurrent("ok", () => {
	it("returns the value when Ok", () => {
		const result = TestOk<number, string>(42)
		expect(result.ok()).toEqual(Some(42))
	})

	it("returns None when Err", () => {
		const result = TestErr<number, string>("error")
		expect(result.ok()).toEqual(None)
	})
})

describe.concurrent("err", () => {
	it("returns None when Ok", () => {
		const result = TestOk<number, string>(42)
		expect(result.err()).toEqual(None)
	})

	it("returns the error when Err", () => {
		const result = TestErr<number, string>("error")
		expect(result.err()).toEqual(Some("error"))
	})
})

describe.concurrent("and", () => {
	it("returns the error when Ok and Err", () => {
		const a = TestOk<number, string>(2)
		const b = TestErr<number, string>("late error")
		expect(a.and(b)).toEqual(b)
	})

	it("returns the late value when Ok and Ok", () => {
		const a = TestOk<number, string>(0)
		const b = TestOk<number, string>(1)
		expect(a.and(b)).toEqual(b)
	})

	it("returns the error when Err and Ok", () => {
		const a = TestErr<number, string>("early error")
		const b = TestOk<number, string>(0)
		expect(a.and(b)).toEqual(a)
	})

	it("returns the early error when Err and Err", () => {
		const a = TestErr<number, string>("early error")
		const b = TestErr<number, string>("late error")
		expect(a.and(b)).toEqual(a)
	})
})

describe.concurrent("andThen", () => {
	it("returns the mapped value for an Ok result", () => {
		const a = TestOk<number, string>(0)
		expect(a.andThen((value) => Ok(value + 1))).toEqual(Ok(1))
	})

	it("returns the result for an Err result", () => {
		const a = TestErr<number, string>("early error")
		expect(a.andThen((value) => Ok(value + 1))).toEqual(a)
	})
})

describe.concurrent("expect", () => {
	it("returns the value when called on an Ok result", () => {
		const result = TestOk<number, string>(42)
		const value = result.expect("Panic message")
		expect(value).toEqual(42)
	})

	it("throws a Panic with the provided message when called on an Err result", () => {
		const result = TestErr<number, string>("error")
		const panicMsg = "Panic message"
		expect(() => result.expect(panicMsg)).toThrow(Panic)
		expect(() => result.expect(panicMsg)).toThrow(panicMsg)
	})
})

describe.concurrent("expectErr", () => {
	it("returns the value when called on an Err result", () => {
		const err = TestErr<number, string>("error")
		expect(err.expectErr("panic message")).toEqual("error")
	})

	it("throws a Panic with the provided message when called on an Ok result", () => {
		const ok = TestOk<number, string>(0)
		const panicMsg = "Panic message"
		expect(() => ok.expectErr(panicMsg)).toThrow(Panic)
		expect(() => ok.expectErr(panicMsg)).toThrow(panicMsg)
	})
})

describe.concurrent("flatten", () => {
	it("works with an Ok<Ok> result", () => {
		const inner = TestOk<number, string>(42)
		const result = TestOk<Result<number, string>, boolean>(inner)
		const result2 = result.flatten()
		expectTypeOf(result2).toEqualTypeOf<Result<number, string | boolean>>()
		expect(result2).toEqual(inner)
	})

	it("works with an Ok<Err> result", () => {
		const inner = TestErr<number, string>("error")
		const result = TestOk<Result<number, string>, boolean>(inner)
		const result2 = result.flatten()
		expectTypeOf(result2).toEqualTypeOf<Result<number, string | boolean>>()
		expect(result2).toEqual(inner)
	})

	it("works with an Err result", () => {
		const result = TestErr<Result<number, string>, boolean>(true)
		const result2 = result.flatten()
		expectTypeOf(result2).toEqualTypeOf<Result<number, string | boolean>>()
		expect(result2).toEqual(result)
	})

	it("works with non-primitive value or error", () => {
		class Foo extends ResultError {
			readonly tag = "foo"
		}

		class Bar extends ResultError {
			readonly tag = "bar"
		}

		const foo = TestOk<
			| {
					id: string
			  }
			| undefined,
			Foo
		>({
			id: "1",
		})
		const bar = foo.map((value) => (value === undefined ? Err(new Bar()) : Ok(value))).flatten()
		expectTypeOf(bar).toEqualTypeOf<Result<{id: string}, Foo | Bar>>()
	})
})

describe.concurrent("examine", () => {
	it("returns this and calls closure on Ok result", () => {
		const f = vi.fn()
		const result = TestOk<number, string>(42)
		const result2 = result.examine(f)
		expect(f).toHaveBeenCalled()
		expect(result2).toEqual(result)
	})

	it("returns this and does not call closure on Err result", () => {
		const f = vi.fn()
		const result = TestErr<number, string>("")
		const result2 = result.examine(f)
		expect(f).not.toHaveBeenCalled()
		expect(result2).toEqual(result)
	})
})

describe.concurrent("examineErr", () => {
	it("returns this and does not call closure on Ok result", () => {
		const f = vi.fn()
		const result = TestOk<number, string>(42)
		const result2 = result.examineErr(f)
		expect(f).not.toHaveBeenCalled()
		expect(result2).toEqual(result)
	})

	it("returns this and calls closure on Err result", () => {
		const f = vi.fn()
		const result = TestErr<number, string>("")
		const result2 = result.examineErr(f)
		expect(f).toHaveBeenCalled()
		expect(result2).toEqual(result)
	})
})

describe.concurrent("map", () => {
	it("returns the mapped value for an Ok result", () => {
		const result = TestOk<number, string>(42)
		const result2 = result.map((value) => value * 2)
		expect(result2).toEqual(Ok(84))
	})

	it("returns the original Err for an Err result", () => {
		const result = TestErr<number, string>("error")
		const result2 = result.map((value) => value * 2)
		expect(result2).toEqual(result)
	})
})

describe.concurrent("mapErr", () => {
	it("returns the mapped error for an Err result", () => {
		const result = TestErr<number, string>("error")
		const result2 = result.mapErr(() => "new error")
		expect(result2.unwrapErr()).toEqual("new error")
	})

	it("returns the original Ok for an Err result", () => {
		const result = TestOk<number, string>(0)
		const result2 = result.mapErr(() => "new error")
		expect(result2).toEqual(result)
	})
})

describe.concurrent("mapOr", () => {
	it("returns the mapped value for an Ok result", () => {
		const result = TestOk<number, string>(42)
		const value = result.mapOr(0, (value) => value * 2)
		expect(value).toEqual(84)
	})

	it("returns the default value for an Err result", () => {
		const result = TestErr<number, string>("error")
		const value = result.mapOr(0, (value) => value * 2)
		expect(value).toEqual(0)
	})
})

describe.concurrent("mapOrElse", () => {
	it("returns the mapped value for an Ok result", () => {
		const result = TestOk<number, string>(42)
		const value = result.mapOrElse(
			() => 0,
			(value) => value * 2,
		)
		expect(value).toEqual(84)
	})

	it("returns the default value from a function for an Err result", () => {
		const result = TestErr<number, string>("error")
		const value = result.mapOrElse(
			() => 0,
			(value) => value * 2,
		)
		expect(value).toEqual(0)
	})
})

describe.concurrent("or", () => {
	it("returns the value when Ok or Err", () => {
		const a = TestOk<number, string>(2)
		const b = TestErr<number, string>("late error")
		expect(a.or(b)).toEqual(a)
	})

	it("returns the early value when Ok or Ok", () => {
		const a = TestOk<number, string>(0)
		const b = TestOk<number, string>(1)
		expect(a.or(b)).toEqual(a)
	})

	it("returns the late value when Err or Ok", () => {
		const a = TestErr<number, string>("early error")
		const b = TestOk<number, string>(0)
		expect(a.or(b)).toEqual(b)
	})

	it("returns the late error when Err and Err", () => {
		const a = TestErr<number, string>("early error")
		const b = TestErr<number, string>("late error")
		expect(a.or(b)).toEqual(b)
	})
})

describe.concurrent("orElse", () => {
	it("returns the result for an Ok result", () => {
		const a = TestOk<number, string>(0)
		expect(a.orElse(() => Ok(1))).toEqual(a)
	})

	it("returns the mapped value for an Err result", () => {
		const a = TestErr<number, string>("early error")
		expect(a.orElse(() => Ok(1))).toEqual(Ok(1))
	})
})

describe.concurrent("unwrap", () => {
	it("returns the value for an Ok result", () => {
		const result = TestOk<number, string>(42)
		expect(result.unwrap()).toEqual(42)
	})

	it("throws a Panic for an Err result", () => {
		const result = TestErr<number, string>("error")
		expect(() => result.unwrap()).toThrow(Panic)
	})
})

describe.concurrent("unwrapErr", () => {
	it("returns the error for an Err result", () => {
		const result = TestErr<number, string>("error")
		expect(result.unwrapErr()).toEqual("error")
	})

	it("throws for an Ok result", () => {
		const result = TestOk<number, string>(42)
		expect(() => result.unwrapErr()).toThrow(Panic)
	})
})

describe.concurrent("unwrapOr", () => {
	it("returns the value for an Ok result", () => {
		const result = TestOk<number, string>(42)
		expect(result.unwrapOr(0)).toEqual(42)
	})

	it("returns the default value for an Err result", () => {
		const result = TestErr<number, string>("error")
		expect(result.unwrapOr(42)).toEqual(42)
	})
})

describe.concurrent("unwrapOrElse", () => {
	it("returns the value for an Ok result", () => {
		const result = TestOk<number, string>(42)
		expect(result.unwrapOrElse(() => 0)).toEqual(42)
	})

	it("returns the default value from a function for an Err result", () => {
		const result = TestErr<number, string>("error")
		const unwrapped = result.unwrapOrElse(() => 42)
		expect(unwrapped).toEqual(42)
	})
})

describe.concurrent("match", () => {
	it("calls the ok function for an Ok result", () => {
		const result = TestOk<number, string>(42)
		const output = result.match({
			Ok: (value) => value * 2,
			Err: () => 0,
		})
		expect(output).toEqual(84)
	})

	it("calls the err function for an Err result", () => {
		const result = TestErr<number, string>("error")
		const output = result.match({
			Ok: (value) => value * 2,
			Err: () => 0,
		})
		expect(output).toEqual(0)
	})
})
