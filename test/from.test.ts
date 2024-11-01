import { describe, expect, it } from "vitest";
import { Result } from "../src/result";

describe.concurrent("fromThrowable", () => {
	it("wraps a function call into a Result object", () => {
		const fn = () => 42;
		const result = Result.fromThrowable(fn);
		expect(result.unwrap()).toEqual(42);
	});

	it("wraps a throwing function call into an Err result", () => {
		const error = new Error("Test error");
		const fn = () => {
			throw error;
		};
		const result = Result.fromThrowable(fn);
		expect(result.unwrapErr()).toEqual(error);
	});
});

describe.concurrent("fromPromise", () => {
	it("settles a Promise to an Ok result", async () => {
		const promise = Promise.resolve(42);
		const result = await Result.fromPromise(promise);
		expect(result.unwrap()).toEqual(42);
	});

	it("settles a rejected Promise to an Err result", async () => {
		const error = new Error("Test error");
		const promise = Promise.reject(error);
		const result = await Result.fromPromise(promise);
		expect(result.unwrapErr()).toEqual(error);
	});

	it("settles a synchronous error from an async function into an Err result", async () => {
		const error = new Error("Test error");
		async function fn() {
			throw error;
		}
		const result = await Result.fromPromise(fn());
		expect(result.unwrapErr()).toEqual(error);
	});

	it("can not settle a synchronous error from a function that returns a Promise", async () => {
		const error = new Error("Test error");
		function fn(): Promise<number> {
			throw error;
		}
		expect(async () => await Result.fromPromise(fn())).rejects.toThrow(error);
	});
});

describe.concurrent("fromThrowableAsync", () => {
	it("settles a Promise to an Ok result", async () => {
		const promise = Promise.resolve(42);
		const result = await Result.fromThrowableAsync(() => promise);
		expect(result.unwrap()).toEqual(42);
	});

	it("settles a rejected Promise to an Err result", async () => {
		const error = new Error("Test error");
		const promise = Promise.reject(error);
		const result = await Result.fromThrowableAsync(() => promise);
		expect(result.unwrapErr()).toEqual(error);
	});

	it("settles a synchronous error from an async function that returns a Promise into an Err result", async () => {
		const error = new Error("Test error");
		async function fn(): Promise<number> {
			throw error;
		}
		const result = await Result.fromThrowableAsync(fn);
		expect(result.unwrapErr()).toEqual(error);
	});

	it("settles a synchronous error from an sync function that returns a Promise into an Err result", async () => {
		const error = new Error("Test error");
		function fn(): Promise<number> {
			throw error;
		}
		const result = await Result.fromThrowableAsync(fn);
		expect(result.unwrapErr()).toEqual(error);
	});
});
