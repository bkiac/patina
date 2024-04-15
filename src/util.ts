import {ResultImpl, type Ok, type Err, type Result} from "./result";
import {OptionImpl, type Option} from "./option";
import {AsyncResult} from "./async_result";
import {AsyncOption} from "./async_option";

export type InferOk<T> = T extends Ok<infer O, any> ? O : never;

export type InferErr<T> = T extends Err<infer E, any> ? E : never;

export type ExtractOk<T> = T extends Ok<infer O, any>
	? O
	: T extends Result<infer O, infer _>
	? O
	: never;

export type ExtractErr<T> = T extends Err<infer E, any>
	? E
	: T extends Result<infer _, infer E>
	? E
	: never;

export function isResult<T, E>(value: unknown): value is Result<T, E> {
	return value instanceof ResultImpl;
}

export function isAsyncResult<T, E>(value: unknown): value is AsyncResult<T, E> {
	return value instanceof AsyncResult;
}

export function isOption<T>(value: unknown): value is Option<T> {
	return value instanceof OptionImpl;
}

export function isAsyncOption<T>(value: unknown): value is AsyncOption<T> {
	return value instanceof AsyncOption;
}
