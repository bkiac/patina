import {CaughtNonErrorPanic, Panic, PropagationPanic} from "./panic";

type Methods<TValue> = {
	/**
	 * Unwraps value or throws a special {@link PropagationPanic} that's caught by {@link capture} or {@link captureAsync}.
	 * Use this method to unwrap the value and propagate potential errors up the call stack.
	 */
	propagate: () => TValue;
	/** Unwraps value, if result is an {@link Err} throw `panic`.  */
	expect: (panic: Panic | string) => TValue;
	/** Unwraps the value, and throw if the result is an {@link Err}. */
	unwrap: () => TValue;
	/** Unwraps the error, and throw if the result is an {@link Ok}. */
	unwrapErr: () => Error;
	/** Unwraps with a default value provided. */
	unwrapOr: <T>(defaultValue: T) => T | TValue;
	/** Unwraps with a default value provided by a function. */
	unwrapOrElse: <T>(defaultValue: (error: Error) => T) => T | TValue;
	/** Takes an object with two functions `ok` and `err` and executes the corresponding one based on the result type. */
	match: <T>({ok, err}: {ok: (value: TValue) => T; err: (error: Error) => T}) => T;
	/** Converts the result into a tuple: `[undefined, TValue]` for {@link Ok} and `[Error, undefined]` for {@link Err}. */
	toTuple: () => readonly [undefined, TValue] | readonly [Error, undefined];
};

export interface Ok<T> extends Methods<T> {
	readonly ok: true;
	readonly value: T;
	readonly error?: never;
}

export interface Err extends Methods<never> {
	readonly ok: false;
	readonly value?: never;
	readonly error: Error;
}

/** Represents the result of an operation that can either succeed with a value or fail */
export type Result<T> = Ok<T> | Err;

export function ok<T>(value: T): Ok<T> {
	const getValue = () => value;
	return {
		ok: true,
		value,
		propagate: getValue,
		expect: getValue,
		unwrap: getValue,
		unwrapErr: () => {
			throw new Panic("Cannot unwrap error from Ok result");
		},
		unwrapOr: getValue,
		unwrapOrElse: getValue,
		match: (m) => m.ok(value),
		toTuple: () => [undefined, value],
	};
}

export function err(error: Error | string): Err {
	const errorInstance = error instanceof Error ? error : new Error(error);
	return {
		ok: false,
		error: errorInstance,
		propagate: () => {
			throw new PropagationPanic(errorInstance);
		},
		expect: (panic) => {
			if (panic instanceof Panic) {
				throw panic;
			}
			throw new Panic(panic);
		},
		unwrap: () => {
			throw new Panic(errorInstance);
		},
		unwrapErr: () => errorInstance,
		unwrapOr: (defaultValue) => defaultValue,
		unwrapOrElse: (defaultValue) => defaultValue(errorInstance),
		match: (m) => m.err(errorInstance),
		toTuple: () => [errorInstance, undefined],
	};
}

export function handleError(error: unknown) {
	if (error instanceof Panic) {
		throw error;
	}
	if (error instanceof Error) {
		return error;
	}
	throw new CaughtNonErrorPanic(error);
}
