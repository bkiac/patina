/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import type {Fn, AsyncFn, NeverFn} from "./util"
import {type Result, err, PropagationPanic, Panic, CaughtNonErrorPanic} from "./core"
import type {ValueType} from "./util"
import {isPromiseLike} from "./is-promise-like"

// Unfortunately these utilities mess up the hover type help	in VSCode so I did not use them
// type CapturedResult<T extends Fn> = Result<UnwrapValue<ReturnType<T>>>;
// type CapturedPromiseResult<T extends AsyncFn> = Promise<
// 	Result<UnwrapValue<Awaited<ReturnType<T>>>>
// >;

function handleCaptureError(error: unknown) {
	if (error instanceof PropagationPanic) {
		return error.originalError
	}
	if (error instanceof Error) {
		// Only `PropagationPanic` should be caught by capture, anything else is a bug
		throw new Panic(error)
	}
	throw new CaughtNonErrorPanic(error)
}

export function capture<T extends Fn>(
	fn: T,
): (
	...args: Parameters<T>
) => T extends NeverFn
	? Result<ValueType<ReturnType<T>>>
	: T extends AsyncFn
	? Promise<Result<ValueType<Awaited<ReturnType<T>>>>>
	: Result<ValueType<ReturnType<T>>> {
	return (...args) => {
		try {
			const value = fn(...args)
			if (isPromiseLike(value)) {
				return value.then((v) => v).catch((error) => err(handleCaptureError(error)))
			}
			return value
		} catch (error) {
			return err(handleCaptureError(error))
		}
	}
}
