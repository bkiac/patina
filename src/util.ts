import type {Err} from "./result/err"
import type {Ok} from "./result/ok"

export const inspectSymbol = Symbol.for("nodejs.util.inspect.custom")

export type ResultValueErrorType<T> = T extends (...args: any[]) => Ok<infer V> | Err<infer E>
	? {value: V; error: E}
	: never

export type ResultValueType<T> = ResultValueErrorType<T>["value"]
export type ResultErrorType<T> = ResultValueErrorType<T>["error"]

export type AsyncResultValueErrorType<T> = T extends (
	...args: any[]
) => Promise<Ok<infer V> | Err<infer E>>
	? {value: V; error: E}
	: never

export type AsyncResultValueType<T> = AsyncResultValueErrorType<T>["value"]
export type AsyncResultErrorType<T> = AsyncResultValueErrorType<T>["error"]
