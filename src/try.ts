import {PromiseResult} from "./async"
import {ok, err, handleError, type Result} from "./core"

export function tryFn<T>(fn: () => T): Result<T> {
	try {
		return ok(fn())
	} catch (error) {
		return err(handleError(error))
	}
}

export function tryPromise<T>(promise: Promise<T>): PromiseResult<T> {
	return new PromiseResult(
		promise.then(
			(value) => ok(value),
			(error) => err(handleError(error)),
		),
	)
}

export function tryAsyncFn<T>(fn: () => Promise<T>): PromiseResult<T> {
	return tryPromise(fn())
}
