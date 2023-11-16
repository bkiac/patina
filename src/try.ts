import {Panic} from "./panic"
import {type ErrorHandler, StdError} from "./result_error"
import {Err, Ok, type Result} from "./result"
import {PromiseResult} from "./promise_result"

function handlePanic(error: unknown) {
	if (error instanceof Panic) {
		throw error
	}
	return error
}

export function tryFn<T>(f: () => T): Result<T, StdError> {
	try {
		return Ok(f())
	} catch (error) {
		return Err(new StdError(error))
	}
}

export function tryFnWith<T, E>(f: () => T, handleError: ErrorHandler<E>): Result<T, E> {
	try {
		return Ok(f())
	} catch (error) {
		return Err(handleError(handlePanic(error)))
	}
}

export function tryPromise<T>(promise: Promise<T>): PromiseResult<T, StdError> {
	return new PromiseResult<T, StdError>(
		promise.then(
			(value) => Ok(value),
			(error: unknown) => Err(new StdError(error)),
		),
	)
}

export function tryPromiseWith<T, E>(
	promise: Promise<T>,
	handleError: ErrorHandler<E>,
): PromiseResult<T, E> {
	return new PromiseResult<T, E>(
		promise.then(
			(value) => Ok(value),
			(error: unknown) => Err(handleError(handlePanic(error))),
		),
	)
}

export function tryAsyncFn<T>(f: () => Promise<T>): PromiseResult<T, StdError> {
	return tryPromise(f())
}

export function tryAsyncFnWith<T, E>(
	f: () => Promise<T>,
	handleError: ErrorHandler<E>,
): PromiseResult<T, E> {
	return tryPromiseWith(f(), handleError)
}
