import {CaughtNonErrorPanic, Panic, PropagationPanic} from "./panic"

type Methods<TValue> = {
	/**
	 * Unwraps value or throws a special {@link PropagationPanic} that's caught by {@link capture}.
	 * Use this method to unwrap the value and propagate potential errors up the call stack.
	 */
	propagate: () => TValue
	/** Unwraps value, if result is an {@link Err} throw `panic`.  */
	expect: (panicOrMessage: Panic | string) => TValue
	/** Unwraps the value, and throw if the result is an {@link Err}. */
	unwrap: () => TValue
	/** Unwraps the error, and throw if the result is an {@link Ok}. */
	unwrapErr: () => Error
	/** Unwraps with a default value provided. */
	unwrapOr: <T>(defaultValue: T) => T | TValue
	/** Unwraps with a default value provided by a function. */
	unwrapOrElse: <T>(defaultValue: (error: Error) => T) => T | TValue
	/** Takes an object with two functions `ok` and `err` and executes the corresponding one based on the result type. */
	match: <O, E>({ok, err}: {ok: (value: TValue) => O; err: (error: Error) => E}) => O | E
}

export class Ok<T> implements Methods<T> {
	public readonly ok = true
	public readonly value: T
	public readonly error?: never

	public constructor(value: T) {
		this.value = value
	}

	public propagate = () => this.value

	public expect = () => this.value

	public unwrap = () => this.value

	public unwrapErr = () => {
		throw new Panic("Cannot unwrap error from Ok result")
	}

	public unwrapOr = () => this.value

	public unwrapOrElse = () => this.value

	public match = <O, E>(m: {ok: (value: T) => O; err: (error: Error) => E}): O | E =>
		m.ok(this.value)
}

export class Err implements Methods<never> {
	public readonly ok = false
	public readonly value?: never
	public readonly error: Error

	public constructor(errorOrMessage: Error | string) {
		this.error = errorOrMessage instanceof Error ? errorOrMessage : new Error(errorOrMessage)
	}

	public propagate = () => {
		throw new PropagationPanic(this.error)
	}

	public expect = (panicOrMessage: Panic | string) => {
		if (panicOrMessage instanceof Panic) {
			throw panicOrMessage
		}
		throw new Panic(panicOrMessage)
	}

	public unwrap = () => {
		throw new Panic(this.error)
	}

	public unwrapErr = () => this.error

	public unwrapOr = <T>(defaultValue: T) => defaultValue

	public unwrapOrElse = <T>(defaultValue: (error: Error) => T) => defaultValue(this.error)

	public match = <O, E>(m: {ok: (value: never) => O; err: (error: Error) => E}) => m.err(this.error)
}

/** Represents the result of an operation that can either succeed with a value or fail */
export type Result<T> = Ok<T> | Err

export function ok<T>(value: T): Ok<T> {
	return new Ok(value)
}

export function err(error: Error | string): Err {
	return new Err(error)
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
