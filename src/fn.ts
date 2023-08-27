import type {ErrorType} from "./util"
import {type Result, err} from "./core"
import type {ValueType} from "./util"
import {UnwrapPanic, Panic, InvalidErrorPanic} from "./panic"
import {PromiseResult} from "./async"

function handleUnwrapPanic(error: unknown) {
	if (error instanceof UnwrapPanic) {
		return error.originalError
	}
	// Encountering any other error is a bug, we panic
	if (error instanceof Error) {
		throw new Panic(error)
	}
	throw new InvalidErrorPanic(error)
}

export function fn<T extends (...args: any[]) => Result<any, any>>(fn: T) {
	return function (...args) {
		try {
			return fn(...args)
		} catch (error) {
			return err(handleUnwrapPanic(error))
		}
	} as T
}

export function asyncFn<T extends (...args: any[]) => Promise<Result<any, any>>>(fn: T) {
	return function (
		...args: Parameters<T>
	): PromiseResult<ValueType<ReturnType<T>>, ErrorType<ReturnType<T>>> {
		try {
			return new PromiseResult(fn(...args))
		} catch (error) {
			return new PromiseResult(Promise.resolve(err(handleUnwrapPanic(error))))
		}
	}
}
