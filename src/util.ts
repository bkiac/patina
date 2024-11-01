import { type Err, type Ok, type Result, ResultImpl } from "./result.ts";
import { type Option, OptionImpl } from "./option.ts";
import { ResultAsync } from "./result_async.ts";
import { OptionAsync } from "./option_async.ts";

export type InferOk<T> = T extends Ok<infer O, any> ? O : never;

export type InferErr<T> = T extends Err<infer E, any> ? E : never;

export type ExtractOk<T> = T extends Ok<infer O, any> ? O
	: T extends Result<infer O, infer _> ? O
	: never;

export type ExtractErr<T> = T extends Err<infer E, any> ? E
	: T extends Result<infer _, infer E> ? E
	: never;

export function isResult<T, E>(value: unknown): value is Result<T, E> {
	return value instanceof ResultImpl;
}

export function isResultAsync<T, E>(value: unknown): value is ResultAsync<T, E> {
	return value instanceof ResultAsync;
}

export function isAsyncResult<T, E>(value: unknown): value is ResultAsync<T, E> {
	return value instanceof ResultAsync;
}

export function isOption<T>(value: unknown): value is Option<T> {
	return value instanceof OptionImpl;
}

export function isOptionAsync<T>(value: unknown): value is OptionAsync<T> {
	return value instanceof OptionAsync;
}

export function isAsyncOption<T>(value: unknown): value is OptionAsync<T> {
	return value instanceof OptionAsync;
}
