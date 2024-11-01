import { asyncFn, asyncGenFn } from "./fn.ts";
import { Ok } from "./result.ts";
import { tryBlockAsync } from "./try.ts";

const getOne = asyncFn(async () => Ok(1));

function chain() {
	return getOne().map((n) => n + 1);
}

const af = asyncFn(async () => {
	const one = await getOne();
	if (one.isErr()) {
		return one;
	}
	return Ok(one.unwrap() + 1);
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
