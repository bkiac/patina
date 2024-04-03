import {describe, it, expect, expectTypeOf} from "vitest"
import {
	Err,
	Panic,
	ResultPromise,
	Ok,
	Result,
	ErrorWithTag,
	Some,
	None,
	CaughtError,
	tryPromise,
} from "../src"
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
		await expect(a.and(b).unwrapErr()).resolves.toEqual("late error")
	})

	it("returns the late value when Ok and Ok", async () => {
		const a = TestOkPromise(1)
		const b = TestOkPromise(2)
		await expect(a.and(b).unwrap()).resolves.toEqual(2)
	})

	it("returns the error when Err and Ok", async () => {
		const a = TestErrPromise("early error")
		const b = TestOkPromise(1)
		await expect(a.and(b).unwrapErr()).resolves.toEqual("early error")
	})

	it("returns the early error when Err and Err", async () => {
		const a = TestErrPromise("early error")
		const b = TestErrPromise("late error")
		await expect(a.and(b).unwrapErr()).resolves.toEqual("early error")
	})
})

describe.concurrent("andThen", () => {
	it("returns the mapped value for an Ok result", async () => {
		const a = TestOkPromise(0)
		await expect(a.andThen((value) => Ok(value + 1)).unwrap()).resolves.toEqual(1)
	})

	it("returns the result for an Err result", async () => {
		const a = TestErrPromise("error")
		await expect(a.andThen((value) => Ok(value + 1)).unwrapErr()).resolves.toEqual("error")
	})
})

describe.concurrent("andThenAsync", () => {
	it("returns the mapped value for an Ok result", async () => {
		const a = TestOkPromise<number, string>(0)
		await expect(a.andThenAsync(async (value) => Ok(value + 1)).unwrap()).resolves.toEqual(1)
	})

	it("returns the result for an Err result", async () => {
		const a = TestErrPromise<number, string>(0)
		await expect(a.andThenAsync(async (value) => Ok(value + 1)).unwrapErr()).resolves.toEqual(0)
	})

	it("can map error type", async () => {
		const a = TestErrPromise<"foo", number>("foo")
		const b = a.andThenAsync(async (value) => {
			if (value < 0) {
				return Err("bar" as const)
			}
			if (value > 1) {
				return Ok(value)
			}
			return Err("baz" as const)
		})
		expectTypeOf(b).toEqualTypeOf<ResultPromise<number, "foo" | "bar" | "baz">>()
	})

	it("can map error type with complicated error", async () => {
		class PrismaError extends ErrorWithTag {
			readonly tag = "prisma"
			// readonly message = "Prisma error"

			// constructor(public readonly error: CaughtError) {
			// 	super()
			// }
		}

		abstract class NotFoundError extends ErrorWithTag {
			// category = "not_found"
		}

		class AccountNotFoundError extends NotFoundError {
			readonly tag = "account"
			// readonly message = "Account not found"
		}

		async function fn(): Promise<{id: number} | null> {
			return {id: 1}
		}

		const maybeExpiredToken = await tryPromise(fn())
			.mapErr((error) => new PrismaError(error))
			.andThen((maybeAccount) => {
				if (maybeAccount) {
					return Ok(maybeAccount)
				}
				return Err(new AccountNotFoundError())
			})
			.andThenAsync(async (account) => {
				if (account.id < 0) {
					return Err(new AccountNotFoundError())
				}

				const ye = await tryPromise(fn()).mapErr((error) => new PrismaError(error))
				if (ye.isErr) {
					return Err(ye.value)
				}

				return Ok(account)
			})
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
	it("works with an Ok<Ok> result", async () => {
		const inner = TestOk<number, string>(42)
		const flattened = TestOkPromise<Result<number, string>, boolean>(inner).flatten()
		expectTypeOf(flattened).toEqualTypeOf<ResultPromise<number, string | boolean>>()
		await expect(flattened.unwrap()).resolves.toEqual(inner.unwrap())
	})

	it("works with an Ok<Err> result", async () => {
		const inner = TestErr<number, string>("error")
		const flattened = TestOkPromise<Result<number, string>, boolean>(inner).flatten()
		expectTypeOf(flattened).toEqualTypeOf<ResultPromise<number, string | boolean>>()
		await expect(flattened.unwrapErr()).resolves.toEqual(inner.unwrapErr())
	})

	it("works with an Err result", async () => {
		const flattened = TestErrPromise<boolean, Result<number, string>>(true).flatten()
		expectTypeOf(flattened).toEqualTypeOf<ResultPromise<number, string | boolean>>()
		await expect(flattened.unwrapErr()).resolves.toEqual(true)
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
		const fn = vi.fn()
		await new ResultPromise(Promise.resolve(Ok(42))).inspect(fn)
		expect(fn).toHaveBeenCalled()
	})

	it("returns result and does not call closure on Err result", async () => {
		const fn = vi.fn()
		await new ResultPromise(Promise.resolve(Err("foo"))).inspect(fn)
		expect(fn).not.toHaveBeenCalled()
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
		const fn = vi.fn()
		await new ResultPromise(Promise.resolve(Ok(42))).inspectErr(fn)
		expect(fn).not.toHaveBeenCalled()
	})

	it("returns result and calls closure on Err result", async () => {
		const fn = vi.fn()
		await new ResultPromise(Promise.resolve(Err("foo"))).inspectErr(fn)
		expect(fn).toHaveBeenCalled()
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
		await expect(result2.unwrap()).resolves.toEqual(84)
	})

	it("returns the original Err for an Err result", async () => {
		const error = new Error("Test error")
		const result = new ResultPromise<number, Error>(Promise.resolve(Err(error)))
		const result2 = result.map((value) => value * 2)
		const awaitedResult = await result
		await expect(result2.unwrapErr()).resolves.toEqual(awaitedResult.unwrapErr())
	})
})

describe.concurrent("mapAsync", () => {
	it("returns the mapped value for an Ok result", async () => {
		const a = new ResultPromise(Promise.resolve(Ok(42)))
		const b = a.mapAsync(async (value) => value * 2)
		await expect(b.unwrap()).resolves.toEqual(84)
	})

	it("returns the original Err for an Err result", async () => {
		const a = new ResultPromise<number, string>(Promise.resolve(Err("error")))
		const b = a.map((value) => value * 2)
		const awaitedResult = await a
		await expect(b.unwrapErr()).resolves.toEqual(awaitedResult.unwrapErr())
	})
})

describe.concurrent("mapErr", () => {
	it("returns the mapped error for an Err result", async () => {
		const a = new ResultPromise(Promise.resolve(Err("error")))
		const b = a.mapErr(() => "new error")
		await expect(b.unwrapErr()).resolves.toEqual("new error")
	})

	it("returns the original Ok for an Err result", async () => {
		const result = new ResultPromise(Promise.resolve(Ok()))
		const result2 = result.mapErr(() => new Error("Error"))
		await expect(result2.unwrap()).resolves.toEqual(undefined)
	})
})

describe.concurrent("mapErr", () => {
	it("returns the mapped error for an Err result", async () => {
		const a = new ResultPromise(Promise.resolve(Err("string")))
		const b = a.mapErrAsync(async () => "error")
		await expect(b.unwrapErr()).resolves.toEqual("error")
	})

	it("returns the original Ok for an Err result", async () => {
		const a = new ResultPromise(Promise.resolve(Ok()))
		const b = a.mapErrAsync(async () => new Error("Error"))
		await expect(b.unwrap()).resolves.toEqual(undefined)
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
	it("returns the value when Ok or Err", async () => {
		const a = TestOkPromise("a")
		const b = TestErrPromise("b")
		await expect(a.or(b).unwrap()).resolves.toEqual("a")
	})

	it("returns the early value when Ok or Ok", async () => {
		const a = TestOkPromise("a")
		const b = TestOkPromise("b")
		await expect(a.or(b).unwrap()).resolves.toEqual("a")
	})

	it("returns the late value when Err or Ok", async () => {
		const a = TestErrPromise("a")
		const b = TestOkPromise("b")
		await expect(a.or(b).unwrap()).resolves.toEqual("b")
	})

	it("returns the late error when Err and Err", async () => {
		const a = TestErrPromise("a")
		const b = TestErrPromise("b")
		await expect(a.or(b).unwrapErr()).resolves.toEqual("b")
	})
})

describe.concurrent("orElse", () => {
	it("returns the result for an Ok result", async () => {
		const a = TestOkPromise(1)
		await expect(a.orElse(() => Ok(1)).unwrap()).resolves.toEqual(1)
	})

	it("returns the mapped value for an Err result", async () => {
		const a = TestErrPromise("error")
		await expect(a.orElse(() => Ok(1)).unwrap()).resolves.toEqual(1)
		await expect(a.orElse(() => Err(1)).unwrapErr()).resolves.toEqual(1)
	})
})

describe.concurrent("orElseAsync", () => {
	it("returns the result for an Ok result", async () => {
		const a = TestOkPromise<number, string>(0)
		await expect(a.orElseAsync(async () => Ok(1)).unwrap()).resolves.toEqual(0)
	})

	it("returns the mapped value for an Err result", async () => {
		const a = TestErrPromise<string, string>("original")
		await expect(a.orElseAsync(async () => Ok(1)).unwrap()).resolves.toEqual(1)
		await expect(a.orElseAsync(async () => Err(1)).unwrapErr()).resolves.toEqual(1)
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
