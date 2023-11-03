import type {ResultValueType, ResultErrorType} from "../util"
import {type Result, PromiseResult} from "../result"

export function fn<T extends (...args: any[]) => Result<any, any>>(
	f: T,
): (...args: Parameters<T>) => Result<ResultValueType<T>, ResultErrorType<T>> {
	return f
}

export function asyncFn<T extends (...args: any[]) => Promise<Result<any, any>>>(f: T) {
	return function (
		...args: Parameters<T>
	): PromiseResult<ResultValueType<ReturnType<T>>, ResultErrorType<ReturnType<T>>> {
		return new PromiseResult(f(...args))
	}
}
