import type {
	ResultValueType,
	ResultErrorType,
	AsyncResultValueType,
	AsyncResultErrorType,
} from "../util"
import type {Result} from "../result/interface"
import {PromiseResult} from "../result/promise"

export function fn<T extends (...args: any[]) => Result<any, any>>(
	f: T,
): (...args: Parameters<T>) => Result<ResultValueType<T>, ResultErrorType<T>> {
	return f
}

export function asyncFn<T extends (...args: any[]) => Promise<Result<any, any>>>(f: T) {
	return function (...args: Parameters<T>) {
		return new PromiseResult<AsyncResultValueType<T>, AsyncResultErrorType<T>>(f(...args))
	}
}
