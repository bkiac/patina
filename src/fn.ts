import type {ErrorType} from "./util"
import {type Result} from "./result"
import type {ValueType} from "./util"
import {PromiseResult} from "./promise_result"

export function fn<T extends (...args: any[]) => Result<any, any>>(fn: T) {
	return function (...args) {
		return fn(...args)
	} as T
}

export function asyncFn<T extends (...args: any[]) => Promise<Result<any, any>>>(fn: T) {
	return function (
		...args: Parameters<T>
	): PromiseResult<ValueType<ReturnType<T>>, ErrorType<ReturnType<T>>> {
		return new PromiseResult(fn(...args))
	}
}
