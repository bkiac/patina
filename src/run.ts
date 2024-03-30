import {ResultPromise} from "./result_promise"
import {type Result, Ok, ResultImpl} from "./result"
import type {InferErr} from "./util"

function isResult<T, E>(value: any): value is Result<T, E> {
	return value instanceof ResultImpl
}

function _run<T extends Result<any, any>, U>(
	fn: () => Generator<T, U, any>,
): Result<U, InferErr<T>> {
	const gen = fn()
	let done = false
	let returnResult = Ok()
	while (!done) {
		const iter = gen.next(returnResult.unwrap())
		if (isResult(iter.value)) {
			if (iter.value.isErr) {
				done = true
				gen.return?.(iter.value as any)
			}
			returnResult = iter.value as any
		} else {
			done = true
			returnResult = Ok(iter.value) as any
		}
	}
	return returnResult as any
}

export function run<T extends Result<any, any>, U>(fn: () => Generator<T, U, any>) {
	// Variable assignment helps with type inference
	const result = _run(fn)
	return result
}

async function toPromiseResult<T, E>(value: any): Promise<Result<T, E>> {
	const awaited = await value
	if (isResult(awaited)) {
		return awaited as any
	}
	return Ok(awaited)
}

function _runAsync<T extends ResultPromise<any, any> | Result<any, any>, U>(
	fn: () => AsyncGenerator<T, U, any>,
): ResultPromise<U, InferErr<Awaited<T>>> {
	const gen = fn()
	const yieldedResultChain = Promise.resolve<Result<any, any>>(Ok()).then(
		async function fulfill(nextResult): Promise<Result<any, any>> {
			const iter = await gen.next(nextResult.unwrap())
			const result = await toPromiseResult(iter.value)
			if (iter.done) {
				return result
			}
			if (result.isErr) {
				gen.return?.(iter.value as any)
				return result
			}
			return Promise.resolve(result).then(fulfill)
		},
	)
	return new ResultPromise(yieldedResultChain)
}

export function runAsync<T extends ResultPromise<any, any> | Result<any, any>, U>(
	fn: () => AsyncGenerator<T, U, any>,
) {
	// Variable assignment helps with type inference
	const result = _runAsync(fn)
	return result
}

export function genFn<A extends any[], R extends Result<any, any>, T>(
	fn: (...args: A) => Generator<R, T, any>,
): (...args: A) => Result<T, InferErr<R>> {
	return function (...args: any[]) {
		return run(() => fn(...(args as A)))
	}
}

export function asyncGenFn<
	A extends any[],
	R extends ResultPromise<any, any> | Result<any, any>,
	T,
>(
	fn: (...args: A) => AsyncGenerator<R, T, any>,
): (...args: A) => ResultPromise<T, InferErr<Awaited<R>>> {
	return function (...args: any[]) {
		return runAsync(() => fn(...(args as A)))
	}
}
