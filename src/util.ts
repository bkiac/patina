/**
 * Utility types and functions for working with `Result` and `Option` types.
 * @module
 */

import { type Err, ErrImpl, type Ok, OkImpl, type Result } from "./result.ts";
import { None, type Option, type Some, SomeImpl } from "./option.ts";
import { AsyncResult } from "./async_result.ts";
import { AsyncOption } from "./async_option.ts";

/**
 * Infers the `Ok` type from a `Result`.
 */
export type InferOk<T> = T extends Ok<infer O, any> ? O : T extends Ok<infer O, never> ? O : never;

/**
 * Infers the `Err` type from a `Result`.
 */
export type InferErr<T> = T extends Err<infer E, any> ? E
	: T extends Err<infer E, never> ? E
	: never;

/**
 * Infers the `Some` type from an `Option`.
 */
export type InferSome<T> = T extends Some<infer S> ? S : never;

/**
 * Checks if a value is a `Result`.
 */
export function isResult<T, E>(value: unknown): value is Result<T, E> {
	return value instanceof OkImpl || value instanceof ErrImpl;
}

/**
 * Checks if a value is an `AsyncResult`.
 */
export function isAsyncResult<T, E>(value: unknown): value is AsyncResult<T, E> {
	return value instanceof AsyncResult;
}

/**
 * Checks if a value is an `Option`.
 */
export function isOption<T>(value: unknown): value is Option<T> {
	return value === None || value instanceof SomeImpl;
}

/**
 * Checks if a value is an `AsyncOption`.
 */
export function isAsyncOption<T>(value: unknown): value is AsyncOption<T> {
	return value instanceof AsyncOption;
}
