import { runAsync } from "../src/run.ts";
import { Err, Ok } from "../src/result.ts";
import { expect } from "@std/expect";
import { test } from "@std/testing/bdd";
import { expectTypeOf } from "expect-type";
import { AsyncResult } from "../src/async_result.ts";

test("runAsync", async () => {
	const result = runAsync(async () => {
		if (Math.random() > 0.5) {
			return Ok(10);
		}
		return Err("error");
	});
	expectTypeOf(result).toEqualTypeOf<AsyncResult<number, string>>();

	const result2 = await runAsync(async () => {
		return Ok(1);
	}).expect("ok");
	expect(result2).toEqual(1);

	const result3 = await runAsync(async () => {
		return Err("error");
	}).expectErr("error");
	expect(result3).toEqual("error");
});
