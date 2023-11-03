import {type ErrorHandler, type ResultError, type StdError, toStdError} from "../error/result_error"
import {Err} from "../result/err"
import type {Result} from "../result/interface"
import {Ok} from "../result/ok"
import {PromiseResult} from "../result/promise"

// Couldn't figure out how to overload these functions without a TypeScript error and making
// the error handler required if the error template param is defined.

export function tryFn<T>(f: () => T): Result<T, StdError> {
	try {
		return Ok(f())
	} catch (error) {
		return Err(toStdError(error))
	}
}

export function tryFnWith<T, E extends ResultError>(
	f: () => T,
	handleError: ErrorHandler<E>,
): Result<T, E> {
	try {
		return Ok(f())
	} catch (error) {
		return Err(handleError(toStdError(error)))
	}
}

export function tryPromise<T>(promise: Promise<T>): PromiseResult<T, StdError> {
	return new PromiseResult(
		promise.then(
			(value) => Ok(value),
			(error: unknown) => Err(toStdError(error)),
		),
	)
}

export function tryPromiseWith<T, E extends ResultError>(
	promise: Promise<T>,
	handleError: ErrorHandler<E>,
): PromiseResult<T, E> {
	return new PromiseResult<T, E>(
		promise.then(
			(value) => Ok(value),
			(error: unknown) => Err(handleError(toStdError(error))),
		),
	)
}

export function tryAsyncFn<T>(f: () => Promise<T>): PromiseResult<T, StdError> {
	return tryPromise(f())
}

export function tryAsyncFnWith<T, E extends ResultError>(
	f: () => Promise<T>,
	handleError: ErrorHandler<E>,
): PromiseResult<T, E> {
	return tryPromiseWith(f(), handleError)
}
