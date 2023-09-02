import {InvalidErrorPanic, Panic, PropagationPanic, UnwrapPanic} from "./panic"

interface Methods<TValue, TError extends Error> {
	match<V, E>(args: {ok: (value: TValue) => V; err: (error: TError) => E}): V | E
	try(): TValue
	expect(panicOrMessage: Panic | string): TValue
	unwrapUnsafe(): TValue
	unwrapOr<T>(defaultValue: T): T | TValue
	unwrapOrElse<T>(defaultValue: (error: TError) => T): T | TValue
	unwrapErrUnsafe(): TError
}

export class Ok<TValue> implements Methods<TValue, never> {
	public readonly ok = true
	public readonly value: TValue

	public constructor(value: TValue) {
		this.value = value
	}

	public match<V, E>({ok}: {ok: (value: TValue) => V; err: (error: never) => E}): V | E {
		return ok(this.value)
	}

	private unwrap() {
		return this.value
	}

	public try = this.unwrap
	public expect = this.unwrap
	public unwrapUnsafe = this.unwrap
	public unwrapOr = this.unwrap
	public unwrapOrElse = this.unwrap

	public unwrapErrUnsafe(): never {
		throw new UnwrapPanic("Cannot unwrapErr on an Ok")
	}
}

export class Err<TError extends Error> implements Methods<never, TError> {
	public readonly ok = false
	public readonly error: TError

	public constructor(error: TError) {
		this.error = error
	}

	public match<V, E>({err}: {ok: (value: never) => V; err: (error: TError) => E}) {
		return err(this.error)
	}

	public try(): never {
		throw new PropagationPanic(this.error)
	}

	public expect(panicOrMessage: Panic | string): never {
		if (panicOrMessage instanceof Panic) {
			throw panicOrMessage
		}
		throw new Panic(panicOrMessage)
	}

	public unwrapUnsafe(): never {
		throw new UnwrapPanic(this.error)
	}

	public unwrapOr<T>(defaultValue: T) {
		return defaultValue
	}

	public unwrapOrElse<T>(defaultValue: (error: TError) => T) {
		return defaultValue(this.error)
	}

	public unwrapErrUnsafe() {
		return this.error
	}
}

/** Represents the result of an operation that can either succeed with a value or fail */
export type Result<V, E extends Error = Error> = Ok<V> | Err<E>

export function ok(): Ok<undefined>
export function ok<T>(value: T): Ok<T>
export function ok<T>(value?: T) {
	return new Ok(value)
}

export function err<T extends Error>(error: T): Err<T>
export function err(message: string): Err<Error>
export function err(error: unknown) {
	if (error instanceof Panic) {
		throw new Panic("Cannot create an Err from a Panic")
	}
	if (error instanceof Error) {
		return new Err(error)
	}
	if (typeof error === "string") {
		return new Err(new Error(error))
	}
	return new Err(new Error("Unknown Error"))
}

export function handleError(error: unknown) {
	if (error instanceof Panic) {
		throw error
	}
	if (error instanceof Error) {
		return error
	}
	throw new InvalidErrorPanic(error)
}
