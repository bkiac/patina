import type {ErrorType} from "./util"
import {type Result, err} from "./core"
import type {ValueType} from "./util"
import {PropagationPanic, Panic, CaughtNonErrorPanic} from "./panic"
import {PromiseResult} from "./async"

function handleCaptureError(error: unknown) {
	if (error instanceof PropagationPanic) {
		return error.originalError
	}
	if (error instanceof Error) {
		// Only `PropagationPanic` should be caught by capture, anything else is a bug
		throw new Panic(error)
	}
	throw new CaughtNonErrorPanic(error)
}

export function fn<T extends (...args: any[]) => Result<any, any>>(fn: T) {
	return function (...args) {
		try {
			return fn(...args)
		} catch (error) {
			return err(handleCaptureError(error))
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
			return new PromiseResult(Promise.resolve(err(handleCaptureError(error))))
		}
	}
}
