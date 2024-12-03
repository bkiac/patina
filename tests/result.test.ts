// deno-lint-ignore-file require-await
import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { assertSpyCall, assertSpyCalls, spy } from "@std/testing/mock";
import { expectTypeOf } from "expect-type";
import { Err, Ok, Result } from "../src/result.ts";
import { None, Some } from "../src/option.ts";
import { ErrorWithTag, Panic } from "../src/error.ts";

function TestOk<T, E>(value: T): Result<T, E> {
	return Ok(value);
}

function TestErr<T, E>(value: E): Result<T, E> {
	return Err(value);
}

describe("core", () => {
	it("returns an Ok result", () => {
		const r = Ok(42);

		expect(r.isOk()).toEqual(true);
		expect(r.isErr()).toEqual(false);

		expectTypeOf(r.value).toEqualTypeOf<() => number>();
		expect(r.value()).toEqual(42);

		expectTypeOf(r.error).toEqualTypeOf<() => undefined>();
		expect(r.error()).toEqual(undefined);

		expectTypeOf(r.unwrap).toEqualTypeOf<() => number>();
		expect(r.unwrap()).toEqual(42);

		// @ts-expect-error - unwrapErr should not exist on Ok
		expectTypeOf(r.unwrapErr).toEqualTypeOf<any>();

		expectTypeOf(r.unwrapUnchecked).toEqualTypeOf<() => number>();
		expect(r.unwrapUnchecked()).toEqual(42);

		expectTypeOf(r.unwrapErrUnchecked).toEqualTypeOf<() => null>();
		expect(r.unwrapErrUnchecked()).toEqual(null);

		expectTypeOf(r.expect).toEqualTypeOf<(msg: string) => number>();
		expect(r.expect("")).toEqual(42);

		expectTypeOf(r.expectErr).toEqualTypeOf<(msg: string) => never>();
		expect(() => r.expectErr("")).toThrow(Panic);
	});

	it("returns an Err result", () => {
		const r = Err("error");

		expect(r.isOk()).toEqual(false);
		expect(r.isErr()).toEqual(true);

		expectTypeOf(r.value).toEqualTypeOf<() => undefined>();
		expect(r.value()).toEqual(undefined);

		expectTypeOf(r.error).toEqualTypeOf<() => string>();
		expect(r.error()).toEqual("error");

		// @ts-expect-error - unwrap should not exist on Err
		expectTypeOf(r.unwrap).toEqualTypeOf<any>();

		expectTypeOf(r.unwrapErr).toEqualTypeOf<() => string>();
		expect(r.unwrapErr()).toEqual("error");

		expectTypeOf(r.unwrapUnchecked).toEqualTypeOf<() => null>();
		expect(r.unwrapUnchecked()).toEqual(null);

		expectTypeOf(r.unwrapErrUnchecked).toEqualTypeOf<() => string>();
		expect(r.unwrapErrUnchecked()).toEqual("error");

		expectTypeOf(r.expect).toEqualTypeOf<(msg: string) => never>();
		expect(() => r.expect("")).toThrow(Panic);

		expectTypeOf(r.expectErr).toEqualTypeOf<(msg: string) => string>();
		expect(r.expectErr("")).toEqual("error");
	});

	it("works as discriminated union", () => {
		const r = TestOk<number, string>(42);

		// @ts-expect-error - unwrap should not exist on Result
		expectTypeOf(r.unwrap).toEqualTypeOf<any>();
		// @ts-expect-error - unwrapErr should not exist on Result
		expectTypeOf(r.unwrapErr).toEqualTypeOf<any>();

		// These do not work for some reason, value and error are reported to be `never`
		// but type hints are correct if I hover over them.
		// expectTypeOf(r.value).toEqualTypeOf<() => number | undefined>();
		// expectTypeOf(r.error).toEqualTypeOf<() => number | undefined>();

		if (r.isOk()) {
			expectTypeOf(r.value).toEqualTypeOf<() => number>();
			expectTypeOf(r.error).toEqualTypeOf<() => undefined>();

			expectTypeOf(r.unwrap).toEqualTypeOf<() => number>();
			expectTypeOf(r.unwrapUnchecked).toEqualTypeOf<() => number>();

			// @ts-expect-error - unwrapErr should not exist on Err
			expectTypeOf(r.unwrapErr).toEqualTypeOf<any>();
			expectTypeOf(r.unwrapErrUnchecked).toEqualTypeOf<() => null>();

			expectTypeOf(r.expect).toEqualTypeOf<(msg: string) => number>();
			expectTypeOf(r.expectErr).toEqualTypeOf<(msg: string) => never>();
		} else {
			expectTypeOf(r.value).toEqualTypeOf<() => undefined>();
			expectTypeOf(r.error).toEqualTypeOf<() => string>();

			// @ts-expect-error - unwrap should not exist on Err
			expectTypeOf(r.unwrap).toEqualTypeOf<any>();
			expectTypeOf(r.unwrapUnchecked).toEqualTypeOf<() => null>();

			expectTypeOf(r.unwrapErr).toEqualTypeOf<() => string>();
			expectTypeOf(r.unwrapErrUnchecked).toEqualTypeOf<() => string>();

			expectTypeOf(r.expect).toEqualTypeOf<(msg: string) => never>();
			expectTypeOf(r.expectErr).toEqualTypeOf<(msg: string) => string>();
		}
	});
});

describe("ok", () => {
	it("returns the value when Ok", () => {
		const result = TestOk<number, string>(42);
		expect(result.ok()).toEqual(Some(42));
	});

	it("returns None when Err", () => {
		const result = TestErr<number, string>("error");
		expect(result.ok()).toEqual(None);
	});
});

describe("err", () => {
	it("returns None when Ok", () => {
		const result = TestOk<number, string>(42);
		expect(result.err()).toEqual(None);
	});

	it("returns the error when Err", () => {
		const result = TestErr<number, string>("error");
		expect(result.err()).toEqual(Some("error"));
	});
});

describe("and", () => {
	it("returns the error when Ok and Err", () => {
		const a = TestOk<string, string>("a");
		const b = TestErr<string, string>("b");
		expect(a.and(b).unwrapErrUnchecked()).toEqual("b");
	});

	it("returns the late value when Ok and Ok", () => {
		const a = TestOk<string, string>("a");
		const b = TestOk<string, string>("b");
		expect(a.and(b).unwrapUnchecked()).toEqual("b");
	});

	it("returns the error when Err and Ok", () => {
		const a = TestErr<string, string>("a");
		const b = TestOk<string, string>("b");
		expect(a.and(b).unwrapErrUnchecked()).toEqual("a");
	});

	it("returns the early error when Err and Err", () => {
		const a = TestErr<number, string>("a");
		const b = TestErr<number, string>("b");
		expect(a.and(b).unwrapErrUnchecked()).toEqual("a");
	});
});

describe("andThen", () => {
	it("returns the mapped value for an Ok result", () => {
		const a = TestOk<number, string>(0);
		expect(a.andThen((value) => Ok(value + 1)).unwrapUnchecked()).toEqual(1);
	});

	it("returns the result for an Err result", () => {
		const a = TestErr<number, string>("early error");
		expect(a.andThen((value) => Ok(value + 1)).unwrapErrUnchecked()).toEqual(
			a.unwrapErrUnchecked(),
		);
	});
});

describe("andThenAsync", () => {
	it("returns the mapped value for an Ok result", async () => {
		const a = TestOk<number, string>(0);
		await expect(a.andThenAsync(async (value) => Ok(value + 1)).unwrap()).resolves.toEqual(1);
	});

	it("returns the result for an Err result", async () => {
		const a = TestErr<number, string>("early error");
		await expect(a.andThenAsync(async (value) => Ok(value + 1)).unwrapErr()).resolves.toEqual(
			a.unwrapErrUnchecked(),
		);
	});
});

describe("expect", () => {
	it("returns the value when called on an Ok result", () => {
		const result = TestOk<number, string>(42);
		const value = result.expect("Panic message");
		expect(value).toEqual(42);
	});

	it("throws a Panic with the provided message when called on an Err result", () => {
		const result = TestErr<number, string>("error");
		const panicMsg = "Panic message";
		expect(() => result.expect(panicMsg)).toThrow(Panic);
		expect(() => result.expect(panicMsg)).toThrow(panicMsg);
	});
});

describe("expectErr", () => {
	it("returns the value when called on an Err result", () => {
		const err = TestErr<number, string>("error");
		expect(err.expectErr("panic message")).toEqual("error");
	});

	it("throws a Panic with the provided message when called on an Ok result", () => {
		const ok = TestOk<number, string>(0);
		const panicMsg = "Panic message";
		expect(() => ok.expectErr(panicMsg)).toThrow(Panic);
		expect(() => ok.expectErr(panicMsg)).toThrow(panicMsg);
	});
});

describe("flatten", () => {
	it("works with an Ok<Ok> result", () => {
		const inner = TestOk<number, string>(42);
		const flattened = TestOk<Result<number, string>, boolean>(inner).flatten();
		expectTypeOf(flattened).toEqualTypeOf<Result<number, string | boolean>>();
		expect(flattened.unwrapUnchecked()).toEqual(inner.unwrapUnchecked());
	});

	it("works with an Ok<Err> result", () => {
		const inner = TestErr<number, string>("error");
		const flattened = TestOk<Result<number, string>, boolean>(inner).flatten();
		expectTypeOf(flattened).toEqualTypeOf<Result<number, string | boolean>>();
		expect(flattened.unwrapErrUnchecked()).toEqual(inner.unwrapErrUnchecked());
	});

	it("works with an Err result", () => {
		const flattened = TestErr<Result<number, string>, boolean>(true).flatten();
		expectTypeOf(flattened).toEqualTypeOf<Result<number, string | boolean>>();
		expect(flattened.unwrapErrUnchecked()).toEqual(true);
	});

	it("works with non-primitive value or error", () => {
		class _Foo extends ErrorWithTag {
			readonly tag = "foo";
		}

		class Bar extends ErrorWithTag {
			readonly tag = "bar";
		}

		const foo = TestOk<
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
		expectTypeOf(bar).toEqualTypeOf<Result<{ id: string }, _Foo | Bar>>();
	});
});

describe("inspect", () => {
	it("calls closure on Ok result", () => {
		const f = spy((_value: number) => {
		});
		TestOk<number, string>(42).inspect(f);
		assertSpyCall(f, 0, { args: [42] });
	});

	it("does not call closure on Err result", () => {
		const f = spy(() => {});
		TestErr<number, string>("").inspect(f);
		assertSpyCalls(f, 0);
	});
});

describe("inspectAsync", () => {
	it("calls closure on Ok result", async () => {
		const f = spy(async (_value: number) => {});
		await TestOk<number, string>(42).inspectAsync(f);
		assertSpyCall(f, 0, { args: [42] });
	});

	it("does not call closure on Err result", async () => {
		const f = spy(async () => {});
		await TestErr<number, string>("").inspectAsync(f);
		assertSpyCalls(f, 0);
	});
});

describe("inspectErr", () => {
	it("does not call closure on Ok result", () => {
		const f = spy(async () => {});
		TestOk<number, string>(42).inspectErr(f);
		assertSpyCalls(f, 0);
	});

	it("returns this and calls closure on Err result", () => {
		const f = spy(async (_error: string) => {});
		TestErr<number, string>("error").inspectErr(f);
		assertSpyCall(f, 0, { args: ["error"] });
	});
});

describe("inspectErrAsync", () => {
	it("calls closure on Err result", async () => {
		const f = spy(async (_error: string) => {});
		await TestErr<number, string>("error").inspectErrAsync(f);
		assertSpyCall(f, 0, { args: ["error"] });
	});

	it("does not call closure on Ok result", async () => {
		const f = spy(async () => {});
		await TestOk<number, string>(42).inspectErrAsync(f);
		assertSpyCalls(f, 0);
	});
});

describe("map", () => {
	it("returns the mapped value for an Ok result", () => {
		const result = TestOk<number, string>(42);
		const result2 = result.map((value) => value * 2);
		expect(result2.unwrapUnchecked()).toEqual(84);
	});

	it("returns the original Err for an Err result", () => {
		const result = TestErr<number, string>("error");
		const result2 = result.map((value) => value * 2);
		expect(result2.unwrapErrUnchecked()).toEqual(result.unwrapErrUnchecked());
	});
});

describe("mapAsync", () => {
	it("returns the mapped value for an Ok result", async () => {
		const a = TestOk<number, string>(42);
		const b = a.mapAsync(async (value) => value * 2);
		await expect(b.unwrap()).resolves.toEqual(84);
	});

	it("returns the original Err for an Err result", async () => {
		const a = TestErr<number, string>("error");
		const b = a.mapAsync(async (value) => value * 2);
		await expect(b.unwrapErr()).resolves.toEqual(a.unwrapErrUnchecked());
	});
});

describe("mapErr", () => {
	it("returns the mapped error for an Err result", () => {
		const a = TestErr<number, string>("error");
		const b = a.mapErr(() => "new error");
		expect(b.unwrapErrUnchecked()).toEqual("new error");
	});

	it("returns the original Ok for an Err result", () => {
		const a = TestOk<number, string>(0);
		const b = a.mapErr(() => "new error");
		expect(b.unwrapUnchecked()).toEqual(0);
	});
});

describe("mapErrAsync", () => {
	it("returns the mapped error for an Err result", async () => {
		const a = TestErr<number, string>("error");
		const b = a.mapErrAsync(async () => "new error");
		await expect(b.unwrapErr()).resolves.toEqual("new error");
	});

	it("returns the original Ok for an Err result", async () => {
		const a = TestOk<number, string>(0);
		const b = a.mapErrAsync(async () => "new error");
		await expect(b.unwrap()).resolves.toEqual(a.unwrapUnchecked());
	});
});

describe("mapOr", () => {
	it("returns the mapped value for an Ok result", () => {
		const result = TestOk<number, string>(42);
		const value = result.mapOr(0, (value) => value * 2);
		expect(value).toEqual(84);
	});

	it("returns the default value for an Err result", () => {
		const result = TestErr<number, string>("error");
		const value = result.mapOr(0, (value) => value * 2);
		expect(value).toEqual(0);
	});
});

describe("mapOrElse", () => {
	it("returns the mapped value for an Ok result", () => {
		const result = TestOk<number, string>(42);
		const value = result.mapOrElse(
			() => 0,
			(value) => value * 2,
		);
		expect(value).toEqual(84);
	});

	it("returns the default value from a function for an Err result", () => {
		const result = TestErr<number, string>("error");
		const value = result.mapOrElse(
			() => 0,
			(value) => value * 2,
		);
		expect(value).toEqual(0);
	});
});

describe("or", () => {
	it("returns the value when Ok or Err", () => {
		const a = TestOk<string, string>("a");
		const b = TestErr<string, string>("b");
		expect(a.or(b).unwrapUnchecked()).toEqual("a");
	});

	it("returns the early value when Ok or Ok", () => {
		const a = TestOk<string, string>("a");
		const b = TestOk<string, string>("b");
		expect(a.or(b).unwrapUnchecked()).toEqual("a");
	});

	it("returns the late value when Err or Ok", () => {
		const a = TestErr<string, string>("a");
		const b = TestOk<string, string>("b");
		expect(a.or(b).unwrapUnchecked()).toEqual("b");
	});

	it("returns the late error when Err and Err", () => {
		const a = TestErr<string, string>("a");
		const b = TestErr<string, string>("b");
		expect(a.or(b).unwrapErrUnchecked()).toEqual("b");
	});
});

describe("orElse", () => {
	it("returns the result for an Ok result", () => {
		const a = TestOk<number, string>(0);
		expect(a.orElse(() => Ok(1)).unwrapUnchecked()).toEqual(a.unwrapUnchecked());
	});

	it("returns the mapped value for an Err result", () => {
		const a = TestErr<number, string>("early error");
		expect(a.orElse(() => Ok(1)).unwrapUnchecked()).toEqual(1);
		expect(a.orElse(() => Err(1)).unwrapErrUnchecked()).toEqual(1);
	});
});

describe("orElseAsync", () => {
	it("returns the result for an Ok result", async () => {
		const a = TestOk<number, string>(0);
		await expect(a.orElseAsync(async () => Ok(1)).unwrap()).resolves.toEqual(0);
	});

	it("returns the mapped value for an Err result", async () => {
		const a = TestErr<number, string>("early error");
		await expect(a.orElseAsync(async () => Ok(1)).unwrap()).resolves.toEqual(1);
		await expect(a.orElseAsync(async () => Err(1)).unwrapErr()).resolves.toEqual(1);
	});
});

describe("unwrap", () => {
	it("returns the value for an Ok result", () => {
		const result = TestOk<number, string>(42);
		expect(result.unwrapUnchecked()).toEqual(42);
	});

	it("returns null for an Err result", () => {
		const result = TestErr<number, string>("error");
		expect(result.unwrapUnchecked()).toEqual(null);
	});
});

describe("unwrapErr", () => {
	it("returns the error for an Err result", () => {
		const result = TestErr<number, string>("error");
		expect(result.unwrapErrUnchecked()).toEqual("error");
	});

	it("returns null for an Ok result", () => {
		const result = TestOk<number, string>(42);
		expect(result.unwrapErrUnchecked()).toEqual(null);
	});
});

describe("unwrapOr", () => {
	it("returns the value for an Ok result", () => {
		const result = TestOk<number, string>(42);
		expect(result.unwrapOr(0)).toEqual(42);
	});

	it("returns the default value for an Err result", () => {
		const result = TestErr<number, string>("error");
		expect(result.unwrapOr(42)).toEqual(42);
	});
});

describe("unwrapOrElse", () => {
	it("returns the value for an Ok result", () => {
		const result = TestOk<number, string>(42);
		expect(result.unwrapOrElse(() => 0)).toEqual(42);
	});

	it("returns the default value from a function for an Err result", () => {
		const result = TestErr<number, string>("error");
		const unwrapped = result.unwrapOrElse(() => 42);
		expect(unwrapped).toEqual(42);
	});
});

describe("match", () => {
	it("calls the ok function for an Ok result", () => {
		const result = TestOk<number, string>(42);
		const output = result.match({
			Ok: (value) => value * 2,
			Err: () => 0,
		});
		expect(output).toEqual(84);
	});

	it("calls the err function for an Err result", () => {
		const result = TestErr<number, string>("error");
		const output = result.match({
			Ok: (value) => value * 2,
			Err: () => 0,
		});
		expect(output).toEqual(0);
	});
});

describe("iterator", () => {
	it("works with regular yield", () => {
		function* gen() {
			yield Ok(1);
			yield Err("error");
			return Ok(2);
		}

		const result = gen();
		expect(result.next().value.unwrapUnchecked()).toEqual(1);
		expect(result.next().value.unwrapErrUnchecked()).toEqual("error");
		expect(result.next().value.unwrapUnchecked()).toEqual(2);
	});
});
