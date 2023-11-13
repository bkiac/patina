import type {Result} from "../result/interface"
import {PromiseResult} from "../result/promise"
import type {Err, Ok} from "../internal"

export function fn<A extends any[], T extends any, E extends any>(
	f: (...args: A) => Ok<T> | Err<E>,
): (...args: A) => Result<T, E>
export function fn<A extends any[], T extends any, E extends any>(
	f: (...args: A) => Result<T, E>,
): (...args: A) => Result<T, E>
export function fn<A extends any[], T extends any, E extends any>(
	f: (...args: A) => Ok<T> | Err<E> | Result<T, E>,
): (...args: A) => Result<T, E> {
	return f
}

export function asyncFn<A extends any[], T extends any, E extends any>(
	f: (...args: A) => Promise<Ok<T> | Err<E>>,
): (...args: A) => PromiseResult<T, E>
export function asyncFn<A extends any[], T extends any, E extends any>(
	f: (...args: A) => Promise<Result<T, E>>,
): (...args: A) => PromiseResult<T, E>
export function asyncFn<A extends any[], T extends any, E extends any>(
	f: (...args: A) => PromiseResult<T, E>,
): (...args: A) => PromiseResult<T, E>
export function asyncFn<A extends any[], T extends any, E extends any>(
	f: (...args: A) => Promise<Ok<T> | Err<E> | Result<T, E>> | PromiseResult<T, E>,
): (...args: A) => PromiseResult<T, E> {
	return function (...args: A) {
		return new PromiseResult<T, E>(f(...args))
	}
}
