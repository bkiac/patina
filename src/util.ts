/**
 * Utility types and functions for working with `Result` and `Option` types.
 * @module
 */

import { Err, Ok, type Result } from "./result.ts";
import { None, type Option, Some } from "./option.ts";
import { AsyncResult } from "./async_result.ts";
import { AsyncOption } from "./async_option.ts";

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
 * Extracts the `Ok` type from a `Result`.
 */
export type ExtractOk<T> = T extends Ok<infer O, any> ? O
	: T extends Result<infer O, infer _> ? O
	: never;

/**
 * Extracts the `Err` type from a `Result`.
 */
export type ExtractErr<T> = T extends Err<infer E, any> ? E
	: T extends Result<infer _, infer E> ? E
	: never;

/**
 * Checks if a value is a `Result`.
 */
export function isResult<T, E>(value: unknown): value is Result<T, E> {
	return value instanceof Ok || value instanceof Err;
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
	return value instanceof Some || value instanceof None;
}

/**
 * Checks if a value is an `AsyncOption`.
 */
export function isAsyncOption<T>(value: unknown): value is AsyncOption<T> {
	return value instanceof AsyncOption;
}
