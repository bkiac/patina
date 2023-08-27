/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-return */

import type {Fn, AsyncFn, NeverFn} from "@/util/types"
import type {Result} from "./sync"
import {tryCatch} from "./try"

export function guard<T extends Fn>(
	fn: T,
): (
	...args: Parameters<T>
) => T extends NeverFn
	? Result<ReturnType<T>>
	: T extends AsyncFn
	? Promise<Result<Awaited<ReturnType<T>>>>
	: Result<ReturnType<T>> {
	return (...args) => tryCatch(() => fn(...args)) as any
}
