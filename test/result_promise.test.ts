import {describe, it, expect, expectTypeOf} from "vitest"
import {Err, Panic, ResultPromise, Ok, Result, ErrorWithTag, Some, None} from "../src"
import {TestErr, TestOk} from "./result.test"
import {vi} from "vitest"

function TestOkPromise<T, E = any>(value: T) {
	return new ResultPromise<T, E>(Promise.resolve(Ok<T>(value)))
}

function TestErrPromise<E, T = any>(error: E) {
	return new ResultPromise<T, E>(Promise.resolve(Err<E>(error)))
}

describe.concurrent("ok", () => {
	it("returns the value when called on an Ok result", async () => {
		const result = TestOkPromise(42)
		const option = result.ok()
		await expect(option).resolves.toEqual(Some(42))
	})

	it("returns None when called on an Err result", async () => {
		const result = TestErrPromise("error")
		const option = result.ok()
		await expect(option).resolves.toEqual(None)
	})
})

describe.concurrent("and", () => {
	it("returns the error when Ok and Err", async () => {
		const a = TestOkPromise(1)
		const b = TestErrPromise("late error")
		expect(a.and(b)).toEqual(b)
	})

	it("returns the late value when Ok and Ok", async () => {
		const a = TestOkPromise(1)
		const b = TestOkPromise(2)
		expect(a.and(b)).toEqual(b)
	})

	it("returns the error when Err and Ok", async () => {
		const a = TestErrPromise("early error")
		const b = TestOkPromise(1)
		expect(a.and(b)).toEqual(a)
	})

	it("returns the early error when Err and Err", () => {
		const a = TestErrPromise("early error")
		const b = TestErrPromise("late error")
		expect(a.and(b)).toEqual(a)
	})
})

describe.concurrent("andThen", () => {
	it("returns the mapped value for an Ok result", async () => {
		const a = TestOkPromise(0)
		await expect(a.andThen((value) => Ok(value + 1))).resolves.toEqual(Ok(1))
	})

	it("returns the result for an Err result", () => {
		const a = TestErrPromise("error")
		expect(a.andThen((value) => Ok(value + 1))).toEqual(a)
	})
})

describe.concurrent("andThenAsync", () => {
	it("returns the mapped value for an Ok result", async () => {
		const a = TestOkPromise<number, string>(0)
		await expect(a.andThenAsync(async (value) => Ok(value + 1))).resolves.toEqual(Ok(1))
	})

	it("returns the result for an Err result", async () => {
		const a = TestErrPromise<number, string>(0)
		await expect(a.andThenAsync(async (value) => Ok(value + 1))).resolves.toEqual(Err(0))
	})
})

describe.concurrent("expect", () => {
	it("returns the value when called on an Ok result", async () => {
		const result = new ResultPromise(Promise.resolve(Ok(42)))
		const value = await result.expect("")
		expect(value).to.equal(42)
	})

	it("throws a Panic with the provided message when called on an Err result", async () => {
		const error = new Error("Original error")
		const result = new ResultPromise(Promise.resolve(Err(error)))
		await expect(result.expect("Panic message")).rejects.toThrow(Panic)
	})
})

describe.concurrent("expectErr", () => {
	it("returns the error when called on an Err result", async () => {
		const result = new ResultPromise(Promise.resolve(Err(new Error("Test error"))))
		const error = await result.expectErr("")
		expect(error).toEqual(new Error("Test error"))
	})

	it("throws a Panic with the provided message when called on an Ok result", async () => {
		const result = new ResultPromise(Promise.resolve(Ok()))
		await expect(result.expectErr("Panic message")).rejects.toThrow(Panic)
	})
})

describe.concurrent("flatten", () => {
	it("works with an Ok<Ok> result", () => {
		const inner = TestOk<number, string>(42)
		const result = TestOkPromise<Result<number, string>, boolean>(inner)
		const result2 = result.flatten()
		expectTypeOf(result2).toEqualTypeOf<ResultPromise<number, string | boolean>>()
		expect(result2).resolves.toEqual(inner)
	})

	it("works with an Ok<Err> result", () => {
		const inner = TestErr<number, string>("error")
		const result = TestOkPromise<Result<number, string>, boolean>(inner)
		const result2 = result.flatten()
		expectTypeOf(result2).toEqualTypeOf<ResultPromise<number, string | boolean>>()
		expect(result2).resolves.toEqual(inner)
	})

	it("works with an Err result", () => {
		const result = TestErrPromise<boolean, Result<number, string>>(true)
		const result2 = result.flatten()
		expectTypeOf(result2).toEqualTypeOf<ResultPromise<number, string | boolean>>()
		expect(result2).resolves.toEqual(Err(true))
	})

	it("works with non-primitive value or error", () => {
		class Foo extends ErrorWithTag {
			readonly tag = "foo"
		}

		class Bar extends ErrorWithTag {
			readonly tag = "bar"
		}

		const foo = TestOkPromise<
			| {
					id: string
			  }
			| undefined,
			Foo
		>({
			id: "1",
		})
		const bar = foo.map((value) => (value === undefined ? Err(new Bar()) : Ok(value))).flatten()
		expectTypeOf(bar).toEqualTypeOf<ResultPromise<{id: string}, Foo | Bar>>()
	})
})

describe.concurrent("inspect", async () => {
	it("returns result and calls closure on Ok result", async () => {
		let counter = 0
		const result = new ResultPromise(Promise.resolve(Ok(42)))
		const result2 = result.inspect((value) => {
			counter += value
		})
		const awaitedResult = await result
		await expect(result2).resolves.toEqual(awaitedResult)
		expect(counter).toEqual(42)
	})

	it("returns result and does not call closure on Err result", async () => {
		let counter = 0
		const result = new ResultPromise(Promise.resolve(Err()))
		const result2 = result.inspect(() => {
			counter += 1
		})
		const awaitedResult = await result
		await expect(result2).resolves.toEqual(awaitedResult)
		expect(counter).toEqual(0)
	})
})

describe.concurrent("inspectAsync", () => {
	it("calls closure on Ok result", async () => {
		const f = vi.fn().mockResolvedValue("mocked value")
		await TestOkPromise(42).inspectAsync(f)
		expect(f).toHaveBeenCalled()
	})

	it("does not call closure on Err result", async () => {
		const f = vi.fn().mockResolvedValue("mocked value")
		await TestErrPromise<number, string>(0).inspectAsync(f)
		expect(f).not.toHaveBeenCalled()
	})
})

describe.concurrent("inspectErr", async () => {
	it("returns result and does not call closure on Ok result", async () => {
		let counter = 0
		const result = new ResultPromise(Promise.resolve(Ok()))
		const result2 = result.inspectErr((error) => {
			counter += 1
			expect(error).toEqual(undefined)
		})
		const awaitedResult = await result
		await expect(result2).resolves.toEqual(awaitedResult)
		expect(counter).toEqual(0)
	})

	it("returns result and calls closure on Err result", async () => {
		let counter = 0
		const result = new ResultPromise(Promise.resolve(Err("foo")))
		const result2 = result.inspectErr((error) => {
			counter += 1
			expect(error).toEqual("foo")
		})
		const awaitedResult = await result
		await expect(result2).resolves.toEqual(awaitedResult)
		expect(counter).toEqual(1)
	})
})

describe.concurrent("inspectErrAsync", () => {
	it("does not call closure on Ok result", async () => {
		const f = vi.fn().mockResolvedValue("mocked value")
		await TestOkPromise<number, string>(0).inspectErrAsync(f)
		expect(f).not.toHaveBeenCalled()
	})

	it("calls closure on Ok result", async () => {
		const f = vi.fn().mockResolvedValue("mocked value")
		await TestErrPromise(42).inspectErrAsync(f)
		expect(f).toHaveBeenCalled()
	})
})

describe.concurrent("map", () => {
	it("returns the mapped value for an Ok result", async () => {
		const result = new ResultPromise(Promise.resolve(Ok(42)))
		const result2 = result.map((value) => value * 2)
		await expect(result2).resolves.toEqual(Ok(84))
	})

	it("returns the original Err for an Err result", async () => {
		const error = new Error("Test error")
		const result = new ResultPromise<number, Error>(Promise.resolve(Err(error)))
		const result2 = result.map((value) => value * 2)
		const awaitedResult = await result
		await expect(result2).resolves.toEqual(awaitedResult)
	})
})

describe.concurrent("mapAsync", () => {
	it("returns the mapped value for an Ok result", async () => {
		const a = new ResultPromise(Promise.resolve(Ok(42)))
		const b = a.mapAsync(async (value) => value * 2)
		await expect(b).resolves.toEqual(Ok(84))
	})

	it("returns the original Err for an Err result", async () => {
		const a = new ResultPromise<number, string>(Promise.resolve(Err("error")))
		const b = a.map((value) => value * 2)
		const awaitedResult = await a
		await expect(b).resolves.toEqual(awaitedResult)
	})
})

describe.concurrent("mapErr", () => {
	it("returns the mapped error for an Err result", async () => {
		const error = new Error("Test error")
		const result = new ResultPromise(Promise.resolve(Err(error)))
		const result2 = result.mapErr(() => new Error("Error"))
		await expect(result2).resolves.toEqual(Err(new Error("Error")))
	})

	it("returns the original Ok for an Err result", async () => {
		const result = new ResultPromise(Promise.resolve(Ok()))
		const result2 = result.mapErr(() => new Error("Error"))
		await expect(result2).resolves.toEqual(Ok())
	})
})

describe.concurrent("mapErr", () => {
	it("returns the mapped error for an Err result", async () => {
		const a = new ResultPromise(Promise.resolve(Err("string")))
		const b = a.mapErrAsync(async () => "error")
		await expect(b).resolves.toEqual(Err("error"))
	})

	it("returns the original Ok for an Err result", async () => {
		const a = new ResultPromise(Promise.resolve(Ok()))
		const b = a.mapErrAsync(async () => new Error("Error"))
		await expect(b).resolves.toEqual(Ok())
	})
})

describe.concurrent("mapOr", () => {
	it("returns the mapped value for an Ok result", async () => {
		const result = new ResultPromise(Promise.resolve(Ok(42)))
		const value = await result.mapOr(0, (value) => value * 2)
		expect(value).toEqual(84)
	})

	it("returns the default value for an Err result", async () => {
		const error = new Error("Test error")
		const result = new ResultPromise<number, Error>(Promise.resolve(Err(error)))
		const value = await result.mapOr(0, (value) => value * 2)
		expect(value).toEqual(0)
	})
})

describe.concurrent("mapOrElse", () => {
	it("returns the mapped value for an Ok result", async () => {
		const result = new ResultPromise(Promise.resolve(Ok(42)))
		const value = await result.mapOrElse(
			() => 0,
			(value) => value * 2,
		)
		expect(value).toEqual(84)
	})

	it("returns the default value from a function for an Err result", async () => {
		const result = new ResultPromise<number, Error>(
			Promise.resolve(Err(new Error("Test error"))),
		)
		const value = await result.mapOrElse(
			() => 0,
			(value) => value * 2,
		)
		expect(value).toEqual(0)
	})
})

describe.concurrent("or", () => {
	it("returns the value when Ok or Err", () => {
		const a = TestOkPromise(1)
		const b = TestErrPromise("late error")
		expect(a.or(b)).toEqual(a)
	})

	it("returns the early value when Ok or Ok", () => {
		const a = TestOkPromise(0)
		const b = TestOkPromise(1)
		expect(a.or(b)).toEqual(a)
	})

	it("returns the late value when Err or Ok", () => {
		const a = TestErrPromise("early error")
		const b = TestOkPromise(1)
		expect(a.or(b)).toEqual(b)
	})

	it("returns the late error when Err and Err", () => {
		const a = TestErrPromise("early error")
		const b = TestErrPromise("late error")
		expect(a.or(b)).toEqual(b)
	})
})

describe.concurrent("orElse", () => {
	it("returns the result for an Ok result", () => {
		const a = TestOkPromise(1)
		expect(a.orElse(() => Ok(1))).toEqual(a)
	})

	it("returns the mapped value for an Err result", () => {
		const a = TestErrPromise("error")
		expect(a.orElse(() => Ok(1))).toEqual(TestOkPromise(1))
		expect(a.orElse(() => Err(1))).toEqual(TestErrPromise(1))
	})
})

describe.concurrent("orElseAsync", () => {
	it("returns the result for an Ok result", async () => {
		const a = TestOkPromise<number, string>(0)
		await expect(a.orElseAsync(async () => Ok(1))).resolves.toEqual(Ok(0))
	})

	it("returns the mapped value for an Err result", async () => {
		const a = TestErrPromise<string, string>("original")
		await expect(a.orElseAsync(async () => Ok(1))).resolves.toEqual(Ok(1))
		await expect(a.orElseAsync(async () => Err(1))).resolves.toEqual(Err(1))
	})
})

describe.concurrent("unwrap", () => {
	it("returns the value for an Ok result", async () => {
		const result = new ResultPromise(Promise.resolve(Ok(42)))
		await expect(result.unwrap()).resolves.toEqual(42)
	})

	it("throws a Panic for an Err result", async () => {
		const error = new Error("Test error")
		const result = new ResultPromise(Promise.resolve(Err(error)))
		await expect(result.unwrap()).rejects.toThrow(Panic)
	})
})

describe.concurrent("unwrapErr", () => {
	it("returns the error for an Err result", async () => {
		const error = new Error("Test error")
		const result = new ResultPromise(Promise.resolve(Err(error)))
		await expect(result.unwrapErr()).resolves.toEqual(error)
	})

	it("throws for an Ok result", async () => {
		const result = new ResultPromise(Promise.resolve(Ok(42)))
		await expect(result.unwrapErr()).rejects.toThrow(Panic)
	})
})

describe.concurrent("unwrapOr", () => {
	it("returns the value for an Ok result", async () => {
		const result = new ResultPromise(Promise.resolve(Ok(42)))
		await expect(result.unwrapOr(0)).resolves.toEqual(42)
	})

	it("returns the default value for an Err result", async () => {
		const error = new Error("Test error")
		const result = new ResultPromise(Promise.resolve(Err(error)))
		await expect(result.unwrapOr(42)).resolves.toEqual(42)
	})
})

describe.concurrent("unwrapOrElse", () => {
	it("returns the value for an Ok result", async () => {
		const result = new ResultPromise(Promise.resolve(Ok(42)))
		await expect(result.unwrapOrElse(() => 0)).resolves.toEqual(42)
	})

	it("returns the default value from a function for an Err result", async () => {
		const error = new Error("Test error")
		const result = new ResultPromise(Promise.resolve(Err(error)))
		await expect(result.unwrapOrElse(() => 42)).resolves.toEqual(42)
	})
})

describe.concurrent("match", () => {
	it("calls the ok function for an Ok result", async () => {
		const result = new ResultPromise(Promise.resolve(Ok(42)))
		const output = result.match({
			Ok: (value) => value * 2,
			Err: () => 0,
		})
		await expect(output).resolves.toEqual(84)
	})

	it("calls the err function for an Err result", async () => {
		const error = new Error("Test error")
		const result = new ResultPromise<number, Error>(Promise.resolve(Err(error)))
		const output = result.match({
			Ok: (value) => value * 2,
			Err: () => 0,
		})
		await expect(output).resolves.toEqual(0)
	})
})
