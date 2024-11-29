/**
 * Functions wrappers that infer the return type of a function as a `Result<T, E>`.
 *
 * @module
 */

import type { Result } from "./result.ts";
import { AsyncResult } from "./async_result.ts";
import type { InferErr, InferOk } from "./util.ts";

/**
 * Wraps a function that returns any shape of `Result<any, any>` and infers its return type as `Result<T, E>`.
 *
 * Of course, you can just type your function manually with a `Result<T, E>` type if you prefer.
 *
 * @param f - The function to wrap.
 * @returns A function that returns a `Result<T, E>`.
 *
 * @example
 * ```
 * // (a: number, b: number) => Err<string> | Ok<number>
 * const divide = (a: number, b: number) => {
 *   if (b === 0) {
 *     return Err("division by zero")
 *   }
 *   return Ok(a / b)
 * }
 *
 * // (a: number, b: number) => Result<number, string>
 * const wrapped = fn(divide)
 * ```
 */
export function fn<A extends any[], R extends Result<any, any>>(
	f: (...args: A) => R,
): (...args: A) => Result<InferOk<R>, InferErr<R>> {
	return f;
}

/**
 * Wraps a function that returns any shape of `Promise<Result<any, any>>` or `AsyncResult<any, any>`
 * and wraps the return value in an `AsyncResult<T, E>`.
 *
 * This is useful because you do not need to manually convert `Ok` and `Err` types to their async versions and you'll also get a nice `AsyncResult` type instead of a union type.
 *
 * @param f - The function to wrap.
 * @returns A function that returns an `AsyncResult<T, E>`.
 *
 * @example
 * ```
 * // instead of `Promise<Err<string> | Ok<User>>` return type,
 * // you get `AsyncResult<User, string>`
 * const getUser = asyncFn(async (userId: string) => {
 * 	const user = await findUserById(userId)
 * 	if (!user) {
 * 		return Err("user not found")
 * 	}
 * 	return Ok(user)
 * })
 * ```
 */
export function asyncFn<
	A extends any[],
	R extends AsyncResult<any, any> | Promise<Result<any, any>>,
>(
	f: (...args: A) => R,
): (...args: A) => AsyncResult<InferOk<Awaited<R>>, InferErr<Awaited<R>>> {
	return function (...args: A): AsyncResult<InferOk<Awaited<R>>, InferErr<Awaited<R>>> {
		return new AsyncResult(f(...args));
	};
}
