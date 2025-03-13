/**
 * Utility types and functions for working with `Result` and `Option` types.
 * @module
 */

import { type Err, type Ok, type Result, ResultImpl } from "./result.ts";
import { type Option, OptionImpl, type Some } from "./option.ts";
import { ResultAsync } from "./result_async.ts";
import { OptionAsync } from "./option_async.ts";

/**
 * Infers the `Ok` type from a `Result`.
 */
export type InferOk<T> = T extends Ok<infer O, any> ? O : never;

/**
 * Infers the `Err` type from a `Result`.
 */
export type InferErr<T> = T extends Err<infer E, any> ? E : never;

/**
 * Infers the `Some` type from an `Option`.
 */
export type InferSome<T> = T extends Some<infer S> ? S : never;

/**
 * Checks if a value is a `Result`.
 */
export function isResult<T, E>(value: unknown): value is Result<T, E> {
	return value instanceof ResultImpl;
}

/**
 * Checks if a value is an `ResultAsync`.
 */
export function isResultAsync<T, E>(value: unknown): value is ResultAsync<T, E> {
	return value instanceof ResultAsync;
}

/**
 * Checks if a value is an `Option`.
 */
export function isOption<T>(value: unknown): value is Option<T> {
	return value instanceof OptionImpl;
}

/**
 * Checks if a value is an `OptionAsync`.
 */
export function isOptionAsync<T>(value: unknown): value is OptionAsync<T> {
	return value instanceof OptionAsync;
}
