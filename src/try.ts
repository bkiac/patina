import {Panic} from "./error"
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

export function tryFn<T>(fn: () => T): Result<T, Error> {
	try {
		return Ok(fn())
	} catch (error) {
		return Err(handleCaughtError(error))
	}
}

export function tryFnWith<T, E>(fn: () => T, handleError: ErrorHandler<E>): Result<T, E> {
	try {
		return Ok(fn())
	} catch (error) {
		return Err(handleError(handleCaughtError(error), error))
	}
}

export function tryPromise<T>(promise: Promise<T>): ResultPromise<T, Error> {
	return new ResultPromise<T, Error>(
		promise.then(
			(value) => Ok(value),
			(error: unknown) => Err(parseError(error)),
		),
	)
}

export function tryPromiseWith<T, E>(
	promise: Promise<T>,
	handleError: ErrorHandler<E>,
): ResultPromise<T, E> {
	return new ResultPromise<T, E>(
		promise.then(
			(value) => Ok(value),
			(error: unknown) => Err(handleError(handleCaughtError(error), error)),
		),
	)
}

export function tryAsyncFn<T>(fn: () => Promise<T>): ResultPromise<T, Error> {
	return tryPromise(fn())
}

export function tryAsyncFnWith<T, E>(
	fn: () => Promise<T>,
	handleError: ErrorHandler<E>,
): ResultPromise<T, E> {
	return tryPromiseWith(fn(), handleError)
}
