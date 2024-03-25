import {Panic, ErrorWithCause} from "./error"
import {type ErrorHandler, parseError} from "./error"
import {Err, Ok, type Result} from "./result"
import {ResultPromise} from "./result_promise"

function handlePanic(error: unknown) {
	if (error instanceof Panic) {
		throw error
	}
	return error
}

function handleCaughtError(error: unknown) {
	return parseError(handlePanic(error))
}

/**
 * A special error to indicate an error that was caught by a try function.
 *
 * The error is caught and wrapped in a `CaughtError` to prevent it from being thrown.
 *
 * Original error can be accessed using the `cause` field.
 */
export class CaughtError extends ErrorWithCause<Error> {
	readonly tag = "CaughtError"
}

/**
 * Tries to execute a function and returns the result as a `Result`.
 *
 * If the function throws an error, it is caught and wrapped in a `CaughtError`.
 *
 * **Examples**
 *
 * ```
 * // const result: Result<number, CaughtError>
 * const result = tryFn(() => {
 *   if (Math.random() > 0.5) {
 *		return 42
 *	  } else {
 *		throw new Error("random error")
 *	  }
 * })
 * ```
 */
export function tryFn<T>(fn: () => T): Result<T, CaughtError> {
	try {
		return Ok(fn())
	} catch (error) {
		return Err(
			new CaughtError("Caught error while trying function", {
				cause: handleCaughtError(error),
			}),
		)
	}
}

/**
 * Tries to execute a function and transforms the caught error using the provided `handleError` function.
 *
 * **Examples**
 *
 * ```
 * // const result: Result<number, string>
 * const result = tryFnWith(() => {
 *  if (Math.random() > 0.5) {
 *     return 42
 *   } else {
 *     throw new Error("random error")
 *   }
 *  }, (error) => error.message)
 * ```
 */
export function tryFnWith<T, E>(fn: () => T, handleError: ErrorHandler<E>): Result<T, E> {
	try {
		return Ok(fn())
	} catch (error) {
		return Err(handleError(handleCaughtError(error), error))
	}
}

/**
 * Tries to resolve a promise and returns the result as a `ResultPromise`.
 *
 * If the promise rejects, the error is caught and wrapped in a `CaughtError`.
 *
 * **Examples**
 *
 * ```
 * // const result: ResultPromise<number, CaughtError>
 * const result = tryPromise(Promise.resolve(42))
 * ```
 */
export function tryPromise<T>(promise: Promise<T>): ResultPromise<T, CaughtError> {
	return new ResultPromise(
		promise.then(
			(value) => Ok(value),
			(error: unknown) =>
				Err(
					new CaughtError("Caught error while trying promise", {
						cause: handleCaughtError(error),
					}),
				),
		),
	)
}

/**
 * Tries to resolve a promise and transforms the caught error using the provided `handleError` function.
 *
 * **Examples**
 *
 * ```
 * // const result: ResultPromise<number, string>
 * const result = tryPromiseWith(Promise.resolve(42), (error) => error.message)
 * ```
 */
export function tryPromiseWith<T, E>(
	promise: Promise<T>,
	handleError: ErrorHandler<E>,
): ResultPromise<T, E> {
	return new ResultPromise(
		promise.then(
			(value) => Ok(value),
			(error: unknown) => Err(handleError(handleCaughtError(error), error)),
		),
	)
}

/**
 * Tries to execute an async function and returns the result as a `ResultPromise`.
 *
 * If the function throws an error, it is caught and wrapped in a `CaughtError`.
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
export function tryAsyncFn<T>(fn: () => Promise<T>): ResultPromise<T, CaughtError> {
	return tryPromise(fn())
}

/**
 * Tries to execute an async function and transforms the caught error using the provided `handleError` function.
 *
 * **Examples**
 *
 * ```
 * // const result: ResultPromise<number, string>
 * const result = tryAsyncFnWith(() => {
 * if (Math.random() > 0.5) {
 *   return Promise.resolve(42)
 * } else {
 *  throw new Error("random error")
 * }
 * }, (error) => error.message)
 * ```
 */
export function tryAsyncFnWith<T, E>(
	fn: () => Promise<T>,
	handleError: ErrorHandler<E>,
): ResultPromise<T, E> {
	return tryPromiseWith(fn(), handleError)
}
