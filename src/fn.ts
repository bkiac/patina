import type {Result} from "./result"
import {ResultPromise} from "./result_promise"
import type {InferErr, InferOk} from "./util"

export function fn<A extends any[], R extends Result<any, any>>(
	f: (...args: A) => R,
): (...args: A) => Result<InferOk<R>, InferErr<R>> {
	return f
}

export function asyncFn<A extends any[], R extends ResultPromise<any, any>>(
	f: (...args: A) => R,
): (...args: A) => ResultPromise<InferOk<Awaited<R>>, InferErr<Awaited<R>>>
export function asyncFn<A extends any[], R extends Promise<Result<any, any>>>(
	f: (...args: A) => R,
): (...args: A) => ResultPromise<InferOk<Awaited<R>>, InferErr<Awaited<R>>>
export function asyncFn(f: any): any {
	return function (...args: any[]) {
		return new ResultPromise(f(...args))
	}
}
