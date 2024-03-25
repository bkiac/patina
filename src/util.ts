import type {Ok, Err, Result} from "."

export type InferOk<T> = T extends Ok<infer O, any> ? O : never

export type InferErr<T> = T extends Err<infer E, any> ? E : never

export type ExtractOk<T> = T extends Ok<infer O, any>
	? O
	: T extends Result<infer O, infer _>
	? O
	: never

export type ExtractErr<T> = T extends Err<infer E, any>
	? E
	: T extends Result<infer _, infer E>
	? E
	: never
