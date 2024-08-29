import {it, expect, expectTypeOf, describe, test} from "vitest";
import {Ok, Err, Result, AsyncResult, tryBlock, tryBlockAsync} from "../src";

test("tryBlock", () => {
	const block = tryBlock(function* () {
		const x = yield* Ok(1).try();
		const y = yield* Ok(1).try();
		return Ok(x + y);
	});
	expectTypeOf(block).toEqualTypeOf<Result<number, never>>();
	expect(block.unwrap()).toEqual(2);

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

	const block6 = tryBlockAsync(async function* () {
		const x = yield* new AsyncResult(Promise.resolve(Ok(1))).try();
		const y = yield* new AsyncResult(Promise.resolve(Ok(1))).try();
		return Ok(x + y);
	});
	expectTypeOf(block6).toEqualTypeOf<AsyncResult<number, never>>();
	await expect(block6.unwrap()).resolves.toEqual(2);

	const block7 = tryBlockAsync(async function* () {
		const x = yield* new AsyncResult(Promise.resolve(Ok(1))).try();
		const y = yield* new AsyncResult(Promise.resolve(Err("error"))).try();
		return Ok(x + y);
	});
	expectTypeOf(block7).toEqualTypeOf<AsyncResult<number, string>>();
	await expect(block7.unwrapErr()).resolves.toEqual("error");
});
