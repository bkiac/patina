import {ok, err, handleError, type Result} from "./core"

export function tryFn<T>(fn: () => T): Result<T> {
	try {
		return ok(fn())
	} catch (error) {
		return err(handleError(error))
	}
}

export async function tryPromise<T>(promise: Promise<T>): Promise<Result<T>> {
	try {
		return ok(await promise)
	} catch (error) {
		return err(handleError(error))
	}
}

export async function tryAsyncFn<T>(fn: () => Promise<T>): Promise<Result<T>> {
	return tryPromise(fn())
}
