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

export class CaughtError extends ErrorWithCause<Error> {
	readonly tag = "CaughtError"
}

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

export function tryFnWith<T, E>(fn: () => T, handleError: ErrorHandler<E>): Result<T, E> {
	try {
		return Ok(fn())
	} catch (error) {
		return Err(handleError(handleCaughtError(error), error))
	}
}

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

export function tryAsyncFn<T>(fn: () => Promise<T>): ResultPromise<T, CaughtError> {
	return tryPromise(fn())
}

export function tryAsyncFnWith<T, E>(
	fn: () => Promise<T>,
	handleError: ErrorHandler<E>,
): ResultPromise<T, E> {
	return tryPromiseWith(fn(), handleError)
}
