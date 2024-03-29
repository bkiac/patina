import {type Result, Ok, Err, ResultImpl} from "./result"
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
