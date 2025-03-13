import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { expectTypeOf } from "expect-type";
import { Err, Ok } from "../src/result.ts";
import { None, Some } from "../src/option.ts";
import { ResultAsync } from "../src/result_async.ts";
import { OptionAsync } from "../src/option_async.ts";
import {
	type InferErr,
	type InferOk,
	type InferSome,
	isOption,
	isOptionAsync,
	isResult,
	isResultAsync,
} from "../src/util.ts";

describe("InferOk", () => {
	it("infers Ok type from Result", () => {
		type TestOk1 = InferOk<Ok<number, string>>;
		expectTypeOf<TestOk1>().toEqualTypeOf<number>();

		type TestOk2 = InferOk<Ok<number, any>>;
		expectTypeOf<TestOk2>().toEqualTypeOf<number>();

		type TestOk3 = InferOk<Ok<number, unknown>>;
		expectTypeOf<TestOk3>().toEqualTypeOf<number>();

		type TestOk4 = InferOk<Ok<number, never>>;
		expectTypeOf<TestOk4>().toEqualTypeOf<number>();

		// Should be never for Err
		type TestErr = InferOk<Err<string, number>>;
		expectTypeOf<TestErr>().toEqualTypeOf<never>();
	});
});

describe("InferErr", () => {
	it("infers Err type from Result", () => {
		type TestErr1 = InferErr<Err<string, number>>;
		expectTypeOf<TestErr1>().toEqualTypeOf<string>();

		type TestErr2 = InferErr<Err<string, any>>;
		expectTypeOf<TestErr2>().toEqualTypeOf<string>();

		type TestErr3 = InferErr<Err<string, unknown>>;
		expectTypeOf<TestErr3>().toEqualTypeOf<string>();

		type TestErr4 = InferErr<Err<string, never>>;
		expectTypeOf<TestErr4>().toEqualTypeOf<string>();

		// Should be never for Ok
		type TestOk = InferErr<Ok<number, string>>;
		expectTypeOf<TestOk>().toEqualTypeOf<never>();
	});
});

describe("InferSome", () => {
	it("infers Some type from Option", () => {
		type TestOption = InferSome<Some<number>>;
		expectTypeOf<TestOption>().toEqualTypeOf<number>();

		// Should handle None case
		type TestNone = InferSome<None>;
		expectTypeOf<TestNone>().toEqualTypeOf<never>();
	});
});

describe("isResult", () => {
	it("identifies Ok values as Results", () => {
		const ok = Ok(42);
		expect(isResult(ok)).toBe(true);
	});

	it("identifies Err values as Results", () => {
		const err = Err("error");
		expect(isResult(err)).toBe(true);
	});

	it("rejects non-Result values", () => {
		expect(isResult(42)).toBe(false);
		expect(isResult("string")).toBe(false);
		expect(isResult(null)).toBe(false);
		expect(isResult(undefined)).toBe(false);
		expect(isResult({})).toBe(false);
	});
});

describe("isResultAsync", () => {
	it("identifies ResultAsync values", () => {
		const ResultAsync = new ResultAsync(Promise.resolve(Ok(42)));
		expect(isResultAsync(ResultAsync)).toBe(true);
	});

	it("rejects non-ResultAsync values", () => {
		expect(isResultAsync(Ok(42))).toBe(false);
		expect(isResultAsync(Promise.resolve(Ok(42)))).toBe(false);
		expect(isResultAsync(42)).toBe(false);
		expect(isResultAsync(null)).toBe(false);
	});
});

describe("isOption", () => {
	it("identifies Some values as Options", () => {
		const some = Some(42);
		expect(isOption(some)).toBe(true);
	});

	it("identifies None as Option", () => {
		expect(isOption(None)).toBe(true);
	});

	it("rejects non-Option values", () => {
		expect(isOption(42)).toBe(false);
		expect(isOption("string")).toBe(false);
		expect(isOption(null)).toBe(false);
		expect(isOption(undefined)).toBe(false);
		expect(isOption({})).toBe(false);
	});
});

describe("isOptionAsync", () => {
	it("identifies OptionAsync values", () => {
		const OptionAsync = new OptionAsync(Promise.resolve(Some(42)));
		expect(isOptionAsync(OptionAsync)).toBe(true);
	});

	it("rejects non-OptionAsync values", () => {
		expect(isOptionAsync(Some(42))).toBe(false);
		expect(isOptionAsync(Promise.resolve(Some(42)))).toBe(false);
		expect(isOptionAsync(42)).toBe(false);
		expect(isOptionAsync(null)).toBe(false);
	});
});
