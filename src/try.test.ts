import { describe, expect, expectTypeOf, test } from "vitest";
import { Err, Ok } from "./result.ts";
import { Panic } from "./error.ts";

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
			const x = yield* Err("error").try();
			const y = yield* Err(2).try();
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
		expectTypeOf(block5).toEqualTypeOf<ResultAsync<number, never>>();
		await expect(block5.unwrap()).resolves.toEqual(2);

		const block1 = tryBlockAsync(async function* () {
			const x = yield* Err("error").try();
			const y = yield* new ResultAsync(Promise.resolve(Err(2))).try();
			if (Math.random() > 0.5) {
				return Ok("foo");
			} else {
				return Ok(0);
			}
		});
		expectTypeOf(block1).toEqualTypeOf<ResultAsync<string | number, string | number>>();

		const block6 = tryBlockAsync(async function* () {
			const x = yield* new ResultAsync(Promise.resolve(Ok(1))).try();
			const y = yield* new ResultAsync(Promise.resolve(Ok(1))).try();
			return Ok(x + y);
		});
		expectTypeOf(block6).toEqualTypeOf<ResultAsync<number, never>>();
		await expect(block6.unwrap()).resolves.toEqual(2);

		const block7 = tryBlockAsync(async function* () {
			const x = yield* new ResultAsync(Promise.resolve(Ok(1))).try();
			const y = yield* new ResultAsync(Promise.resolve(Err("error"))).try();
			return Ok(x + y);
		});
		expectTypeOf(block7).toEqualTypeOf<ResultAsync<number, string>>();
		await expect(block7.unwrapErr()).resolves.toEqual("error");

		// Do not catch panic
		const panic = new Panic();
		await expect(() =>
			tryBlockAsync(async function* () {
				throw panic;
			})
		).rejects.toThrow(panic);

		// Wrap unexpected error in panic
		const error = new Error("unexpected");
		await expect(() =>
			tryBlockAsync(async function* () {
				throw error;
			})
		).rejects.toThrow(Panic);
		try {
			await tryBlockAsync(async function* () {
				throw error;
			});
		} catch (e) {
			expect((e as any).cause).toEqual(error);
		}
	});
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
		const x = yield* Err("error");
		const y = yield* Err(2);
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
	expectTypeOf(block5).toEqualTypeOf<ResultAsync<number, never>>();
	await expect(block5.unwrap()).resolves.toEqual(2);

	const block1 = tryBlockAsync(async function* () {
		const x = yield* Err("error");
		const y = yield* new ResultAsync(Promise.resolve(Err(2)));
		if (Math.random() > 0.5) {
			return Ok("foo");
		} else {
			return Ok(0);
		}
	});
	expectTypeOf(block1).toEqualTypeOf<ResultAsync<string | number, string | number>>();

	const block6 = tryBlockAsync(async function* () {
		const x = yield* new ResultAsync(Promise.resolve(Ok(1)));
		const y = yield* new ResultAsync(Promise.resolve(Ok(1)));
		return Ok(x + y);
	});
	expectTypeOf(block6).toEqualTypeOf<ResultAsync<number, never>>();
	await expect(block6.unwrap()).resolves.toEqual(2);

	const block7 = tryBlockAsync(async function* () {
		const x = yield* new ResultAsync(Promise.resolve(Ok(1)));
		const y = yield* new ResultAsync(Promise.resolve(Err("error")));
		return Ok(x + y);
	});
	expectTypeOf(block7).toEqualTypeOf<ResultAsync<number, string>>();
	await expect(block7.unwrapErr()).resolves.toEqual("error");

	// Do not catch panic
	const panic = new Panic();
	await expect(() =>
		tryBlockAsync(async function* () {
			throw panic;
		})
	).rejects.toThrow(panic);

	// Wrap unexpected error in panic
	const error = new Error("unexpected");
	await expect(() =>
		tryBlockAsync(async function* () {
			throw error;
		})
	).rejects.toThrow(Panic);
	try {
		await tryBlockAsync(async function* () {
			throw error;
		});
	} catch (e) {
		expect((e as any).cause).toEqual(error);
	}
});
