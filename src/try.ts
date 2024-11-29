/**
 * This module contains utility functions trying to emulate Rust's `try_blocks` and `?` operator.
 * @module
 */

import { AsyncResult } from "./async_result.ts";
import { Panic } from "./error.ts";
import type { Err, Result } from "./result.ts";
import type { InferErr, InferOk } from "./util.ts";

/**
 * Creates a scope where you can use `yield*` to unwrap or propagate errors from a `Result`.
 *
 * This is intended to emulate Rust's `try_blocks` and `?` operator and offer a more ergonomic way to handle errors,
 * just be aware that this can be significantly slower than manually handling and propagating errors because of the generator overhead.
 *
 * **Note:** Only works with synchronous blocks, if you need to use asynchronous operations, use `tryBlockAsync()` instead.
 *
 * @param scope - A generator function that yields `Result` values
 * @returns A `Result` that is the value of the last `yield*` statement in the generator function
 *
 * @example
 * ```typescript
 * // Basic usage - all operations succeed
 * const result = tryBlock(function* () {
 *     const x = yield* Result.fromThrowable(() => parseInt("1"));
 *     const y = yield* Result.fromThrowable(() => parseInt("2"));
 *     const z = yield* Result.fromThrowable(() => parseInt("3"));
 *     return Ok(x + y + z);
 * });
 * assertEquals(result, Ok(6));
 *
 * // Error propagation - second operation fails
 * const result = tryBlock(function* () {
 *     const x = yield* Result.fromThrowable(() => parseInt("1"));
 *     const y = yield* Result.fromThrowable(() => parseInt("foo")); // fails here
 *     const z = yield* Result.fromThrowable(() => parseInt("3"));
 *     return Ok(x + y + z);
 * });
 * assertEquals(result.isErr(), true);
 * ```
 */
export function tryBlock<Y extends Err<any, never>, R extends Result<any, any>>(
	scope: () => Generator<Y, R>,
): Result<InferOk<R>, InferErr<Y> | InferErr<R>> {
	return scope().next().value;
}

/**
 * Creates an async scope where you can use `yield*` to unwrap or propagate errors from a `Result` or `AsyncResult`.
 *
 * This is intended to emulate Rust's `try_blocks` and `?` operator and offer a more ergonomic way to handle errors,
 * just be aware that this can be significantly slower than manually handling and propagating errors because of the generator overhead.
 *
 * The `scope` function should not throw any errors, instead it should return a `Result` or `AsyncResult` that contains
 * the error. If an error is thrown, it will be wrapped in a `Panic`.
 *
 * @param scope - A generator function that yields `Result` or `AsyncResult` values
 * @returns A `Result` or `AsyncResult` that is the value of the last `yield*` statement in the generator function
 *
 * @example
 * ```typescript
 * // Basic usage with mixed sync/async operations
 * const result = await tryBlockAsync(async function* () {
 *     const x = yield* Result.fromThrowable(() => parseInt("1"));
 *     const y = yield* Result.fromPromise(Promise.resolve(2));
 *     const z = yield* Result.fromThrowable(() => parseInt("3"));
 *     return Ok(x + y + z);
 * });
 * assertEquals(result, Ok(6));
 *
 * // Error propagation with async operations
 * const result = await tryBlockAsync(async function* () {
 *     const x = yield* Result.fromThrowable(() => parseInt("1"));
 *     const y = yield* Result.fromThrowableAsync(async () => {
 *         throw new Error("failed");
 *     });
 *     const z = yield* Result.fromThrowable(() => parseInt("3"));
 *     return Ok(x + y + z);
 * });
 * assertEquals(result.isErr(), true);
 * ```
 */
export function tryBlockAsync<Y extends Err<any, never>, R extends Result<any, any>>(
	scope: () => AsyncGenerator<Y, R>,
): AsyncResult<InferOk<R>, InferErr<Y> | InferErr<R>> {
	const next = scope().next();
	return new AsyncResult(
		next
			.then((result) => result.value)
			.catch((error) => {
				if (error instanceof Panic) {
					throw error;
				}
				throw new Panic(
					"Unexpected rejected promise in `tryBlockAsync()`: resolve the promise safely instead of throwing",
					{
						cause: error,
					},
				);
			}),
	);
}
