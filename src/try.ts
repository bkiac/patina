import {PromiseResult} from "./async"
import {Ok, type Result, Err} from "./core"
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

export function tryFn<T>(fn: () => T): Result<T> {
	try {
		return new Ok(fn())
	} catch (error) {
		return new Err(handleError(error))
	}
}

export function tryPromise<T>(promise: Promise<T>): PromiseResult<T> {
	return new PromiseResult(
		promise.then(
			(value) => new Ok(value),
			(error) => new Err(handleError(error)),
		),
	)
}

export function tryAsyncFn<T>(fn: () => Promise<T>): PromiseResult<T> {
	return tryPromise(fn())
}
