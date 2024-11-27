import type { Result } from "./result.ts";
import { AsyncResult } from "./async_result.ts";
import type { InferErr, InferOk } from "./util.ts";

/**
 * Wraps a function that returns any shape of `Result<any, any>` and infers its return type as `Result<T, E>`.
 *
 * **Examples**
 *
 * ```
 * // (a: number, b: number) => Err<string> | Ok<number>
 * const divide = (a: number, b: number) => b === 0 ? Err("division by zero") : Ok(a / b)
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
 * Wraps a function that returns any shape of `Promise<Result<any, any>>` and wraps the return value in an `AsyncResult`.
 *
 * **Examples**
 *
 * ```
 * // (a: number, b: number) => Promise<Err<string> | Ok<number>>
 * const divide = async (a: number, b: number) => b === 0 ? Err("division by zero") : Ok(a / b)
 *
 * // (a: number, b: number) => AsyncResult<number, string>
 * const wrapped = asyncFn(divide)
 * // now you can do this:
 * const result = await wrapped(1, 2) // => Result<number, string>
 * ```
 */
export function asyncFn<A extends any[], R extends AsyncResult<any, any>>(
	f: (...args: A) => R,
): (...args: A) => AsyncResult<InferOk<Awaited<R>>, InferErr<Awaited<R>>>;

export function asyncFn<A extends any[], R extends Promise<Result<any, any>>>(
	f: (...args: A) => R,
): (...args: A) => AsyncResult<InferOk<Awaited<R>>, InferErr<Awaited<R>>>;

// deno-lint-ignore explicit-module-boundary-types
export function asyncFn(f: any): any {
	// deno-lint-ignore explicit-function-return-type
	return function (...args: any[]) {
		return new AsyncResult(f(...args));
	};
}
