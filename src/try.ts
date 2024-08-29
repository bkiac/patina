import {AsyncResult} from "./async_result";
import {type Result, type Err} from "./result";

export function tryBlock<T, E>(scope: () => Generator<Err<E, never>, Result<T, E>>): Result<T, E> {
	return scope().next().value;
}

export function tryBlockAsync<T, E>(
	scope: () => AsyncGenerator<Err<E, never>, Result<T, E>>,
): AsyncResult<T, E> {
	const next = scope().next();
	return new AsyncResult(next.then((result) => result.value));
}
