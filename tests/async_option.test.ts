// deno-lint-ignore-file require-await
import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { assertSpyCall, assertSpyCalls, spy } from "@std/testing/mock";
import { None, Some } from "../src/option.ts";
import { AsyncOption } from "../src/async_option.ts";
import { Panic } from "../src/error.ts";

function promiseSome<T>(value: T) {
	return new AsyncOption<T>(Promise.resolve(Some<T>(value)));
}

function promiseNone() {
	return new AsyncOption<never>(Promise.resolve(None));
}

describe("okOr", () => {
	it("returns the option when Some", async () => {
		const option = promiseSome(42);
		const err = "error";
		await expect(option.okOr(err).unwrap()).resolves.toEqual(42);
	});

	it("returns the error when None", async () => {
		const option = promiseNone();
		const err = "error";
		await expect(option.okOr(err).unwrapErr()).resolves.toEqual(err);
	});
});

describe("okOrElse", () => {
	it("returns the option when Some", async () => {
		const option = promiseSome(42);
		const err = "error";
		await expect(option.okOrElse(() => err).unwrap()).resolves.toEqual(42);
	});

	it("returns the error when None", async () => {
		const option = promiseNone();
		const err = "error";
		await expect(option.okOrElse(() => err).unwrapErr()).resolves.toEqual(err);
	});
});

describe("and", () => {
	it("returns the other option when Some and None", async () => {
		const a = promiseSome(2);
		const b = promiseNone();
		await expect(a.and(b).unwrapOr(0)).resolves.toEqual(0);
	});

	it("returns the other option when Some and Some", async () => {
		const a = promiseSome(2);
		const b = promiseSome("str");
		await expect(a.and(b).unwrap()).resolves.toEqual("str");
	});

	it("returns None when None and Some", async () => {
		const a = promiseNone();
		const b = promiseSome("foo");
		await expect(a.and(b).unwrapOr(0)).resolves.toEqual(0);
	});

	it("returns None when None and None", async () => {
		const a = promiseNone();
		const b = promiseNone();
		await expect(a.and(b).unwrapOr(0)).resolves.toEqual(0);
	});
});

describe("andThen", () => {
	it("returns the mapped value for a Some option", async () => {
		const a = promiseSome(0);
		await expect(a.andThen((value) => Some(value + 1)).unwrap()).resolves.toEqual(1);
	});

	it("returns None for a None option", async () => {
		const a = promiseNone();
		await expect(a.andThen((value) => Some(value + 1)).unwrapOr(0)).resolves.toEqual(0);
	});
});

describe("andThenAsync", () => {
	it("returns the mapped value for a Some option", async () => {
		const a = promiseSome(0);
		await expect(a.andThenAsync(async (value) => Some(value + 1)).unwrap()).resolves.toEqual(1);
	});

	it("returns None for a None option", async () => {
		const a = promiseNone();
		await expect(a.andThenAsync(async (value) => Some(value + 1)).unwrapOr(0)).resolves.toEqual(
			0,
		);
	});

	it("can chain multiple async operations", async () => {
		const a = promiseSome(1);
		await expect(
			a
				.andThenAsync(async (value) => Some(value + 1))
				.andThenAsync(async (value) => Some(value * 2))
				.unwrap(),
		).resolves.toEqual(4);
	});
});

describe("expect", () => {
	it("returns the value when called on a Some option", async () => {
		const option = promiseSome(42);
		await expect(option.expect("error")).resolves.toEqual(42);
	});

	it("throws Panic when called on a None option", async () => {
		const option = promiseNone();
		await expect(option.expect("msg")).rejects.toEqual(new Panic("msg"));
	});
});

describe("filter", () => {
	it("returns the option when the predicate returns true", async () => {
		const option = promiseSome(42);
		await expect(option.filter((value) => value === 42).unwrap()).resolves.toEqual(42);
	});

	it("returns None when the predicate returns false", async () => {
		const option = promiseSome(42);
		await expect(option.filter((value) => value !== 42)).resolves.toEqual(None);
	});
});

describe("filterAsync", () => {
	it("returns the option when the predicate returns true", async () => {
		const option = promiseSome(42);
		await expect(option.filterAsync(async (value) => value === 42).unwrap()).resolves.toEqual(
			42,
		);
	});

	it("returns None when the predicate returns false", async () => {
		const option = promiseSome(42);
		await expect(option.filterAsync(async (value) => value !== 42)).resolves.toEqual(None);
	});

	it("returns None for a None option", async () => {
		const option = promiseNone();
		await expect(option.filterAsync(async (_value) => true)).resolves.toEqual(None);
	});
});

describe("flatten", () => {
	it("returns the inner option for a Some option", async () => {
		const option = promiseSome(Some(42));
		await expect(option.flatten()).resolves.toEqual(Some(42));
	});

	it("returns None for a None option", async () => {
		const option = promiseNone();
		await expect(option.flatten()).resolves.toEqual(None);
	});
});

describe("inspect", () => {
	it("calls the function when called on a Some option", async () => {
		const option = promiseSome(42);
		const fn = spy((_value: number) => {});
		await option.inspect(fn);
		assertSpyCall(fn, 0, { args: [42] });
	});

	it("does not call the function when called on a None option", async () => {
		const option = promiseNone();
		const fn = spy((_value: number) => {});
		await option.inspect(fn);
		assertSpyCalls(fn, 0);
	});
});

describe("map", () => {
	it("returns the mapped value for a Some option", async () => {
		const option = promiseSome(42);
		await expect(option.map((value) => value + 1)).resolves.toEqual(Some(43));
	});

	it("returns None for a None option", async () => {
		const option = promiseNone();
		await expect(option.map((value) => value + 1)).resolves.toEqual(None);
	});
});

describe("mapAsync", () => {
	it("returns the mapped value for a Some option", async () => {
		const option = promiseSome(42);
		await expect(option.mapAsync(async (value) => value + 1)).resolves.toEqual(Some(43));
	});

	it("returns None for a None option", async () => {
		const option = promiseNone();
		await expect(option.mapAsync(async (value) => value + 1)).resolves.toEqual(None);
	});

	it("can chain multiple async operations", async () => {
		const option = promiseSome(1);
		await expect(
			option.mapAsync(async (value) => value + 1).mapAsync(async (value) => value * 2),
		).resolves.toEqual(Some(4));
	});
});

describe("mapOr", () => {
	it("returns the mapped value for a Some option", async () => {
		const option = promiseSome(42);
		await expect(option.mapOr("default", (value) => value + 1)).resolves.toEqual(43);
	});

	it("returns the default value for a None option", async () => {
		const option = promiseNone();
		await expect(option.mapOr("default", (value) => value + 1)).resolves.toEqual("default");
	});
});

describe("mapOrElse", () => {
	it("returns the mapped value for a Some option", async () => {
		const option = promiseSome(42);
		await expect(
			option.mapOrElse(
				() => "default",
				(value) => value + 1,
			),
		).resolves.toEqual(43);
	});

	it("returns the default value for a None option", async () => {
		const option = promiseNone();
		await expect(
			option.mapOrElse(
				() => "default",
				(value) => value + 1,
			),
		).resolves.toEqual("default");
	});
});

describe("mapOrElseAsync", () => {
	it("returns the mapped value for a Some option", async () => {
		const option = promiseSome(42);
		await expect(
			option.mapOrElseAsync(
				async () => "default",
				async (value) => value + 1,
			),
		).resolves.toEqual(43);
	});

	it("returns the default value for a None option", async () => {
		const option = promiseNone();
		await expect(
			option.mapOrElseAsync(
				async () => "default",
				async (value) => value + 1,
			),
		).resolves.toEqual("default");
	});
});

describe("or", () => {
	it("returns the option when Some and None", () => {
		const a = promiseSome(2);
		const b = promiseNone();
		expect(a.or(b)).toEqual(a);
	});

	it("returns the option when Some and Some", () => {
		const a = promiseSome(2);
		const b = promiseSome("str");
		expect(a.or(b)).toEqual(a);
	});

	it("returns None when None and Some", () => {
		const a = promiseNone();
		const b = promiseSome("foo");
		expect(a.or(b)).toEqual(b);
	});

	it("returns None when None and None", () => {
		const a = promiseNone();
		const b = promiseNone();
		expect(a.or(b)).toEqual(a);
	});
});

describe("orElse", () => {
	it("returns the result for a Some option", () => {
		const a = promiseSome(1);
		expect(a.orElse(() => Some(1))).toEqual(a);
	});

	it("returns the mapped value for a None option", () => {
		const a = promiseNone();
		expect(a.orElse(() => Some(1))).toEqual(promiseNone());
	});
});

describe("orElseAsync", () => {
	it("returns the result for a Some option", async () => {
		const a = promiseSome(1);
		await expect(a.orElseAsync(async () => Some(2)).unwrap()).resolves.toEqual(1);
	});

	it("returns the mapped value for a None option", async () => {
		const a = promiseNone();
		await expect(a.orElseAsync(async () => Some(2)).unwrap()).resolves.toEqual(2);
	});

	it("can chain multiple async operations", async () => {
		const a = promiseNone();
		await expect(
			a
				.orElseAsync(async () => Some(1))
				.orElseAsync(async () => Some(2))
				.unwrap(),
		).resolves.toEqual(1);
	});
});

describe("unwrap", () => {
	it("returns the value when called on a Some option", async () => {
		const option = promiseSome(42);
		await expect(option.unwrap()).resolves.toEqual(42);
	});

	it("returns undefined when called on a None option", async () => {
		const option = promiseNone();
		await expect(option.unwrap()).resolves.toEqual(undefined);
	});
});

describe("unwrapOr", () => {
	it("returns the value when called on a Some option", async () => {
		const option = promiseSome(42);
		await expect(option.unwrapOr("default")).resolves.toEqual(42);
	});

	it("returns the default value when called on a None option", async () => {
		const option = promiseNone();
		await expect(option.unwrapOr("default")).resolves.toEqual("default");
	});
});

describe("unwrapOrElse", () => {
	it("returns the value when called on a Some option", async () => {
		const option = promiseSome(42);
		await expect(option.unwrapOrElse(() => "default")).resolves.toEqual(42);
	});

	it("returns the default value when called on a None option", async () => {
		const option = promiseNone();
		await expect(option.unwrapOrElse(() => "default")).resolves.toEqual("default");
	});
});

describe("unwrapOrElseAsync", () => {
	it("returns the value when called on a Some option", async () => {
		const option = promiseSome(42);
		await expect(option.unwrapOrElseAsync(async () => "default")).resolves.toEqual(42);
	});

	it("returns the default value when called on a None option", async () => {
		const option = promiseNone();
		await expect(option.unwrapOrElseAsync(async () => "default")).resolves.toEqual("default");
	});
});

describe("xor", () => {
	it("returns Some when Some and None", async () => {
		const a = promiseSome(2);
		const b = promiseNone();
		expect(a.xor(b)).toEqual(a);
	});

	it("returns Some when None and Some", async () => {
		const a = promiseNone();
		const b = promiseSome("foo");
		expect(a.xor(b)).toEqual(b);
	});

	it("returns None when None and None", async () => {
		const a = promiseNone();
		const b = promiseNone();
		expect(a.xor(b)).toEqual(a);
	});

	it("returns None when Some and Some", async () => {
		const a = promiseSome(2);
		const b = promiseSome("str");
		expect(a.xor(b)).toEqual(a);
	});
});

describe("match", () => {
	it("returns the mapped value for a Some option", async () => {
		const option = promiseSome(42);
		await expect(
			option.match({
				Some: (value) => value + 1,
				None: () => "none",
			}),
		).resolves.toEqual(43);
	});

	it("returns the mapped value for a None option", async () => {
		const option = promiseNone();
		await expect(
			option.match({
				Some: (value) => value + 1,
				None: () => "none",
			}),
		).resolves.toEqual("none");
	});
});
