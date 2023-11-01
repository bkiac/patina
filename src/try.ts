import {PromiseResult} from "./promise_result"
import {Ok, type Result, Err} from "./result"
import {InvalidErrorPanic, Panic} from "./panic"

export function handleError(error: unknown) {
	if (error instanceof Panic) {
		throw error
	}
	if (error instanceof Error) {
		return error
	}
	throw new InvalidErrorPanic(error)
}

export function tryFn<T>(fn: () => T): Result<T, Error> {
	try {
		return Ok(fn())
	} catch (error) {
		return Err(handleError(error))
	}
}

export function tryPromise<T>(promise: Promise<T>): PromiseResult<T, Error> {
	return new PromiseResult(
		promise.then(
			(value) => Ok(value),
			(error) => Err(handleError(error)),
		),
	)
}

export function tryAsyncFn<T>(fn: () => Promise<T>): PromiseResult<T, Error> {
	return tryPromise(fn())
}
