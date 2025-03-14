import { test } from "@std/testing/bdd";
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
	expect(block.expect("ok")).toEqual(2);

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
	expect(block2.expectErr("err")).toEqual("error");

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
	await expect(block5.expect("ok")).resolves.toEqual(2);

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
	await expect(block6.expect("ok")).resolves.toEqual(2);

	const block7 = tryBlockAsync(async function* () {
		const okx: AsyncResult<number, string> = AsyncOk(1);
		const x = yield* okx;
		const oky: AsyncResult<number, string> = AsyncErr("error");
		const y = yield* oky;
		return Ok(x + y);
	});
	expectTypeOf(block7).toEqualTypeOf<AsyncResult<number, string>>();
	await expect(block7.expectErr("err")).resolves.toEqual("error");

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
