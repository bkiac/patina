import {InvalidErrorPanic, Panic, PropagationPanic, UnwrapPanic} from "./panic"

export type Methods<TValue, TError extends Error> = {
	try(): TValue
	match<V, E>(args: {ok: (value: TValue) => V; err: (error: TError) => E}): V | E
	expect(panicOrMessage: Panic | string): TValue
	unwrapUnsafe(): TValue
	unwrapOr<T>(defaultValue: T): T | TValue
	unwrapOrElse<T>(defaultValue: (error: TError) => T): T | TValue
	unwrapErrUnsafe(): TError
}

export class Ok<TValue = undefined> implements Methods<TValue, never> {
	public readonly ok = true
	public readonly value: TValue
	public readonly error?: never

	constructor()
	constructor(value: TValue)
	constructor(value?: TValue) {
		this.value = value as TValue
	}

	public try() {
		return this.value
	}

	public match<V, E>({ok}: {ok: (value: TValue) => V; err: (error: never) => E}): V | E {
		return ok(this.value)
	}

	public expect() {
		return this.value
	}

	public unwrapUnsafe() {
		return this.value
	}

	public unwrapOr() {
		return this.value
	}

	public unwrapOrElse() {
		return this.value
	}

	public unwrapErrUnsafe(): never {
		throw new UnwrapPanic("Cannot unwrapErr on an Ok")
	}
}

export class Err<TError extends Error> implements Methods<never, TError> {
	public readonly ok = false
	public readonly value?: never
	public readonly error: TError

	public constructor(error: TError)
	public constructor(message: string)
	public constructor(errorOrMessage: unknown) {
		if (errorOrMessage instanceof Panic) {
			throw new Panic("Cannot create an Err from a Panic")
		}
		if (errorOrMessage instanceof Error) {
			this.error = errorOrMessage as TError
		} else if (typeof errorOrMessage === "string") {
			this.error = new Error(errorOrMessage) as TError
		} else {
			this.error = new Error("Unknown Error") as TError
		}
	}

	public expect(panicOrMessage: Panic | string): never {
		if (panicOrMessage instanceof Panic) {
			throw panicOrMessage
		}
		throw new Panic(panicOrMessage)
	}

	public try(): never {
		throw new PropagationPanic(this.error)
	}

	public match<V, E>({err}: {ok: (value: never) => V; err: (error: TError) => E}) {
		return err(this.error)
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

export function handleError(error: unknown) {
	if (error instanceof Panic) {
		throw error
	}
	if (error instanceof Error) {
		return error
	}
	throw new InvalidErrorPanic(error)
}
