// deno-lint-ignore-file require-await
import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { expectTypeOf } from "expect-type";
import { assertSpyCall, assertSpyCalls, spy } from "@std/testing/mock";
import { None, Option, Some } from "../src/option.ts";
import { Panic } from "../src/error.ts";

function TestSome<T>(value: T): Option<T> {
	return Some(value) as Option<T>;
}

function TestNone<T>(): Option<T> {
	return None as Option<T>;
}

describe("core", () => {
	it("returns a Some option", () => {
		const option = Some(42);
		expect(option.isSome()).toEqual(true);
		expect(option.isNone()).toEqual(false);
		expect(option.value()).toEqual(42);
		expectTypeOf(option.value).toEqualTypeOf<() => number>();
		expectTypeOf(option.unwrap).toEqualTypeOf<() => number>();
	});

	it("returns a None option", () => {
		const option = None;
		expect(option.isSome()).toEqual(false);
		expect(option.isNone()).toEqual(true);
		expectTypeOf(option.value).toEqualTypeOf<() => undefined>();
		expectTypeOf(option.unwrap).toEqualTypeOf<() => null>();
		expectTypeOf(option.expect).toEqualTypeOf<(msg: string) => never>();
	});

	it("works with discriminated union", () => {
		const option = TestSome(42);
		expectTypeOf(option.value()).toEqualTypeOf<number | undefined>();
		if (option.isSome()) {
			expectTypeOf(option.value).toEqualTypeOf<() => number>();
			expectTypeOf(option.unwrap).toEqualTypeOf<() => number>();
			expectTypeOf(option.expect).toEqualTypeOf<(msg: string) => number>();
		} else {
			expectTypeOf(option.value).toEqualTypeOf<() => undefined>();
			expectTypeOf(option.unwrap).toEqualTypeOf<() => null>();
			expectTypeOf(option.expect).toEqualTypeOf<(msg: string) => never>();
		}

		if (option.isNone()) {
			expectTypeOf(option.value).toEqualTypeOf<() => undefined>();
			expectTypeOf(option.unwrap).toEqualTypeOf<() => null>();
			expectTypeOf(option.expect).toEqualTypeOf<(msg: string) => never>();
		} else {
			expectTypeOf(option.value).toEqualTypeOf<() => number>();
			expectTypeOf(option.unwrap).toEqualTypeOf<() => number>();
			expectTypeOf(option.expect).toEqualTypeOf<(msg: string) => number>();
		}
	});
});

describe("okOr", () => {
	it("returns the value when called on a Some option", () => {
		const option = TestSome(42);
		expect(option.okOr("error").unwrapUnchecked()).toEqual(42);
	});

	it("returns the error value when called on a None option", () => {
		const option = TestNone<string>();
		expect(option.okOr("error").unwrapErrUnchecked()).toEqual("error");
	});
});

describe("okOrElse", () => {
	it("returns the value when called on a Some option", () => {
		const option = TestSome(42);
		expect(option.okOrElse(() => "error").unwrapUnchecked()).toEqual(42);
	});

	it("returns the error value when called on a None option", () => {
		const option = TestNone<string>();
		expect(option.okOrElse(() => "error").unwrapErrUnchecked()).toEqual("error");
	});
});

describe("okOrElseAsync", () => {
	it("returns the value when called on a Some option", async () => {
		const option = TestSome(42);
		await expect(option.okOrElseAsync(async () => "error").unwrap()).resolves.toEqual(42);
	});

	it("returns the error value when called on a None option", async () => {
		const option = TestNone<string>();
		await expect(option.okOrElseAsync(async () => "error").unwrapErr()).resolves.toEqual(
			"error",
		);
	});
});

describe("and", () => {
	it("returns the other option when Some and None", () => {
		const a = TestSome(2);
		const b = TestNone<string>();
		expect(a.and(b)).toEqual(b);
	});

	it("returns the other option when Some and Some", () => {
		const a = TestSome(2);
		const b = TestSome("str");
		expect(a.and(b)).toEqual(b);
	});

	it("returns None when None and Some", () => {
		const a = TestNone<string>();
		const b = TestSome("foo");
		expect(a.and(b)).toEqual(a);
	});

	it("returns None when None and None", () => {
		const a = TestNone<string>();
		const b = TestNone<string>();
		expect(a.and(b)).toEqual(a);
	});
});

describe("andThen", () => {
	it("returns the mapped value for a Some option", () => {
		const a = TestSome(0);
		expect(a.andThen((value) => TestSome(value + 1))).toEqual(Some(1));
	});

	it("returns None for a None option", () => {
		const a = TestNone<string>();
		expect(a.andThen((value) => Some(value + 1))).toEqual(a);
	});
});

describe("andThenAsync", () => {
	it("returns the mapped value for a Some option", async () => {
		const a = TestSome(0);
		await expect(a.andThenAsync(async (value) => Some(value + 1))).resolves.toEqual(Some(1));
	});

	it("returns None for a None option", async () => {
		const a = TestNone<number>();
		await expect(a.andThenAsync(async (value) => Some(value + 1))).resolves.toEqual(None);
	});

	it("can chain multiple async operations", async () => {
		const a = TestSome(1);
		await expect(
			a
				.andThenAsync(async (value) => Some(value + 1))
				.andThenAsync(async (value) => Some(value * 2)),
		).resolves.toEqual(Some(4));
	});
});

describe("expect", () => {
	it("returns the value when called on a Some option", () => {
		const option = TestSome(42);
		expect(option.expect("error")).toEqual(42);
	});

	it("throws when called on a None option", () => {
		const option = TestNone<string>();
		expect(() => option.expect("error")).toThrow(Panic);
		expect(() => option.expect("error")).toThrow("error");
	});
});

describe("filter", () => {
	it("returns the option when the predicate returns true", () => {
		const option = Some(42);
		expect(option.filter((value) => value === 42)).toEqual(option);
	});

	it("returns None when the predicate returns false", () => {
		const option = TestSome(42);
		expect(option.filter((value) => value !== 42)).toEqual(None);
	});

	it("returns None when called on a None option", () => {
		const option = TestNone<string>();
		expect(option.filter((value) => value === "hello")).toEqual(option);
	});
});

describe("filterAsync", () => {
	it("returns the option when the predicate returns true", async () => {
		const option = TestSome(42);
		await expect(option.filterAsync(async (value) => value === 42)).resolves.toEqual(option);
	});

	it("returns None when the predicate returns false", async () => {
		const option = TestSome(42);
		await expect(option.filterAsync(async (value) => value !== 42)).resolves.toEqual(None);
	});

	it("returns None when called on a None option", async () => {
		const option = TestNone<string>();
		await expect(option.filterAsync(async (value) => value === "hello")).resolves.toEqual(
			option,
		);
	});
});

describe("flatten", () => {
	it("returns the inner option when called on a Some option", () => {
		const inner = TestSome(42);
		const option = TestSome(inner);
		expect(option.flatten()).toEqual(inner);
	});

	it("returns None when called on a None option", () => {
		const option = TestNone<Option<string>>();
		expect(option.flatten()).toEqual(option);
	});
});

describe("inspect", () => {
	it("calls the function with the value when called on a Some option", () => {
		const option = TestSome(42);
		const callback = spy((_value: number) => {});
		expect(option.inspect(callback)).toEqual(option);
		assertSpyCall(callback, 0, { args: [42] });
	});

	it("does not call the function when called on a None option", () => {
		const option = TestNone<string>();
		const callback = spy((_value: string) => {});
		expect(option.inspect(callback)).toEqual(option);
		assertSpyCalls(callback, 0);
	});
});

describe("inspectAsync", () => {
	it("calls the function with the value when called on a Some option", async () => {
		const option = TestSome(42);
		const callback = spy((_value: number) => {});
		await expect(option.inspectAsync(async (value) => callback(value))).resolves.toEqual(
			option,
		);
		assertSpyCall(callback, 0, { args: [42] });
	});

	it("does not call the function when called on a None option", async () => {
		const option = TestNone<string>();
		const callback = spy((_value: string) => {});
		await expect(option.inspectAsync(async (value) => callback(value))).resolves.toEqual(
			option,
		);
		assertSpyCalls(callback, 0);
	});
});

describe("map", () => {
	it("returns the mapped value for a Some option", () => {
		const option = TestSome(42);
		expect(option.map((value) => value + 1)).toEqual(Some(43));
	});

	it("returns None for a None option", () => {
		const option = TestNone<string>();
		expect(option.map((value) => value + 1)).toEqual(option);
	});
});

describe("mapAsync", () => {
	it("returns the mapped value for a Some option", async () => {
		const option = TestSome(42);
		await expect(option.mapAsync(async (value) => value + 1)).resolves.toEqual(Some(43));
	});

	it("returns None for a None option", async () => {
		const option = TestNone<string>();
		await expect(option.mapAsync(async (value) => value + 1)).resolves.toEqual(option);
	});

	it("can chain multiple async operations", async () => {
		const option = TestSome(1);
		await expect(
			option.mapAsync(async (value) => value + 1).mapAsync(async (value) => value * 2),
		).resolves.toEqual(Some(4));
	});
});

describe("mapOr", () => {
	it("returns the mapped value for a Some option", () => {
		const option = TestSome(42);
		expect(option.mapOr("default", (value) => value + 1)).toEqual(43);
	});

	it("returns the default value for a None option", () => {
		const option = TestNone<string>();
		expect(option.mapOr("default", (value) => value + 1)).toEqual("default");
	});
});

describe("mapOrAsync", () => {
	it("returns the mapped value for a Some option", async () => {
		const option = TestSome(42);
		await expect(option.mapOrAsync("default", async (value) => value + 1)).resolves.toEqual(43);
	});

	it("returns the default value for a None option", async () => {
		const option = TestNone<string>();
		await expect(option.mapOrAsync("default", async (value) => value + 1)).resolves.toEqual(
			"default",
		);
	});
});

describe("mapOrElse", () => {
	it("returns the mapped value for a Some option", () => {
		const option = TestSome(42);
		expect(
			option.mapOrElse(
				() => "default",
				(value) => value + 1,
			),
		).toEqual(43);
	});

	it("returns the default value for a None option", () => {
		const option = TestNone<string>();
		expect(
			option.mapOrElse(
				() => "default",
				(value) => value + 1,
			),
		).toEqual("default");
	});
});

describe("mapOrElseAsync", () => {
	it("returns the mapped value for a Some option", async () => {
		const option = TestSome(42);
		await expect(
			option.mapOrElseAsync(
				async () => "default",
				async (value) => value + 1,
			),
		).resolves.toEqual(43);
	});

	it("returns the default value for a None option", async () => {
		const option = TestNone<string>();
		await expect(
			option.mapOrElseAsync(
				async () => "default",
				async (value) => value + 1,
			),
		).resolves.toEqual("default");
	});
});

describe("or", () => {
	it("returns the original option when Some and None", () => {
		const a = TestSome(2);
		const b = TestNone<string>();
		expect(a.or(b)).toEqual(a);
	});

	it("returns the original option when Some and Some", () => {
		const a = TestSome(2);
		const b = TestSome("str");
		expect(a.or(b)).toEqual(a);
	});

	it("returns the other option when None and Some", () => {
		const a = TestNone<string>();
		const b = TestSome("foo");
		expect(a.or(b)).toEqual(b);
	});

	it("returns None when None and None", () => {
		const a = TestNone<string>();
		const b = TestNone<string>();
		expect(a.or(b)).toEqual(a);
	});
});

describe("orElse", () => {
	it("returns the original option for a Some option", () => {
		const a = TestSome(0);
		expect(a.orElse(() => Some(1))).toEqual(a);
	});

	it("returns the result of the function for a None option", () => {
		const a = TestNone<string>();
		expect(a.orElse(() => Some(1))).toEqual(Some(1));
	});
});

describe("orElseAsync", () => {
	it("returns the original option for a Some option", async () => {
		const a = TestSome(1);
		await expect(a.orElseAsync(async () => Some(2)).unwrap()).resolves.toEqual(1);
	});

	it("returns the result of the function for a None option", async () => {
		const a = TestNone<string>();
		await expect(a.orElseAsync(async () => Some(2)).unwrap()).resolves.toEqual(2);
	});

	it("can chain multiple async operations", async () => {
		const a = TestNone<string>();
		await expect(
			a
				.orElseAsync(async () => Some(1))
				.orElseAsync(async () => Some(2))
				.unwrap(),
		).resolves.toEqual(1);
	});
});

describe("unwrap", () => {
	it("returns the value when called on a Some option", () => {
		const option = TestSome(42);
		expect(option.unwrap()).toEqual(42);
	});

	it("returns null when called on a None option", () => {
		const option = TestNone<string>();
		expect(option.unwrap()).toEqual(null);
	});
});

describe("unwrapOr", () => {
	it("returns the value when called on a Some option", () => {
		const option = TestSome(42);
		expect(option.unwrapOr("default")).toEqual(42);
	});

	it("returns the default value when called on a None option", () => {
		const option = TestNone<string>();
		expect(option.unwrapOr("default")).toEqual("default");
	});
});

describe("unwrapOrElse", () => {
	it("returns the value when called on a Some option", () => {
		const option = TestSome(42);
		expect(option.unwrapOrElse(() => "default")).toEqual(42);
	});

	it("returns the default value when called on a None option", () => {
		const option = TestNone<string>();
		expect(option.unwrapOrElse(() => "default")).toEqual("default");
	});
});

describe("unwrapOrElseAsync", () => {
	it("returns the value when called on a Some option", async () => {
		const option = TestSome(42);
		await expect(option.unwrapOrElseAsync(async () => "default")).resolves.toEqual(42);
	});

	it("returns the default value when called on a None option", async () => {
		const option = TestNone<string>();
		await expect(option.unwrapOrElseAsync(async () => "default")).resolves.toEqual("default");
	});
});

describe("xor", () => {
	it("returns Some when Some and None", () => {
		const a = TestSome(2);
		const b = TestNone<string>();
		expect(a.xor(b)).toEqual(a);
	});

	it("returns Some when None and Some", () => {
		const a = TestNone<string>();
		const b = TestSome("foo");
		expect(a.xor(b)).toEqual(b);
	});

	it("returns None when None and None", () => {
		const a = TestNone<string>();
		const b = TestNone<string>();
		expect(a.xor(b)).toEqual(a);
	});

	it("returns None when Some and Some", () => {
		const a = TestSome(2);
		const b = TestSome("str");
		expect(a.xor(b)).toEqual(None);
	});
});

describe("match", () => {
	it("returns the result of the some callback when called on a Some option", () => {
		const option = TestSome(42);
		expect(
			option.match({
				Some: (value) => value + 1,
				None: () => "default",
			}),
		).toEqual(43);
	});

	it("returns the result of the none callback when called on a None option", () => {
		const option = TestNone<string>();
		expect(
			option.match({
				Some: (value) => value + 1,
				None: () => "default",
			}),
		).toEqual("default");
	});
});

describe("Option.fromNullish", () => {
	it("returns Some when the value is not null or undefined", () => {
		const value = "hello" as string | number | null;
		const option = Option.fromNullish(value);
		expectTypeOf(option).toEqualTypeOf<Option<string | number>>();
		expect(option).toEqual(Some(value));
	});

	it("returns Some when the value is falsy", () => {
		expect(Option.fromNullish(false)).toEqual(Some(false));
		expect(Option.fromNullish(0)).toEqual(Some(0));
		expect(Option.fromNullish("")).toEqual(Some(""));
	});

	it("returns None when the value is null or undefined", () => {
		expect(Option.fromNullish(null)).toEqual(None);
		expect(Option.fromNullish(undefined)).toEqual(None);
	});
});
