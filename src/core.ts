import { CaughtNonErrorPanic, Panic, PropagationPanic } from "./panic"

export type Methods<TValue, TError extends Error> = {
	/**
	 * TODO: Fix capture link
	 * Unwraps value or throws a special {@link PropagationPanic} that's caught by {@link capture}.
	 * Use this method to unwrap the value and propagate potential errors up the call stack.
	 */
	propagate(): TValue
	/** Unwraps value, if result is an {@link Err} throw `panic`.  */
	expect(panicOrMessage: Panic | string): TValue
	/** Unwraps the value, and throw if the result is an {@link Err}. */
	unwrap(): TValue
	/** Unwraps with a default value provided. */
	unwrapOr<T>(defaultValue: T): T | TValue
	/** Unwraps with a default value provided by a function. */
	unwrapOrElse<T>(defaultValue: (error: TError) => T): T | TValue
	/** Unwraps the error, and throw if the result is an {@link Ok}. */
	unwrapErr(): TError
	/** Takes an object with two functions `ok` and `err` and executes the corresponding one based on the result type. */
	match<V, E>(args: { ok: (value: TValue) => V; err: (error: TError) => E }): V | E
}

export class Ok<TValue> implements Methods<TValue, never> {
	public readonly ok = true
	public readonly value: TValue
	public readonly error?: never

	public constructor(value: TValue) {
		this.value = value
	}

	public propagate() {
		return this.value
	}

	public expect() {
		return this.value
	}

	public unwrap() {
		return this.value
	}

	public unwrapOr() {
		return this.value
	}

	public unwrapOrElse() {
		return this.value
	}

	public unwrapErr(): never {
		throw new Panic("Cannot unwrap error from Ok result")
	}

	public match<V, E>({ ok }: { ok: (value: TValue) => V; err: (error: never) => E }): V | E {
		return ok(this.value)
	}
}

export class Err<TError extends Error> implements Methods<never, TError> {
	public readonly ok = false
	public readonly value?: never
	public readonly error: TError

	public constructor(error: TError) {
		this.error = error
	}

	public propagate(): never {
		throw new PropagationPanic(this.error)
	}

	public expect(panicOrMessage: Panic | string): never {
		if (panicOrMessage instanceof Panic) {
			throw panicOrMessage
		}
		throw new Panic(panicOrMessage)
	}

	public unwrap(): never {
		throw new Panic(this.error)
	}

	public unwrapErr() {
		return this.error
	}

	public unwrapOr<T>(defaultValue: T) {
		return defaultValue
	}

	public unwrapOrElse<T>(defaultValue: (error: TError) => T) {
		return defaultValue(this.error)
	}

	public match<V, E>({ err }: { ok: (value: never) => V; err: (error: TError) => E }) {
		return err(this.error)
	}
}

/** Represents the result of an operation that can either succeed with a value or fail */
export type Result<V, E extends Error = Error> = Ok<V> | Err<E>

export function ok<T>(value: T) {
	return new Ok(value)
}

export function err(error: string): Err<Error>
export function err<T extends Error>(error: T): Err<T>
export function err(error: any) {
	return new Err(error instanceof Error ? error : new Error(error))
}

export function handleError(error: unknown) {
	if (error instanceof Panic) {
		throw error
	}
	if (error instanceof Error) {
		return error
	}
	throw new CaughtNonErrorPanic(error)
}
