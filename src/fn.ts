import type {Result} from "./result"
import {PromiseResult} from "./promise_result"
import type {Err, Ok} from "./internal"

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
