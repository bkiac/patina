import {expect, it} from "vitest";
import {R} from ".";

it("settles a Promise to an Ok result", async () => {
	const promise = Promise.resolve(42);
	const result = await R.try(promise);
	expect(result.ok).toEqual(true);
	expect(result.unwrap()).toEqual(42);
});

it("settles a rejected Promise to an Err result", async () => {
	const error = new Error("Test error");
	const promise = Promise.reject(error);
	const result = await R.try(promise);
	expect(result.ok).toEqual(false);
	expect(result.unwrapErr()).toEqual(error);
});

it("wraps a function call into a Result object", () => {
	const fn = () => 42;
	const result = R.try(fn);
	expect(result.ok).toEqual(true);
	expect(result.unwrap()).toEqual(42);
});

it("wraps a throwing function call into an Err result", () => {
	const error = new Error("Test error");
	const fn = () => {
		throw error;
	};
	const result = R.try(fn);
	expect(result.ok).toEqual(false);
	expect(result.unwrapErr()).toEqual(error);
});

it("wraps an async function call into a Result object", async () => {
	const fn = async () => Promise.resolve(42);
	const result = await R.try(fn);
	expect(result.ok).toEqual(true);
	expect(result.unwrap()).toEqual(42);
});

it("wraps a throwing async function call into an Err result", async () => {
	const error = new Error("Test error");
	const fn = async () => {
		throw error;
		// @ts-expect-error It's supposed to throw
		return Promise.resolve(42);
	};
	const result = await R.try(fn);
	expect(result.ok).toEqual(false);
	expect(result.unwrapErr()).toEqual(error);
});
