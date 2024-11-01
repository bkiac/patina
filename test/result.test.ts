import {
	assertEquals,
	assertStrictEquals,
	assertType,
} from "https://deno.land/std/testing/asserts.ts";
import {describe, it} from "https://deno.land/std/testing/bdd.ts";
import {Ok, Err, Result} from "../src/result.ts";

export function TestOk<T, E>(value: T): Result<T, E> {
	return Ok(value);
}

export function TestErr<T, E>(value: E): Result<T, E> {
	return Err(value);
}

describe("core", () => {
	it("returns an Ok result", () => {
		const r = Ok(42);

		assertEquals(r.isOk(), true);
		assertEquals(r.isErr(), false);

		assertEquals(r.value(), 42);
		assertStrictEquals(typeof r.value, "number");
		assertStrictEquals(typeof r.error, "undefined");

		assertStrictEquals(typeof r.unwrap, "number");
		assertStrictEquals(typeof r.unwrapErr, "undefined");

		assertStrictEquals(typeof r.expect, "(msg: string) => number");
		assertStrictEquals(typeof r.expectErr, "(msg: string) => never");
	});

	it("returns an Err result", () => {
		const r = Err("error");

		assertEquals(r.isOk(), false);
		assertEquals(r.isErr(), true);

		assertStrictEquals(typeof r.value, "undefined");
		assertEquals(r.error(), "error");
		assertStrictEquals(typeof r.error, "string");

		assertStrictEquals(typeof r.unwrap, "undefined");
		assertStrictEquals(typeof r.unwrapErr, "string");

		assertStrictEquals(typeof r.expect, "(msg: string) => never");
		assertStrictEquals(typeof r.expectErr, "(msg: string) => string");
	});

	it("works as discriminated union", () => {
		const r = TestOk<number, string>(42);
		assertStrictEquals(typeof r.value(), "number | undefined");
		assertStrictEquals(typeof r.error(), "string | undefined");
		if (r.isOk()) {
			assertStrictEquals(typeof r.value, "number");
			assertStrictEquals(typeof r.error, "undefined");

			assertStrictEquals(typeof r.unwrap, "number");
			assertStrictEquals(typeof r.unwrapErr, "undefined");

			assertStrictEquals(typeof r.expect, "(msg: string) => number");
			assertStrictEquals(typeof r.expectErr, "(msg: string) => never");
		} else {
			assertStrictEquals(typeof r.value, "undefined");
			assertStrictEquals(typeof r.error, "string");

			assertStrictEquals(typeof r.unwrap, "undefined");
			assertStrictEquals(typeof r.unwrapErr, "string");

			assertStrictEquals(typeof r.expect, "(msg: string) => never");
			assertStrictEquals(typeof r.expectErr, "(msg: string) => string");
		}

		if (r.isErr()) {
			assertStrictEquals(typeof r.value, "undefined");
			assertStrictEquals(typeof r.error, "string");

			assertStrictEquals(typeof r.unwrap, "undefined");
			assertStrictEquals(typeof r.unwrapErr, "string");

			assertStrictEquals(typeof r.expect, "(msg: string) => never");
			assertStrictEquals(typeof r.expectErr, "(msg: string) => string");
		} else {
			assertStrictEquals(typeof r.value, "number");
			assertStrictEquals(typeof r.error, "undefined");

			assertStrictEquals(typeof r.unwrap, "number");
			assertStrictEquals(typeof r.unwrapErr, "undefined");

			assertStrictEquals(typeof r.expect, "(msg: string) => number");
			assertStrictEquals(typeof r.expectErr, "(msg: string) => never");
		}
	});
});

describe("ok", () => {
	it("returns the value when Ok", () => {
		const result = TestOk<number, string>(42);
		assertEquals(result.ok(), Some(42));
	});

	it("returns None when Err", () => {
		const result = TestErr<number, string>("error");
		assertEquals(result.ok(), None);
	});
});

describe("err", () => {
	it("returns None when Ok", () => {
		const result = TestOk<number, string>(42);
		assertEquals(result.err(), None);
	});

	it("returns the error when Err", () => {
		const result = TestErr<number, string>("error");
		assertEquals(result.err(), Some("error"));
	});
});

describe("and", () => {
	it("returns the error when Ok and Err", () => {
		const a = TestOk<string, string>("a");
		const b = TestErr<string, string>("b");
		assertEquals(a.and(b).unwrapErr(), "b");
	});

	it("returns the late value when Ok and Ok", () => {
		const a = TestOk<string, string>("a");
		const b = TestOk<string, string>("b");
		assertEquals(a.and(b).unwrap(), "b");
	});

	it("returns the error when Err and Ok", () => {
		const a = TestErr<string, string>("a");
		const b = TestOk<string, string>("b");
		assertEquals(a.and(b).unwrapErr(), "a");
	});

	it("returns the early error when Err and Err", () => {
		const a = TestErr<number, string>("a");
		const b = TestErr<number, string>("b");
		assertEquals(a.and(b).unwrapErr(), "a");
	});
});

describe("andThen", () => {
	it("returns the mapped value for an Ok result", () => {
		const a = TestOk<number, string>(0);
		assertEquals(a.andThen((value) => Ok(value + 1)).unwrap(), 1);
	});

	it("returns the result for an Err result", () => {
		const a = TestErr<number, string>("early error");
		assertEquals(a.andThen((value) => Ok(value + 1)).unwrapErr(), a.unwrapErr());
	});
});

describe("andThenAsync", () => {
	it("returns the mapped value for an Ok result", async () => {
		const a = TestOk<number, string>(0);
		await assertEquals(a.andThenAsync(async (value) => Ok(value + 1)).unwrap(), 1);
	});

	it("returns the result for an Err result", async () => {
		const a = TestErr<number, string>("early error");
		await assertEquals(
			a.andThenAsync(async (value) => Ok(value + 1)).unwrapErr(),
			a.unwrapErr(),
		);
	});
});

describe("expect", () => {
	it("returns the value when called on an Ok result", () => {
		const result = TestOk<number, string>(42);
		const value = result.expect("Panic message");
		assertEquals(value, 42);
	});

	it("throws a Panic with the provided message when called on an Err result", () => {
		const result = TestErr<number, string>("error");
		const panicMsg = "Panic message";
		assertThrows(() => result.expect(panicMsg), Panic);
		assertThrows(() => result.expect(panicMsg), panicMsg);
	});
});

describe("expectErr", () => {
	it("returns the value when called on an Err result", () => {
		const err = TestErr<number, string>("error");
		assertEquals(err.expectErr("panic message"), "error");
	});

	it("throws a Panic with the provided message when called on an Ok result", () => {
		const ok = TestOk<number, string>(0);
		const panicMsg = "Panic message";
		assertThrows(() => ok.expectErr(panicMsg), Panic);
		assertThrows(() => ok.expectErr(panicMsg), panicMsg);
	});
});

describe("flatten", () => {
	it("works with an Ok<Ok> result", () => {
		const inner = TestOk<number, string>(42);
		const flattened = TestOk<Result<number, string>, boolean>(inner).flatten();
		assertStrictEquals(typeof flattened, "Result<number, string | boolean>");
		assertEquals(flattened.unwrap(), inner.unwrap());
	});

	it("works with an Ok<Err> result", () => {
		const inner = TestErr<number, string>("error");
		const flattened = TestOk<Result<number, string>, boolean>(inner).flatten();
		assertStrictEquals(typeof flattened, "Result<number, string | boolean>");
		assertEquals(flattened.unwrapErr(), inner.unwrapErr());
	});

	it("works with an Err result", () => {
		const flattened = TestErr<Result<number, string>, boolean>(true).flatten();
		assertStrictEquals(typeof flattened, "Result<number, string | boolean>");
		assertEquals(flattened.unwrapErr(), true);
	});

	it("works with non-primitive value or error", () => {
		class Foo extends ErrorWithTag {
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
			Foo
		>({
			id: "1",
		});
		const bar = foo
			.map((value) => (value === undefined ? Err(new Bar()) : Ok(value)))
			.flatten();
		assertStrictEquals(typeof bar, "Result<{id: string}, Foo | Bar>");
	});
});

describe("inspect", () => {
	it("calls closure on Ok result", () => {
		const f = vi.fn();
		TestOk<number, string>(42).inspect(f);
		assertEquals(f.mock.calls.length, 1);
	});

	it("does not call closure on Err result", () => {
		const f = vi.fn();
		TestErr<number, string>("").inspect(f);
		assertEquals(f.mock.calls.length, 0);
	});
});

describe("inspectAsync", () => {
	it("calls closure on Ok result", async () => {
		const f = vi.fn().mockResolvedValue("mocked value");
		await TestOk<number, string>(42).inspectAsync(f);
		assertEquals(f.mock.calls.length, 1);
	});

	it("does not call closure on Err result", async () => {
		const f = vi.fn().mockResolvedValue("mocked value");
		await TestErr<number, string>("").inspectAsync(f);
		assertEquals(f.mock.calls.length, 0);
	});
});

describe("inspectErr", () => {
	it("does not call closure on Ok result", () => {
		const f = vi.fn();
		TestOk<number, string>(42).inspectErr(f);
		assertEquals(f.mock.calls.length, 0);
	});

	it("returns this and calls closure on Err result", () => {
		const f = vi.fn();
		TestErr<number, string>("").inspectErr(f);
		assertEquals(f.mock.calls.length, 1);
	});
});

describe("inspectErrAsync", () => {
	it("calls closure on Err result", async () => {
		const f = vi.fn().mockResolvedValue("mocked value");
		await TestOk<number, string>(42).inspectErrAsync(f);
		assertEquals(f.mock.calls.length, 0);
	});

	it("does not call closure on Ok result", async () => {
		const f = vi.fn().mockResolvedValue("mocked value");
		await TestErr<number, string>("").inspectErrAsync(f);
		assertEquals(f.mock.calls.length, 1);
	});
});

describe("map", () => {
	it("returns the mapped value for an Ok result", () => {
		const result = TestOk<number, string>(42);
		const result2 = result.map((value) => value * 2);
		assertEquals(result2.unwrap(), 84);
	});

	it("returns the original Err for an Err result", () => {
		const result = TestErr<number, string>("error");
		const result2 = result.map((value) => value * 2);
		assertEquals(result2.unwrapErr(), result.unwrapErr());
	});
});

describe("mapAsync", () => {
	it("returns the mapped value for an Ok result", async () => {
		const a = TestOk<number, string>(42);
		const b = a.mapAsync(async (value) => value * 2);
		await assertEquals(b.unwrap(), 84);
	});

	it("returns the original Err for an Err result", async () => {
		const a = TestErr<number, string>("error");
		const b = a.mapAsync(async (value) => value * 2);
		await assertEquals(b.unwrapErr(), a.unwrapErr());
	});
});

describe("mapErr", () => {
	it("returns the mapped error for an Err result", () => {
		const a = TestErr<number, string>("error");
		const b = a.mapErr(() => "new error");
		assertEquals(b.unwrapErr(), "new error");
	});

	it("returns the original Ok for an Err result", () => {
		const a = TestOk<number, string>(0);
		const b = a.mapErr(() => "new error");
		assertEquals(b.unwrap(), 0);
	});
});

describe("mapErrAsync", () => {
	it("returns the mapped error for an Err result", async () => {
		const a = TestErr<number, string>("error");
		const b = a.mapErrAsync(async () => "new error");
		await assertEquals(b.unwrapErr(), "new error");
	});

	it("returns the original Ok for an Err result", async () => {
		const a = TestOk<number, string>(0);
		const b = a.mapErrAsync(async () => "new error");
		await assertEquals(b.unwrap(), a.unwrap());
	});
});

describe("mapOr", () => {
	it("returns the mapped value for an Ok result", () => {
		const result = TestOk<number, string>(42);
		const value = result.mapOr(0, (value) => value * 2);
		assertEquals(value, 84);
	});

	it("returns the default value for an Err result", () => {
		const result = TestErr<number, string>("error");
		const value = result.mapOr(0, (value) => value * 2);
		assertEquals(value, 0);
	});
});

describe("mapOrElse", () => {
	it("returns the mapped value for an Ok result", () => {
		const result = TestOk<number, string>(42);
		const value = result.mapOrElse(
			() => 0,
			(value) => value * 2,
		);
		assertEquals(value, 84);
	});

	it("returns the default value from a function for an Err result", () => {
		const result = TestErr<number, string>("error");
		const value = result.mapOrElse(
			() => 0,
			(value) => value * 2,
		);
		assertEquals(value, 0);
	});
});

describe("or", () => {
	it("returns the value when Ok or Err", () => {
		const a = TestOk<string, string>("a");
		const b = TestErr<string, string>("b");
		assertEquals(a.or(b).unwrap(), "a");
	});

	it("returns the early value when Ok or Ok", () => {
		const a = TestOk<string, string>("a");
		const b = TestOk<string, string>("b");
		assertEquals(a.or(b).unwrap(), "a");
	});

	it("returns the late value when Err or Ok", () => {
		const a = TestErr<string, string>("a");
		const b = TestOk<string, string>("b");
		assertEquals(a.or(b).unwrap(), "b");
	});

	it("returns the late error when Err and Err", () => {
		const a = TestErr<string, string>("a");
		const b = TestErr<string, string>("b");
		assertEquals(a.or(b).unwrapErr(), "b");
	});
});

describe("orElse", () => {
	it("returns the result for an Ok result", () => {
		const a = TestOk<number, string>(0);
		assertEquals(a.orElse(() => Ok(1)).unwrap(), a.unwrap());
	});

	it("returns the mapped value for an Err result", () => {
		const a = TestErr<number, string>("early error");
		assertEquals(a.orElse(() => Ok(1)).unwrap(), 1);
		assertEquals(a.orElse(() => Err(1)).unwrapErr(), 1);
	});
});

describe("orElseAsync", () => {
	it("returns the result for an Ok result", async () => {
		const a = TestOk<number, string>(0);
		await assertEquals(a.orElseAsync(async () => Ok(1)).unwrap(), 0);
	});

	it("returns the mapped value for an Err result", async () => {
		const a = TestErr<number, string>("early error");
		await assertEquals(a.orElseAsync(async () => Ok(1)).unwrap(), 1);
		await assertEquals(a.orElseAsync(async () => Err(1)).unwrapErr(), 1);
	});
});

describe("unwrap", () => {
	it("returns the value for an Ok result", () => {
		const result = TestOk<number, string>(42);
		assertEquals(result.unwrap(), 42);
	});

	it("returns undefined for an Err result", () => {
		const result = TestErr<number, string>("error");
		assertEquals(result.unwrap(), undefined);
	});
});

describe("unwrapErr", () => {
	it("returns the error for an Err result", () => {
		const result = TestErr<number, string>("error");
		assertEquals(result.unwrapErr(), "error");
	});

	it("returns undefined for an Ok result", () => {
		const result = TestOk<number, string>(42);
		assertEquals(result.unwrapErr(), undefined);
	});
});

describe("unwrapOr", () => {
	it("returns the value for an Ok result", () => {
		const result = TestOk<number, string>(42);
		assertEquals(result.unwrapOr(0), 42);
	});

	it("returns the default value for an Err result", () => {
		const result = TestErr<number, string>("error");
		assertEquals(result.unwrapOr(42), 42);
	});
});

describe("unwrapOrElse", () => {
	it("returns the value for an Ok result", () => {
		const result = TestOk<number, string>(42);
		assertEquals(
			result.unwrapOrElse(() => 0),
			42,
		);
	});

	it("returns the default value from a function for an Err result", () => {
		const result = TestErr<number, string>("error");
		const unwrapped = result.unwrapOrElse(() => 42);
		assertEquals(unwrapped, 42);
	});
});

describe("match", () => {
	it("calls the ok function for an Ok result", () => {
		const result = TestOk<number, string>(42);
		const output = result.match({
			Ok: (value) => value * 2,
			Err: () => 0,
		});
		assertEquals(output, 84);
	});

	it("calls the err function for an Err result", () => {
		const result = TestErr<number, string>("error");
		const output = result.match({
			Ok: (value) => value * 2,
			Err: () => 0,
		});
		assertEquals(output, 0);
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
		assertEquals(result.next().value.unwrap(), 1);
		assertEquals(result.next().value.unwrapErr(), "error");
		assertEquals(result.next().value.unwrap(), 2);
	});
});
