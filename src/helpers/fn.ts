import type {Result} from "../result/result.js"
import {PromiseResult} from "../result/promise.js"
import type {Err, Ok} from "../internal.js"

export function fn<A extends any[], T>(f: (...args: A) => Ok<T>): (...args: A) => Result<T, never>
export function fn<A extends any[], E>(f: (...args: A) => Err<E>): (...args: A) => Result<never, E>
export function fn<A extends any[], T, E>(
	f: (...args: A) => Ok<T> | Err<E>,
): (...args: A) => Result<T, E>
export function fn<A extends any[], T, E>(
	f: (...args: A) => Result<T, E>,
): (...args: A) => Result<T, E>
export function fn<A extends any[], T, E>(
	f: (...args: A) => Result<T, E>,
): (...args: A) => Result<T, E> {
	return f
}

export function asyncFn<A extends any[], T>(
	f: (...args: A) => Promise<Ok<T>>,
): (...args: A) => PromiseResult<T, never>
export function asyncFn<A extends any[], E>(
	f: (...args: A) => Promise<Err<E>>,
): (...args: A) => PromiseResult<never, E>
export function asyncFn<A extends any[], T, E>(
	f: (...args: A) => Promise<Ok<T> | Err<E>>,
): (...args: A) => PromiseResult<T, E>
export function asyncFn<A extends any[], T, E>(
	f: (...args: A) => Promise<Result<T, E>>,
): (...args: A) => PromiseResult<T, E>
export function asyncFn<A extends any[], T, E>(
	f: (...args: A) => PromiseResult<T, E>,
): (...args: A) => PromiseResult<T, E>
export function asyncFn<A extends any[], T, E>(
	f: (...args: A) => Promise<Ok<T> | Err<E> | Result<T, E>> | PromiseResult<T, E>,
): (...args: A) => PromiseResult<T, E> {
	return function (...args: A) {
		return new PromiseResult<T, E>(f(...args))
	}
}
