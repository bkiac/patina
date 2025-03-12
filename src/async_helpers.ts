import { AsyncResult } from "./async_result.ts";
import { AsyncOption } from "./async_option.ts";
import { Err, Ok } from "./result.ts";
import { None, Some } from "./option.ts";

export function AsyncOk<T, E = any>(value: T): AsyncResult<T, E> {
	return new AsyncResult(Promise.resolve(Ok(value)));
}

export function AsyncErr<E, T = any>(error: E): AsyncResult<T, E> {
	return new AsyncResult(Promise.resolve(Err(error)));
}

export function AsyncSome<T>(value: T): AsyncOption<T> {
	return new AsyncOption(Promise.resolve(Some(value)));
}

export const AsyncNone: AsyncOption<never> = new AsyncOption(Promise.resolve(None));
