// deno-lint-ignore-file require-await
import { describe, it } from "@std/testing/bdd";
import { expectTypeOf } from "expect-type";
import { expect } from "@std/expect";
import { catchUnwind, catchUnwindAsync } from "./unwind.ts";
import { Result } from "./result.ts";
import { Panic } from "./error.ts";
import { ResultAsync } from "./result_async.ts";

const UNEXPECTED_ERROR_MESSAGE = "Unexpected error type";

describe("catchUnwind", () => {
	it("returns Ok result when function succeeds", () => {
		const result = catchUnwind(() => 42);
		expectTypeOf(result).toEqualTypeOf<Result<number, Error>>();
		expect(result.unwrap()).toEqual(42);
	});

	it("catches regular Error and returns it as-is in Err result", () => {
		const error = new Error("test error");
		const result = catchUnwind(() => {
			throw error;
		});
		expect(result.unwrapErr()).toBe(error);
	});

	it("converts Panic to Error while preserving message and cause", () => {
		const panic = new Panic("test panic", { cause: "panic cause" });
		const result = catchUnwind(() => {
			throw panic;
		});
		const err = result.unwrapErr();
		expect(err).toBeInstanceOf(Error);
		expect(err?.message).toEqual("test panic");
		expect((err as Error & { cause?: unknown }).cause).toBe(panic);
	});

	it("wraps non-Error thrown values in Error", () => {
		const result = catchUnwind(() => {
			throw "string error";
		});
		const err = result.unwrapErr();
		expect(err).toBeInstanceOf(Error);
		expect(err?.message).toContain(UNEXPECTED_ERROR_MESSAGE);
		expect((err as Error & { cause?: unknown }).cause).toEqual("string error");
	});
});

describe("catchUnwindAsync", () => {
	it("returns Ok result when async function succeeds", async () => {
		const result = catchUnwindAsync(async () => 42);
		expectTypeOf(result).toEqualTypeOf<ResultAsync<number, Error>>();
		await expect(result.unwrap()).resolves.toEqual(42);
	});

	it("catches regular Error and returns it as-is in Err result", async () => {
		const error = new Error("test error");
		const result = catchUnwindAsync(async () => {
			throw error;
		});
		const err = await result.unwrapErr();
		expect(err).toBe(error);
	});

	it("converts Panic to Error while preserving message and cause", async () => {
		const panic = new Panic("test panic", { cause: "panic cause" });
		const result = await catchUnwindAsync(async () => {
			throw panic;
		});
		const err = result.unwrapErr();
		expect(err).toBeInstanceOf(Error);
		expect(err?.message).toEqual("test panic");
		expect((err as Error & { cause?: unknown }).cause).toBe(panic);
	});

	it("wraps non-Error thrown values in Error", async () => {
		const result = catchUnwindAsync(async () => {
			throw "string error";
		});
		const err = await result.unwrapErr();
		expect(err).toBeInstanceOf(Error);
		expect(err?.message).toContain(UNEXPECTED_ERROR_MESSAGE);
		expect((err as Error & { cause?: unknown }).cause).toEqual("string error");
	});

	it("catches errors from rejected promises", async () => {
		const error = new Error("promise rejection");
		const result = catchUnwindAsync(() => Promise.reject(error));
		const err = await result.unwrapErr();
		expect(err).toBe(error);
	});

	it("catches non-Error rejections and wraps them", async () => {
		const result = catchUnwindAsync(() => Promise.reject("string rejection"));
		const err = await result.unwrapErr();
		expect(err).toBeInstanceOf(Error);
		expect(err?.message).toContain(UNEXPECTED_ERROR_MESSAGE);
		expect((err as Error & { cause?: unknown }).cause).toEqual("string rejection");
	});

	it("catches Panic rejections and converts them to Error", async () => {
		const panic = new Panic("panic rejection", { cause: "panic cause" });
		const result = catchUnwindAsync(() => Promise.reject(panic));
		const err = await result.unwrapErr();
		expect(err).toBeInstanceOf(Error);
		expect(err?.message).toEqual("panic rejection");
		expect((err as Error & { cause?: unknown }).cause).toBe(panic);
	});
});
