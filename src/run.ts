import {ResultPromise} from "./result_promise"
import {type Result, Ok, ResultImpl} from "./result"
import type {InferErr} from "./util"

function isResult<T, E>(value: any): value is Result<T, E> {
	return value instanceof ResultImpl
}

export function run<T extends Result<any, any>, U>(
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

type TODO = any

async function toPromiseResult<T, E>(value: TODO): Promise<Result<T, E>> {
	const awaited = await value
	if (isResult(awaited)) {
		return awaited as any
	} else if (awaited instanceof ResultPromise) {
		return awaited.promise
	}
	return Ok(awaited)
}

export function runAsync<T extends ResultPromise<any, any> | Result<any, any>, U>(
	fn: () => AsyncGenerator<T, U, any>,
): ResultPromise<U, InferErr<Awaited<T>>> {
	async function exec(): Promise<Result<any, any>> {
		const gen = fn()
		return new ResultPromise<any, any>(Promise.resolve(Ok())).then(
			async function andThen(value): Promise<ResultPromise<any, any> | Result<any, any>> {
				const iter = await gen.next(value.unwrap())
				const result = await toPromiseResult(iter.value)
				if (iter.done) {
					return result
				}
				if (result.isErr) {
					gen.return?.(iter.value as any)
					return result
				}
				return new ResultPromise(Promise.resolve(result)).then(andThen)
			},
		)
	}
	return new ResultPromise(exec())
}
