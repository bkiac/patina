import {CaughtError, tryAsyncFn, tryFn, tryPromise} from "./try";

export function guard<A extends any[], T>(fn: (...args: A) => T) {
	return function (...args: A) {
		return tryFn<T>(() => fn(...args));
	};
}

export function guardWith<A extends any[], T, E>(
	fn: (...args: A) => T,
	mapErr: (error: CaughtError) => E,
) {
	return function (...args: A) {
		return tryFn<T>(() => fn(...args)).mapErr(mapErr);
	};
}

export function guardAsync<A extends any[], T>(fn: (...args: A) => Promise<T>) {
	return function (...args: A) {
		return tryAsyncFn<T>(() => fn(...args));
	};
}

export function guardAsyncWith<A extends any[], T, E>(
	fn: (...args: A) => Promise<T>,
	mapErr: (error: CaughtError) => E,
) {
	return function (...args: A) {
		return tryPromise<T>(fn(...args)).mapErr(mapErr);
	};
}
