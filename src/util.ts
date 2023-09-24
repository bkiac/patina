import type {PromiseResult} from "./promise_result"
import type {Result} from "./result"

export type ValueErrorType<T> = T extends
	| Result<infer V, infer E>
	| PromiseResult<infer V, infer E>
	| Promise<Result<infer V, infer E>>
	| ((...args: any[]) => Result<infer V, infer E>)
	| ((...args: any[]) => PromiseResult<infer V, infer E>)
	| ((...args: any[]) => Promise<Result<infer V, infer E>>)
	? {value: V; error: E}
	: never
export type ValueType<T> = ValueErrorType<T>["value"]
export type ErrorType<T> = ValueErrorType<T>["error"]

export type Fn = (...args: any[]) => any
export type AsyncFn = (...args: any[]) => Promise<any>
