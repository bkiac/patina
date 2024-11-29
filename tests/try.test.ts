import { describe, test } from "@std/testing/bdd";
import { expectTypeOf } from "expect-type";
import { expect } from "@std/expect";
import {
	AsyncErr,
	AsyncOk,
	AsyncResult,
	Err,
	Ok,
	Panic,
	Result,
	tryBlock,
	tryBlockAsync,
} from "../src/mod.ts";

const unreachable = () => expect(true, "should not be reached").toBe(false);

describe("deprecated try()", () => {
	test("tryBlock", () => {
		const block = tryBlock(function* () {
			const x = yield* Ok(1).try();
			const y = yield* Ok(1).try();
			return Ok(x + y);
		});
		expectTypeOf(block).toEqualTypeOf<Result<number, never>>();
		expect(block.unwrap()).toEqual(2);

		const block4 = tryBlock(function* () {
			yield* Err("error").try();
			yield* Err(2).try();
			if (Math.random() > 0.5) {
				return Ok("foo");
			} else {
				return Ok(0);
			}
		});
		expectTypeOf(block4).toEqualTypeOf<Result<string | number, string | number>>();

		const block2 = tryBlock(function* () {
			const x = yield* Ok(1).try();
			const y = yield* Err("error").try();
			return Ok(x + y);
		});
		expectTypeOf(block2).toEqualTypeOf<Result<number, string>>();
		expect(block2.unwrapErr()).toEqual("error");

		const block3 = tryBlock(function* () {
			const x = yield* Ok(1).try();
			if (Math.random() > 0.5) {
				return Ok(x);
			}
			return Err("error");
		});
		expectTypeOf(block3).toEqualTypeOf<Result<number, string>>();
	});

	test("tryBlockAsync", async () => {
		const block5 = tryBlockAsync(async function* () {
			const x = yield* Ok(1).try();
			const y = yield* Ok(1).try();
			return Ok(x + y);
		});
		expectTypeOf(block5).toEqualTypeOf<AsyncResult<number, never>>();
		await expect(block5.unwrap()).resolves.toEqual(2);

		const block1 = tryBlockAsync(async function* () {
			yield* Err("error").try();
			yield* AsyncErr(2).try();
			if (Math.random() > 0.5) {
				return Ok("foo");
			} else {
				return Ok(0);
			}
		});
		expectTypeOf(block1).toEqualTypeOf<AsyncResult<string | number, string | number>>();

		const block6 = tryBlockAsync(async function* () {
			const x = yield* AsyncOk(1).try();
			const y = yield* AsyncOk(1).try();
			return Ok(x + y);
		});
		expectTypeOf(block6).toEqualTypeOf<AsyncResult<number, never>>();
		await expect(block6.unwrap()).resolves.toEqual(2);

		const block7 = tryBlockAsync(async function* () {
			const x = yield* AsyncOk(1).try();
			const y = yield* AsyncErr("error").try();
			return Ok(x + y);
		});
		expectTypeOf(block7).toEqualTypeOf<AsyncResult<number, string>>();
		await expect(block7.unwrapErr()).resolves.toEqual("error");

		// Do not catch panic
		const panic = new Panic();
		try {
			// deno-lint-ignore require-yield
			await tryBlockAsync(async function* () {
				throw panic;
			});
			unreachable();
		} catch (e) {
			expect(e).toBeInstanceOf(Panic);
		}

		// Wrap unexpected error in panic
		const error = new Error("unexpected");
		try {
			// deno-lint-ignore require-yield
			await tryBlockAsync(async function* () {
				throw error;
			});
			unreachable();
		} catch (e) {
			expect(e).toBeInstanceOf(Panic);
		}

		try {
			// deno-lint-ignore require-yield
			await tryBlockAsync(async function* () {
				throw error;
			});
		} catch (e) {
			expect((e as any).cause).toEqual(error);
		}
	});
});

// Make sure that implementing the iterator does not interfere with equality checks
test("equality check", () => {
	let a: Result<number, string> = Ok(0);
	let b: Result<number, string> = Ok(0);
	expect(a).toEqual(b);

	a = Err("error");
	b = Err("error");
	expect(a).toEqual(b);

	a = Ok(0);
	b = Err("error");
	expect(a).not.toEqual(b);

	a = Ok(0);
	b = Ok(1);
	expect(a).not.toEqual(b);

	a = Err("error");
	b = Err("other");
	expect(a).not.toEqual(b);
});

test("tryBlock", () => {
	const block = tryBlock(function* () {
		const x = yield* Ok(1);
		const y = yield* Ok(1);
		return Ok(x + y);
	});
	expectTypeOf(block).toEqualTypeOf<Result<number, never>>();
	expect(block.unwrap()).toEqual(2);

	const block4 = tryBlock(function* () {
		yield* Err("error");
		yield* Err(2);
		if (Math.random() > 0.5) {
			return Ok("foo");
		} else {
			return Ok(0);
		}
	});
	expectTypeOf(block4).toEqualTypeOf<Result<string | number, string | number>>();

	const block2 = tryBlock(function* () {
		const x = yield* Ok(1);
		const y = yield* Err("error");
		return Ok(x + y);
	});
	expectTypeOf(block2).toEqualTypeOf<Result<number, string>>();
	expect(block2.unwrapErr()).toEqual("error");

	const block3 = tryBlock(function* () {
		const x = yield* Ok(1);
		if (Math.random() > 0.5) {
			return Ok(x);
		}
		return Err("error");
	});
	expectTypeOf(block3).toEqualTypeOf<Result<number, string>>();
});

test("tryBlockAsync", async () => {
	const block5 = tryBlockAsync(async function* () {
		const x = yield* Ok(1);
		const y = yield* Ok(1);
		return Ok(x + y);
	});
	expectTypeOf(block5).toEqualTypeOf<AsyncResult<number, never>>();
	await expect(block5.unwrap()).resolves.toEqual(2);

	const block1 = tryBlockAsync(async function* () {
		yield* Err("error");
		yield* AsyncErr(2);
		if (Math.random() > 0.5) {
			return Ok("foo");
		} else {
			return Ok(0);
		}
	});
	expectTypeOf(block1).toEqualTypeOf<AsyncResult<string | number, string | number>>();

	const block6 = tryBlockAsync(async function* () {
		const x = yield* AsyncOk(1);
		const y = yield* AsyncOk(1);
		return Ok(x + y);
	});
	expectTypeOf(block6).toEqualTypeOf<AsyncResult<number, never>>();
	await expect(block6.unwrap()).resolves.toEqual(2);

	const block7 = tryBlockAsync(async function* () {
		const x = yield* AsyncOk(1);
		const y = yield* AsyncErr("error");
		return Ok(x + y);
	});
	expectTypeOf(block7).toEqualTypeOf<AsyncResult<number, string>>();
	await expect(block7.unwrapErr()).resolves.toEqual("error");

	// Do not catch panic
	const panic = new Panic();
	try {
		// deno-lint-ignore require-yield
		await tryBlockAsync(async function* () {
			throw panic;
		});
		unreachable();
	} catch (e) {
		expect(e).toBeInstanceOf(Panic);
	}

	// Wrap unexpected error in panic
	const error = new Error("unexpected");
	try {
		// deno-lint-ignore require-yield
		await tryBlockAsync(async function* () {
			throw error;
		});
		unreachable();
	} catch (e) {
		expect(e).toBeInstanceOf(Panic);
	}

	try {
		// deno-lint-ignore require-yield
		await tryBlockAsync(async function* () {
			throw error;
		});
		unreachable();
	} catch (e) {
		expect((e as any).cause).toEqual(error);
	}
});
