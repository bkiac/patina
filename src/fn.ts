import type {Result} from "./result"
import {PromiseResult} from "./promise_result"
import type {InferErr, InferOk} from "./internal"

export function fn<A extends any[], R extends Result<any, any>>(
	f: (...args: A) => R,
): (...args: A) => Result<InferOk<R>, InferErr<R>> {
	return f
}

export function asyncFn<A extends any[], R extends PromiseResult<any, any>>(
	f: (...args: A) => R,
): (...args: A) => PromiseResult<InferOk<Awaited<R>>, InferErr<Awaited<R>>>
export function asyncFn<A extends any[], R extends Promise<Result<any, any>>>(
	f: (...args: A) => R,
): (...args: A) => PromiseResult<InferOk<Awaited<R>>, InferErr<Awaited<R>>>
export function asyncFn(f: any): any {
	return function (...args: any[]) {
		return new PromiseResult(f(...args))
	}
}
