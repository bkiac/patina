import { Err, Ok, Result } from "./result.ts";
import { AsyncResult } from "./async_result.ts";
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
 */
export function catchUnwind<T>(fn: () => T): Result<T, Error> {
	try {
		return Ok(fn());
	} catch (e) {
		return Err(unknownToError(e));
	}
}

/**
 * Wraps a function in an `AsyncResult` and catches any thrown error, even `Panics`, emulating Rust's `catch_unwind`.
 */
export function catchUnwindAsync<T>(fn: () => Promise<T>): AsyncResult<T, Error> {
	async function unwind(): Promise<Result<T, Error>> {
		try {
			return await Result.fromThrowableAsync(fn); // `await` is required here, otherwise the error is not caught
		} catch (e) {
			return Err(unknownToError(e));
		}
	}
	return new AsyncResult(unwind());
}
