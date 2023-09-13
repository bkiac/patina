import {type Result, Err} from "./core"
import type {ValueType} from "./util"
import {Panic, InvalidErrorPanic, PropagationPanic} from "./panic"
import {PromiseResult} from "./async"

function handlePropagationPanic(error: unknown) {
	if (error instanceof PropagationPanic) {
		return error.originalError
	}
	// Encountering any other error is a bug, we panic
	if (error instanceof Error) {
		throw new Panic(error)
	}
	throw new InvalidErrorPanic(error)
}

export function fn<T extends (...args: any[]) => Result<any>>(fn: T) {
	return function (...args) {
		try {
			return fn(...args)
		} catch (error) {
			return new Err(handlePropagationPanic(error))
		}
	} as T
}

export function asyncFn<T extends (...args: any[]) => Promise<Result<any>>>(fn: T) {
	return function (...args: Parameters<T>): PromiseResult<ValueType<ReturnType<T>>> {
		async function withUnwrapCaught() {
			try {
				return await fn(...args)
			} catch (error) {
				return new Err(handlePropagationPanic(error))
			}
		}
		return new PromiseResult(withUnwrapCaught())
	}
}
