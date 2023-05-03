import {ok, err, handleError, type Result} from "./core"
import {isPromiseLike} from "./is-promise-like"

async function settle<T>(promise: Promise<T>): Promise<Result<T>> {
	try {
		return ok<T>(await promise)
	} catch (error) {
		return err(handleError(error)) as Result<T>
	}
}

export function tryCatch<T>(promise: Promise<T>): Promise<Result<T>>
export function tryCatch(fn: () => never): Result<never>
export function tryCatch<T>(fn: () => Promise<T>): Promise<Result<T>>
export function tryCatch<T>(fn: () => T): Result<T>
export function tryCatch<T>(
	promiseOrFn: Promise<T> | (() => Promise<T>) | (() => T),
): Result<T> | Promise<Result<T>> {
	try {
		if (isPromiseLike(promiseOrFn)) {
			return settle(promiseOrFn)
		}
		const value = promiseOrFn()
		if (isPromiseLike(value)) {
			return settle(value)
		}
		return ok<T>(value)
	} catch (error) {
		return err(handleError(error))
	}
}
