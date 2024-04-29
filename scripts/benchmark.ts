import {Err, Ok, asyncFn, asyncGenFn} from "../src";
import {performance} from "perf_hooks";

const getOne = asyncFn(async () => Ok(1));

function formatTime(ms: number) {
	return `${ms.toFixed(5)}ms`;
}

const a = asyncFn(async () => {
	const one = await getOne();
	if (one.isErr()) {
		return one;
	}
	const rand = Math.random();
	if (Math.random() < 0.5) {
		return Err("error");
	}
	return Ok(rand + one.value());
});

const b = asyncGenFn(async function* () {
	const one = yield* getOne();
	const rand = Math.random();
	if (Math.random() < 0.5) {
		yield* Err("error");
	}
	return rand + one;
});

const iterations = 10_000_000;

async function main() {
	console.log("iterations:", iterations);

	let start = performance.now();
	for (let i = 0; i < iterations; i++) {
		await a();
	}
	let end = performance.now();
	const asyncDiff = end - start;
	const oneAsyncDiff = asyncDiff / iterations;
	console.log("asyncFn:", formatTime(oneAsyncDiff));

	start = performance.now();
	for (let i = 0; i < iterations; i++) {
		await b();
	}
	end = performance.now();
	const asyncGenDiff = end - start;
	const oneAsyncGenDiff = asyncGenDiff / iterations;
	console.log("asyncGenFn:", formatTime(oneAsyncGenDiff));

	console.log("difference:", formatTime(oneAsyncGenDiff - oneAsyncDiff));
	console.log("ratio:", (oneAsyncGenDiff / oneAsyncDiff).toFixed(2));
}

main();
