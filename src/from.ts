import {PromiseResult} from "./async"
import {Ok, handleError, type Result, Err} from "./core"

export function fromFn<T>(fn: () => T): Result<T> {
	try {
		return new Ok(fn())
	} catch (error) {
		return new Err(handleError(error))
	}
}

export function fromPromise<T>(promise: Promise<T>): PromiseResult<T> {
	return new PromiseResult(
		promise.then(
			(value) => new Ok(value),
			(error) => new Err(handleError(error)),
		),
	)
}

export function fromAsyncFn<T>(fn: () => Promise<T>): PromiseResult<T> {
	return fromPromise(fn())
}
