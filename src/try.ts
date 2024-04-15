import {Panic} from "./error";
import {parseError} from "./error";
import {Err, Ok, type Result} from "./result";
import {ResultPromise} from "./result_promise";

function handlePanic(error: unknown) {
	if (error instanceof Panic) {
		throw error;
	}
	return error;
}

function handleCaughtError(error: unknown) {
	return parseError(handlePanic(error));
}

/**
 * Tries to execute a function and returns the result as a `Result`.
 *
 * **Examples**
 *
 * ```
 * // const result: Result<number, Error>
 * const result = tryFn(() => {
 *   if (Math.random() > 0.5) {
 *		return 42
 *	  } else {
 *		throw new Error("random error")
 *	  }
 * })
 * ```
 */
export function tryFn<T>(fn: () => T): Result<T, Error> {
	try {
		return Ok(fn());
	} catch (error) {
		return Err(handleCaughtError(error));
	}
}

/**
 * Tries to resolve a promise and returns the result as a `ResultPromise`.
 *
 * **Examples**
 *
 * ```
 * // const result: ResultPromise<number, Error>
 * const result = tryPromise(Promise.resolve(42))
 * ```
 */
export function tryPromise<T>(promise: Promise<T>): ResultPromise<T, Error> {
	return new ResultPromise(
		promise.then(
			(value) => Ok(value),
			(error: unknown) => Err(handleCaughtError(error)),
		),
	);
}

/**
 * Tries to execute an async function and returns the result as a `ResultPromise`.
 *
 * **Examples**
 *
 * ```
 * // const result: ResultPromise<number, CaughtError>
 * const result = tryAsyncFn(() => {
 *  if (Math.random() > 0.5) {
 *    return Promise.resolve(42)
 * 	} else {
 *   throw new Error("random error")
 * }
 * })
 * ```
 */
export function tryAsyncFn<T>(fn: () => Promise<T>): ResultPromise<T, Error> {
	return tryPromise(fn());
}
