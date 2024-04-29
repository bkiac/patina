import {describe, expect, it} from "vitest";
import {Result} from "../src";

describe.concurrent("from", () => {
	it("wraps a function call into a Result object", () => {
		const fn = () => 42;
		const result = Result.from(fn);
		expect(result.unwrap()).toEqual(42);
	});

	it("wraps a throwing function call into an Err result", () => {
		const error = new Error("Test error");
		const fn = () => {
			throw error;
		};
		const result = Result.from(fn);
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
});
