import {AsyncResult} from "./async_result";
import {type Result, ResultImpl, Ok} from "./result";
import type {InferErr} from "./util";

function _try<T extends Result<any, any>, U>(
	fn: () => Generator<T, U, any>,
): Result<U, InferErr<T>> {
	const gen = fn();
	let done = false;
	let returnResult = Ok();
	while (!done) {
		const iter = gen.next(returnResult.unwrap());
		if (iter.value instanceof ResultImpl) {
			if (iter.value.isErr()) {
				done = true;
				gen.return?.(iter.value as any);
			}
			returnResult = iter.value as any;
		} else {
			done = true;
			returnResult = Ok(iter.value) as any;
		}
	}
	return returnResult as any;
}

/**
 * Runs a generator function that returns a `Result` and infers its return type as `Result<T, E>`.
 *
 * `yield*` must be used to yield the result of a `Result`.
 *
 * **Examples**
 *
 * ```ts
 * // $ExpectType Result<number, string>
 * const result = tryFn(function* () {
 *   const a = yield* Ok(1)
 *   const random = Math.random()
 *   if (random > 0.5) {
 *     yield* Err("error")
 *   }
 *   return a + random
 * })
 * ```
 */
export function tryFn<T extends Result<any, any>, U>(fn: () => Generator<T, U, any>) {
	// Variable assignment helps with type inference
	const result = _try(fn);
	return result;
}

async function toPromiseResult<T, E>(value: any): Promise<Result<T, E>> {
	const awaited = await value;
	if (value instanceof ResultImpl) {
		return awaited as any;
	}
	return Ok(awaited);
}

function _tryAsync<T extends AsyncResult<any, any> | Result<any, any>, U>(
	fn: () => AsyncGenerator<T, U, any>,
): AsyncResult<U, InferErr<Awaited<T>>> {
	const gen = fn();
	const yieldedResultChain = Promise.resolve<Result<any, any>>(Ok()).then(
		async function fulfill(nextResult): Promise<Result<any, any>> {
			const iter = await gen.next(nextResult.unwrap());
			const result = await toPromiseResult(iter.value);
			if (iter.done) {
				return result;
			}
			if (result.isErr()) {
				gen.return?.(iter.value as any);
				return result;
			}
			return Promise.resolve(result).then(fulfill);
		},
	);
	return new AsyncResult(yieldedResultChain);
}

/**
 * Runs an async generator function that returns a `Result` and infers its return type as `AsyncResult<T, E>`.
 *
 * `yield*` must be used to yield the result of a `AsyncResult` or `Result`.
 *
 * **Examples**
 *
 * ```ts
 * const okOne = () => new AsyncResult(Promise.resolve(Ok(1)))
 *
 * // $ExpectType AsyncResult<number, string>
 * const result = tryAsyncFn(async function* () {
 *   const a = yield* okOne()
 *   const random = Math.random()
 *   if (random > 0.5) {
 *     yield* Err("error")
 *   }
 *   return a + random
 * })
 * ```
 */
export function tryAsyncFn<T extends AsyncResult<any, any> | Result<any, any>, U>(
	fn: () => AsyncGenerator<T, U, any>,
) {
	// Variable assignment helps with type inference
	const result = _tryAsync(fn);
	return result;
}
