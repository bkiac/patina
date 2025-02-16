import { asyncFn } from "../src/fn.ts";
import { Ok, type Result } from "../src/result.ts";
import { tryBlockAsync } from "../src/try.ts";

// deno-lint-ignore require-await
const getOne = asyncFn(async (): Promise<Result<number, string>> => Ok(1));

function chain() {
	return getOne().map((n) => n + 1);
}

const af = asyncFn(async () => {
	const one = await getOne();
	if (one.isErr()) {
		return one;
	}
	return Ok(one.expect("ok") + 1);
});

function tba() {
	return tryBlockAsync(async function* () {
		const one = yield* getOne();
		return Ok(one + 1);
	});
}

Deno.bench({
	baseline: true,
	name: "chain",
	fn: async () => {
		await chain();
	},
});

Deno.bench({
	name: "asyncFn",
	fn: async () => {
		await af();
	},
});

Deno.bench({
	name: "tryBlockAsync",
	fn: async () => {
		await tba();
	},
});
