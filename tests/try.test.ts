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
		expectTypeOf(block).toEqualTypeOf<Result<number, unknown>>();
		expect(block.unwrapUnchecked()).toEqual(2);

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
			const ok: Result<number, string> = Ok(1);
			const x = yield* ok.try();
			const err: Result<number, string> = Err("error");
			const y = yield* err.try();
			return Ok(x + y);
		});
		expectTypeOf(block2).toEqualTypeOf<Result<number, string>>();
		expect(block2.unwrapErrUnchecked()).toEqual("error");

		const block3 = tryBlock(function* () {
			const ok: Result<number, string> = Ok(1);
			const x = yield* ok.try();
			if (Math.random() > 0.5) {
				return Ok(x);
			}
			return Err("error");
		});
		expectTypeOf(block3).toEqualTypeOf<Result<number, string>>();
	});

	test("tryBlockAsync", async () => {
		const block5 = tryBlockAsync(async function* () {
			const okx: Result<number, string> = Ok(1);
			const x = yield* okx.try();
			const oky: Result<number, string> = Ok(1);
			const y = yield* oky.try();
			return Ok(x + y);
		});
		expectTypeOf(block5).toEqualTypeOf<AsyncResult<number, string>>();
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
			const okx: AsyncResult<number, string> = AsyncOk(1);
			const x = yield* okx.try();
			const oky: AsyncResult<number, string> = AsyncOk(1);
			const y = yield* oky.try();
			return Ok(x + y);
		});
		expectTypeOf(block6).toEqualTypeOf<AsyncResult<number, string>>();
		await expect(block6.unwrap()).resolves.toEqual(2);

		const block7 = tryBlockAsync(async function* () {
			const okx: AsyncResult<number, string> = AsyncOk(1);
			const x = yield* okx.try();
			const oky: AsyncResult<number, string> = AsyncErr("error");
			const y = yield* oky.try();
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
		const okx: Result<number, string> = Ok(1);
		const x = yield* okx;
		const oky: Result<number, string> = Ok(1);
		const y = yield* oky;
		return Ok(x + y);
	});
	expectTypeOf(block).toEqualTypeOf<Result<number, string>>();
	expect(block.unwrapUnchecked()).toEqual(2);

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
		const okx: Result<number, string> = Ok(1);
		const x = yield* okx;
		const oky: Result<number, string> = Err("error");
		const y = yield* oky;
		return Ok(x + y);
	});
	expectTypeOf(block2).toEqualTypeOf<Result<number, string>>();
	expect(block2.unwrapErrUnchecked()).toEqual("error");

	const block3 = tryBlock(function* () {
		const okx: Result<number, string> = Ok(1);
		const x = yield* okx;
		if (Math.random() > 0.5) {
			return Ok(x);
		}
		return Err("error");
	});
	expectTypeOf(block3).toEqualTypeOf<Result<number, string>>();
});

test("tryBlockAsync", async () => {
	const block5 = tryBlockAsync(async function* () {
		const okx: Result<number, string> = Ok(1);
		const x = yield* okx;
		const oky: Result<number, string> = Ok(1);
		const y = yield* oky;
		return Ok(x + y);
	});
	expectTypeOf(block5).toEqualTypeOf<AsyncResult<number, string>>();
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
		const okx: AsyncResult<number, string> = AsyncOk(1);
		const x = yield* okx;
		const oky: AsyncResult<number, string> = AsyncOk(1);
		const y = yield* oky;
		return Ok(x + y);
	});
	expectTypeOf(block6).toEqualTypeOf<AsyncResult<number, string>>();
	await expect(block6.unwrap()).resolves.toEqual(2);

	const block7 = tryBlockAsync(async function* () {
		const okx: AsyncResult<number, string> = AsyncOk(1);
		const x = yield* okx;
		const oky: AsyncResult<number, string> = AsyncErr("error");
		const y = yield* oky;
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
