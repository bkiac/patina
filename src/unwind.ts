/**
 * Functions for catching Panics and other errors, emulating Rust's `catch_unwind`.
 *
 * @module
 */

import { Err, Ok, Result } from "./result.ts";
import { ResultAsync } from "./result_async.ts";
import { Panic, parseError } from "./error.ts";

function unknownToError(e: unknown): Error {
	// Convert `Panic` to `Error`, preserving the message and cause
	if (e instanceof Panic) {
		return new Error(e.message, { cause: e });
	}

	// Return `Error` as is
	if (e instanceof Error) {
		return e;
	}

	// Convert other values to `Error`, preserving the message and cause
	return parseError(e);
}

/**
 * Wraps a function in a `Result` and catches any thrown error, even `Panics`, emulating Rust's `catch_unwind`.
 *
 * Panics are converted to Errors and preserved in the `cause` property
 *
 * This is useful for catching anything that can be thrown, including `Panics`, because `Result` helper methods deliberately let panics pass through.
 *
 * @param fn - The function to wrap.
 * @returns A `Result` containing the return value of the function, or an `Error` if the function throws.
 *
 * @example
 * ```ts
 * const result = catchUnwind(() => {
 * 	throw new Panic("oh no")
 * })
 * assertEquals(result.expectErr("should be an error").cause.message, "oh no")
 * ```
 */
export function catchUnwind<T>(fn: () => T): Result<T, Error> {
	try {
		return Ok(fn());
	} catch (e) {
		return Err(unknownToError(e));
	}
}

/**
 * Wraps a function in an `ResultAsync` and catches any thrown error, even `Panics`, emulating Rust's `catch_unwind`.
 *
 * Panics are converted to Errors and preserved in the `cause` property
 *
 * This is useful for catching anything that can be thrown, including `Panics`, because `Result` helper methods deliberately let panics pass through.
 *
 * @param fn - The function to wrap.
 * @returns An `ResultAsync` containing the return value of the function, or an `Error` if the function throws.
 *
 * @example
 * ```ts
 * const result = catchUnwindAsync(async () => {
 * 	throw new Panic("oh no")
 * })
 * ```
 */
export function catchUnwindAsync<T>(fn: () => Promise<T>): ResultAsync<T, Error> {
	async function unwind(): Promise<Result<T, Error>> {
		try {
			return await Result.fromThrowableAsync(fn); // `await` is required here, otherwise the error is not caught
		} catch (e) {
			return Err(unknownToError(e));
		}
	}
	return new ResultAsync(unwind());
}
