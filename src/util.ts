import type {PromiseResult} from "./result/promise"
import type {Err} from "./result/err"
import type {Ok} from "./result/ok"
import type {Result} from "./result/interface"

export const inspectSymbol = Symbol.for("nodejs.util.inspect.custom")

export type ResultValueErrorType<T> = T extends (...args: any[]) => Ok<infer V> | Err<infer E>
	? [V, E]
	: T extends (...args: any[]) => Result<infer V, infer E>
	? [V, E]
	: never

export type ResultValueType<T> = ResultValueErrorType<T>[0]
export type ResultErrorType<T> = ResultValueErrorType<T>[1]

export type AsyncResultValueErrorType<T> = T extends (
	...args: any[]
) => Promise<Ok<infer V> | Err<infer E>>
	? [V, E]
	: T extends
			| ((...args: any[]) => PromiseResult<infer V, infer E>)
			| ((...args: any[]) => Promise<Result<infer V, infer E>>)
	? [V, E]
	: never

export type AsyncResultValueType<T> = AsyncResultValueErrorType<T>[0]
export type AsyncResultErrorType<T> = AsyncResultValueErrorType<T>[1]
