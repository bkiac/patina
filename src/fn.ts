import type {ResultErrorType} from "./util"
import {type Result} from "./result"
import type {ResultValueType} from "./util"
import {PromiseResult} from "./promise_result"

export type Fn = (...args: any[]) => Result<any, any>

export function fn<T extends Fn>(fn: T) {
	return function (...args) {
		return fn(...args)
	} as T
}

export function asyncFn<T extends (...args: any[]) => Promise<Result<any, any>>>(fn: T) {
	return function (
		...args: Parameters<T>
	): PromiseResult<ResultValueType<ReturnType<T>>, ResultErrorType<ReturnType<T>>> {
		return new PromiseResult(fn(...args))
	}
}
