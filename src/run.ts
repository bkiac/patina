import { ResultAsync } from "./result_async.ts";
import type { Result } from "./result.ts";
import type { InferErr, InferOk } from "./util.ts";

/**
 * Runs an async function and returns a `Result<T, E>`.
 *
 * This is useful for running async functions that return `Promise<Result<T, E>>` or `ResultAsync<T, E>`.
 *
 * @param fn - The async function to run.
 * @returns A `Result<T, E>` that is `Ok(value)` if the async function resolves to an `Ok` variant, otherwise `Err(error)`.
 *
 * @example
 * ```typescript
 * const result = await runAsync(async () => {
 * 	if (Math.random() > 0.5) {
 * 		return Ok(10);
 * 	}
 * 	return Err("error");
 * });
 * assertEquals(result.isErr(), true);
 * ```
 */
export function runAsync<R extends Promise<Result<any, any>> | ResultAsync<any, any>>(
	fn: () => R,
): ResultAsync<InferOk<Awaited<R>>, InferErr<Awaited<R>>> {
	return new ResultAsync(fn());
}
