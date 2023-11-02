import type {ResultErrorType} from "./util"
import {type Result} from "./result"
import type {ResultValueType} from "./util"
import {PromiseResult} from "./promise_result"

export function fn<T extends (...args: any[]) => Result<any, any>>(f: T) {
	return f
}

export function asyncFn<T extends (...args: any[]) => Promise<Result<any, any>>>(f: T) {
	return function (
		...args: Parameters<T>
	): PromiseResult<ResultValueType<ReturnType<T>>, ResultErrorType<ReturnType<T>>> {
		return new PromiseResult(f(...args))
	}
}
