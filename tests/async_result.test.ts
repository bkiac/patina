// deno-lint-ignore-file require-await
import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { expectTypeOf } from "expect-type";
import { assertSpyCall, assertSpyCalls, spy } from "@std/testing/mock";
import { AsyncResult } from "../src/async_result.ts";
import { Err, Ok, Result } from "../src/result.ts";
import { None, Some } from "../src/option.ts";
import { ErrorWithTag, Panic } from "../src/error.ts";

function TestOkPromise<T, E>(value: T) {
	return new AsyncResult<T, E>(Promise.resolve(Ok<T>(value)));
}

function TestErrPromise<T, E>(error: E) {
	return new AsyncResult<T, E>(Promise.resolve(Err<E>(error)));
}

function TestOk<T, E>(value: T): Result<T, E> {
	return Ok(value);
}

function TestErr<T, E>(value: E): Result<T, E> {
	return Err(value);
}

describe("ok", () => {
	it("returns the value when called on an Ok result", async () => {
		const result = TestOkPromise(42);
		const option = result.ok();
		await expect(option).resolves.toEqual(Some(42));
	});

	it("returns None when called on an Err result", async () => {
		const result = TestErrPromise("error");
		const option = result.ok();
		await expect(option).resolves.toEqual(None);
	});
});

describe("and", () => {
	it("returns the error when Ok and Err", async () => {
		const a = TestOkPromise(1);
		const b = TestErrPromise("late error");
		await expect(a.and(b).unwrapErr()).resolves.toEqual("late error");
	});

	it("returns the late value when Ok and Ok", async () => {
		const a = TestOkPromise(1);
		const b = TestOkPromise(2);
		await expect(a.and(b).unwrap()).resolves.toEqual(2);
	});

	it("returns the error when Err and Ok", async () => {
		const a = TestErrPromise("early error");
		const b = TestOkPromise(1);
		await expect(a.and(b).unwrapErr()).resolves.toEqual("early error");
	});

	it("returns the early error when Err and Err", async () => {
		const a = TestErrPromise("early error");
		const b = TestErrPromise("late error");
		await expect(a.and(b).unwrapErr()).resolves.toEqual("early error");
	});
});

describe("andThen", () => {
	it("returns the mapped value for an Ok result", async () => {
		const a = TestOkPromise(0);
		await expect(a.andThen((value) => Ok(value + 1)).unwrap()).resolves.toEqual(1);
	});

	it("returns the result for an Err result", async () => {
		const a = TestErrPromise<number, string>("error");
		await expect(a.andThen((value) => Ok(value + 1)).unwrapErr()).resolves.toEqual("error");
	});
});

describe("andThenAsync", () => {
	it("returns the mapped value for an Ok result", async () => {
		const a = TestOkPromise<number, string>(0);
		await expect(a.andThenAsync(async (value) => Ok(value + 1)).unwrap()).resolves.toEqual(1);
	});

	it("returns the result for an Err result", async () => {
		const a = TestErrPromise<number, string>("error");
		await expect(a.andThenAsync(async (value) => Ok(value + 1)).unwrapErr()).resolves.toEqual(
			"error",
		);
	});
});

describe("expect", () => {
	it("returns the value when called on an Ok result", async () => {
		const result = TestOkPromise(42);
		const value = await result.expect("");
		expect(value).toEqual(42);
	});

	it("throws a Panic with the provided message when called on an Err result", async () => {
		const error = new Error("Original error");
		const result = TestErrPromise<number, Error>(error);
		await expect(result.expect("Panic message")).rejects.toThrow(Panic);
	});
});

describe("expectErr", () => {
	it("returns the error when called on an Err result", async () => {
		const result = TestErrPromise<number, Error>(new Error("Test error"));
		const error = await result.expectErr("");
		expect(error).toEqual(new Error("Test error"));
	});

	it("throws a Panic with the provided message when called on an Ok result", async () => {
		const result = TestOkPromise<number, string>(42);
		await expect(result.expectErr("Panic message")).rejects.toThrow(Panic);
	});
});

describe("flatten", () => {
	it("works with an Ok<Ok> result", async () => {
		const inner = TestOk<number, string>(42);
		const flattened = TestOkPromise<Result<number, string>, boolean>(inner).flatten();
		expectTypeOf(flattened).toEqualTypeOf<AsyncResult<number, string | boolean>>();
		await expect(flattened.unwrap()).resolves.toEqual(inner.unwrap());
	});

	it("works with an Ok<Err> result", async () => {
		const inner = TestErr<number, string>("error");
		const flattened = TestOkPromise<Result<number, string>, boolean>(inner).flatten();
		expectTypeOf(flattened).toEqualTypeOf<AsyncResult<number, string | boolean>>();
		await expect(flattened.unwrapErr()).resolves.toEqual(inner.unwrapErr());
	});

	it("works with an Err result", async () => {
		const flattened = TestErrPromise<Result<number, string>, boolean>(true).flatten();
		expectTypeOf(flattened).toEqualTypeOf<AsyncResult<number, string | boolean>>();
		await expect(flattened.unwrapErr()).resolves.toEqual(true);
	});

	it("works with non-primitive value or error", () => {
		class _Foo extends ErrorWithTag {
			readonly tag = "foo";
		}

		class Bar extends ErrorWithTag {
			readonly tag = "bar";
		}

		const foo = TestOkPromise<
			| {
				id: string;
			}
			| undefined,
			_Foo
		>({
			id: "1",
		});
		const bar = foo
			.map((value) => (value === undefined ? Err(new Bar()) : Ok(value)))
			.flatten();
		expectTypeOf(bar).toEqualTypeOf<AsyncResult<{ id: string }, _Foo | Bar>>();
	});
});

describe("inspect", () => {
	it("returns result and calls closure on Ok result", async () => {
		const fn = spy((_value: number) => {});
		await TestOkPromise(42).inspect(fn);
		assertSpyCall(fn, 0, { args: [42] });
	});

	it("returns result and does not call closure on Err result", async () => {
		const fn = spy((_value: number) => {});
		await TestErrPromise<number, string>("foo").inspect(fn);
		assertSpyCalls(fn, 0);
	});
});

describe("inspectAsync", () => {
	it("calls closure on Ok result", async () => {
		const f = spy(async (_value: number) => {});
		await TestOkPromise(42).inspectAsync(f);
		assertSpyCall(f, 0, { args: [42] });
	});

	it("does not call closure on Err result", async () => {
		const f = spy(async (_value: number) => {});
		await TestErrPromise<number, string>("foo").inspectAsync(f);
		assertSpyCalls(f, 0);
	});
});

describe("inspectErr", () => {
	it("returns result and does not call closure on Ok result", async () => {
		const fn = spy((_error: string) => {});
		await TestOkPromise<number, string>(0).inspectErr(fn);
		assertSpyCalls(fn, 0);
	});

	it("returns result and calls closure on Err result", async () => {
		const fn = spy((_error: string) => {});
		await TestErrPromise<number, string>("foo").inspectErr(fn);
		assertSpyCall(fn, 0, { args: ["foo"] });
	});
});

describe("inspectErrAsync", () => {
	it("does not call closure on Ok result", async () => {
		const f = spy(async (_error: string) => {});
		await TestOkPromise<number, string>(0).inspectErrAsync(f);
		assertSpyCalls(f, 0);
	});

	it("calls closure on Err result", async () => {
		const f = spy(async (_error: string) => {});
		await TestErrPromise<number, string>("foo").inspectErrAsync(f);
		assertSpyCall(f, 0, { args: ["foo"] });
	});
});

describe("map", () => {
	it("returns the mapped value for an Ok result", async () => {
		const result = TestOkPromise<number, string>(42);
		const result2 = result.map((value) => value * 2);
		await expect(result2.unwrap()).resolves.toEqual(84);
	});

	it("returns the original Err for an Err result", async () => {
		const error = new Error("Test error");
		const result = TestErrPromise<number, Error>(error);
		const result2 = result.map((value) => value * 2);
		const awaitedResult = await result;
		await expect(result2.unwrapErr()).resolves.toEqual(awaitedResult.unwrapErr());
	});
});

describe("mapAsync", () => {
	it("returns the mapped value for an Ok result", async () => {
		const a = TestOkPromise<number, string>(42);
		const b = a.mapAsync(async (value) => value * 2);
		await expect(b.unwrap()).resolves.toEqual(84);
	});

	it("returns the original Err for an Err result", async () => {
		const a = TestErrPromise<number, string>("error");
		const b = a.map((value) => value * 2);
		const awaitedResult = await a;
		await expect(b.unwrapErr()).resolves.toEqual(awaitedResult.unwrapErr());
	});
});

describe("mapErr", () => {
	it("returns the mapped error for an Err result", async () => {
		const a = TestErrPromise<number, string>("error");
		const b = a.mapErr(() => "new error");
		await expect(b.unwrapErr()).resolves.toEqual("new error");
	});

	it("returns the original Ok for an Err result", async () => {
		const result = TestOkPromise<number, string>(42);
		const result2 = result.mapErr(() => new Error("Error"));
		await expect(result2.unwrap()).resolves.toEqual(42);
	});
});

describe("mapErr", () => {
	it("returns the mapped error for an Err result", async () => {
		const a = TestErrPromise<number, string>("string");
		const b = a.mapErrAsync(async () => "error");
		await expect(b.unwrapErr()).resolves.toEqual("error");
	});

	it("returns the original Ok for an Err result", async () => {
		const a = TestOkPromise<number, string>(42);
		const b = a.mapErrAsync(async () => new Error("Error"));
		await expect(b.unwrap()).resolves.toEqual(42);
	});
});

describe("mapOr", () => {
	it("returns the mapped value for an Ok result", async () => {
		const result = TestOkPromise<number, string>(42);
		const value = await result.mapOr(0, (value) => value * 2);
		expect(value).toEqual(84);
	});

	it("returns the default value for an Err result", async () => {
		const error = new Error("Test error");
		const result = TestErrPromise<number, Error>(error);
		const value = await result.mapOr(0, (value) => value * 2);
		expect(value).toEqual(0);
	});
});

describe("mapOrElse", () => {
	it("returns the mapped value for an Ok result", async () => {
		const result = TestOkPromise<number, string>(42);
		const value = await result.mapOrElse(
			() => 0,
			(value) => value * 2,
		);
		expect(value).toEqual(84);
	});

	it("returns the default value from a function for an Err result", async () => {
		const result = TestErrPromise<number, Error>(new Error("Test error"));
		const value = await result.mapOrElse(
			() => 0,
			(value) => value * 2,
		);
		expect(value).toEqual(0);
	});
});

describe("or", () => {
	it("returns the value when Ok or Err", async () => {
		const a = TestOkPromise("a");
		const b = TestErrPromise("b");
		await expect(a.or(b).unwrap()).resolves.toEqual("a");
	});

	it("returns the early value when Ok or Ok", async () => {
		const a = TestOkPromise("a");
		const b = TestOkPromise("b");
		await expect(a.or(b).unwrap()).resolves.toEqual("a");
	});

	it("returns the late value when Err or Ok", async () => {
		const a = TestErrPromise("a");
		const b = TestOkPromise("b");
		await expect(a.or(b).unwrap()).resolves.toEqual("b");
	});

	it("returns the late error when Err and Err", async () => {
		const a = TestErrPromise("a");
		const b = TestErrPromise("b");
		await expect(a.or(b).unwrapErr()).resolves.toEqual("b");
	});
});

describe("orElse", () => {
	it("returns the result for an Ok result", async () => {
		const a = TestOkPromise(1);
		await expect(a.orElse(() => Ok(1)).unwrap()).resolves.toEqual(1);
	});

	it("returns the mapped value for an Err result", async () => {
		const a = TestErrPromise("error");
		await expect(a.orElse(() => Ok(1)).unwrap()).resolves.toEqual(1);
		await expect(a.orElse(() => Err(1)).unwrapErr()).resolves.toEqual(1);
	});
});

describe("orElseAsync", () => {
	it("returns the result for an Ok result", async () => {
		const a = TestOkPromise<number, string>(0);
		await expect(a.orElseAsync(async () => Ok(1)).unwrap()).resolves.toEqual(0);
	});

	it("returns the mapped value for an Err result", async () => {
		const a = TestErrPromise<string, string>("original");
		await expect(a.orElseAsync(async () => Ok(1)).unwrap()).resolves.toEqual(1);
		await expect(a.orElseAsync(async () => Err(1)).unwrapErr()).resolves.toEqual(1);
	});
});

describe("unwrap", () => {
	it("returns the value for an Ok result", async () => {
		const result = TestOkPromise<number, string>(42);
		await expect(result.unwrap()).resolves.toEqual(42);
	});

	it("returns null for an Err result", async () => {
		const error = new Error("Test error");
		const result = TestErrPromise<number, Error>(error);
		await expect(result.unwrap()).resolves.toEqual(null);
	});
});

describe("unwrapErr", () => {
	it("returns the error for an Err result", async () => {
		const error = new Error("Test error");
		const result = TestErrPromise<number, Error>(error);
		await expect(result.unwrapErr()).resolves.toEqual(error);
	});

	it("returns null for an Ok result", async () => {
		const result = TestOkPromise<number, string>(42);
		await expect(result.unwrapErr()).resolves.toEqual(null);
	});
});

describe("unwrapOr", () => {
	it("returns the value for an Ok result", async () => {
		const result = TestOkPromise<number, string>(42);
		await expect(result.unwrapOr(0)).resolves.toEqual(42);
	});

	it("returns the default value for an Err result", async () => {
		const error = new Error("Test error");
		const result = TestErrPromise<number, Error>(error);
		await expect(result.unwrapOr(42)).resolves.toEqual(42);
	});
});

describe("unwrapOrElse", () => {
	it("returns the value for an Ok result", async () => {
		const result = TestOkPromise<number, string>(42);
		await expect(result.unwrapOrElse(() => 0)).resolves.toEqual(42);
	});

	it("returns the default value from a function for an Err result", async () => {
		const error = new Error("Test error");
		const result = TestErrPromise<number, Error>(error);
		await expect(result.unwrapOrElse(() => 42)).resolves.toEqual(42);
	});
});

describe("match", () => {
	it("calls the ok function for an Ok result", async () => {
		const result = TestOkPromise<number, string>(42);
		const output = result.match({
			Ok: (value) => value * 2,
			Err: () => 0,
		});
		await expect(output).resolves.toEqual(84);
	});

	it("calls the err function for an Err result", async () => {
		const error = new Error("Test error");
		const result = TestErrPromise<number, Error>(error);
		const output = result.match({
			Ok: (value) => value * 2,
			Err: () => 0,
		});
		await expect(output).resolves.toEqual(0);
	});
});
