import type {Option} from "./option/interface"
import type {PromiseOption} from "./option/promise"
import type {Result} from "./result/interface"
import type {PromiseResult} from "./result/promise"

export const inspectSymbol = Symbol.for("nodejs.util.inspect.custom")

export type ResultValueErrorType<T> = T extends
	| Result<infer V, infer E>
	| PromiseResult<infer V, infer E>
	| Promise<Result<infer V, infer E>>
	| ((...args: any[]) => Result<infer V, infer E>)
	| ((...args: any[]) => PromiseResult<infer V, infer E>)
	| ((...args: any[]) => Promise<Result<infer V, infer E>>)
	? {value: V; error: E}
	: never
export type ResultValueType<T> = ResultValueErrorType<T>["value"]
export type ResultErrorType<T> = ResultValueErrorType<T>["error"]

export type OptionValueType<T> = T extends
	| Option<infer V>
	| PromiseOption<infer V>
	| Promise<Option<infer V>>
	| ((...args: any[]) => Option<infer V>)
	| ((...args: any[]) => PromiseOption<infer V>)
	| ((...args: any[]) => Promise<Option<infer V>>)
	? V
	: never
