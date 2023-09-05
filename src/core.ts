import {InvalidErrorPanic, Panic, PropagationPanic, UnwrapPanic} from "./panic"

interface Methods<TValue, TError extends Error> {
	match<V, E>(args: {ok: (value: TValue) => V; err: (error: TError) => E}): V | E
	tap(): TValue
	expect(panicOrMessage: Panic | string): TValue
	unwrapUnsafe(): TValue
	unwrapOr<T>(defaultValue: T): T | TValue
	unwrapOrElse<T>(defaultValue: (error: TError) => T): T | TValue
	unwrapErrUnsafe(): TError
}

export class Ok<TValue = undefined> implements Methods<TValue, never> {
	readonly ok = true
	readonly value: TValue

	constructor()
	constructor(value: TValue)
	constructor(value?: TValue) {
		this.value = value as TValue
	}

	match<V, E>({ok}: {ok: (value: TValue) => V; err: (error: never) => E}): V | E {
		return ok(this.value)
	}

	private unwrap() {
		return this.value
	}

	tap = this.unwrap
	expect = this.unwrap
	unwrapUnsafe = this.unwrap
	unwrapOr = this.unwrap
	unwrapOrElse = this.unwrap

	unwrapErrUnsafe(): never {
		throw new UnwrapPanic("Cannot unwrapErr on an Ok")
	}
}

export class Err<TError extends Error> implements Methods<never, TError> {
	readonly ok = false
	readonly error: TError

	constructor(error: TError)
	constructor(message: string)
	constructor(errorOrMessage: unknown) {
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

	match<V, E>({err}: {ok: (value: never) => V; err: (error: TError) => E}) {
		return err(this.error)
	}

	tap(): never {
		throw new PropagationPanic(this.error)
	}

	expect(panicOrMessage: Panic | string): never {
		if (panicOrMessage instanceof Panic) {
			throw panicOrMessage
		}
		throw new Panic(panicOrMessage)
	}

	unwrapUnsafe(): never {
		throw new UnwrapPanic(this.error)
	}

	unwrapOr<T>(defaultValue: T) {
		return defaultValue
	}

	unwrapOrElse<T>(defaultValue: (error: TError) => T) {
		return defaultValue(this.error)
	}

	unwrapErrUnsafe() {
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
