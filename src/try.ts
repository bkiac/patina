import {AsyncResult} from "./async_result";
import {Panic} from "./error";
import {type Result, type Err} from "./result";

/**
 * Creates a scope where you can use `yield*` and `try()` together to unwrap or propagate errors from a `Result`.
 *
 * **Note:** This function is synchronous. If you need to use asynchronous operations, use `tryBlockAsync` instead.
 *
 * **Example:**
 *
 * ```ts
 * const block = tryBlock(function* () {
 * 	const x = yield* Ok(1).try();
 * 	const y = yield* Ok(1).try();
 * 	return Ok(x + y);
 * });
 *
 * assert.equal(block.unwrap(), 2);
 * ```
 */
export function tryBlock<T, E>(scope: () => Generator<Err<E, never>, Result<T, E>>): Result<T, E> {
	return scope().next().value;
}

/**
 * Creates an async scope where you can use `yield*` and `try()` together to unwrap or propagate errors from a `Result` or `AsyncResult`.
 *
 * Any thrown `Error` will be wrapped in a `Panic`.
 *
 * **Example:**
 *
 * ```ts
 * const asyncNumber = new AsyncResult(Promise.resolve(Ok(1)));
 *
 * const block = await tryBlockAsync(async function* () {
 * 	const x = yield* Ok(1).try();
 * 	const y = yield* asyncNumber.try();
 * 	return Ok(x + y);
 * });
 *
 * assert.equal(block.unwrap(), 2);
 * ```
 */
export function tryBlockAsync<T, E>(
	scope: () => AsyncGenerator<Err<E, never>, Result<T, E>>,
): AsyncResult<T, E> {
	const next = scope().next();
	return new AsyncResult(
		next
			.then((result) => result.value)
			.catch((error) => {
				if (error instanceof Panic) {
					throw error;
				}
				throw new Panic(
					"Unexpected rejected promise in `tryBlockAsync`: resolve the promise safely instead of throwing",
					{
						cause: error,
					},
				);
			}),
	);
}
