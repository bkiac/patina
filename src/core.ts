import {InvalidErrorPanic, Panic, PropagationPanic, UnwrapPanic} from "./panic"

export type MatchArgs<T, E, A, B> = {ok: (value: T) => A; err: (error: E) => B}

interface Methods<T, E extends Error> {
	and<U, F extends Error>(other: Result<U, F>): Result<U, E | F>
	match<A, B>(args: MatchArgs<T, E, A, B>): A | B
	tap(): T
	expect(panic: Panic | string): T
	unwrap(): T
	unwrapOr<U>(defaultValue: U): T | U
	unwrapOrElse<U>(defaultValue: (error: E) => U): T | U
	unwrapErr(): E
}

export class Ok<T = undefined> implements Methods<T, never> {
	readonly ok = true
	readonly value: T
	readonly error?: never

	constructor()
	constructor(value: T)
	constructor(value?: T) {
		this.value = value as T
	}

	and<U, F extends Error>(other: Result<U, F>) {
		return other
	}

	match<A, B>({ok}: MatchArgs<T, never, A, B>) {
		return ok(this.value)
	}

	unwrap() {
		return this.value
	}

	tap = this.unwrap
	expect = this.unwrap
	unwrapOr = this.unwrap
	unwrapOrElse = this.unwrap

	unwrapErr(): never {
		throw new UnwrapPanic("Cannot unwrapErr on an Ok")
	}
}

export class Err<E extends Error> implements Methods<never, E> {
	readonly ok = false
	readonly value?: never
	readonly error: E

	constructor(error: E)
	constructor(message: string)
	constructor(errorOrMessage: unknown) {
		if (errorOrMessage instanceof Panic) {
			throw new Panic("Cannot create an Err from a Panic")
		}
		if (errorOrMessage instanceof Error) {
			this.error = errorOrMessage as E
		} else if (typeof errorOrMessage === "string") {
			this.error = new Error(errorOrMessage) as E
		} else {
			this.error = new Error("Unknown Error") as E
		}
	}

	and<U, F extends Error>(_other: Result<U, F>) {
		return this
	}

	match<A, B>({err}: MatchArgs<never, E, A, B>) {
		return err(this.error)
	}

	tap(): never {
		throw new PropagationPanic(this.error)
	}

	expect(panic: Panic | string): never {
		if (panic instanceof Panic) {
			throw panic
		}
		throw new Panic(panic)
	}

	unwrap(): never {
		throw new UnwrapPanic(this.error)
	}

	unwrapOr<U>(defaultValue: U) {
		return defaultValue
	}

	unwrapOrElse<U>(defaultValue: (error: E) => U) {
		return defaultValue(this.error)
	}

	unwrapErr() {
		return this.error
	}
}

/** Represents the result of an operation that can either succeed with a value or fail */
export type Result<T, E extends Error = Error> = Ok<T> | Err<E>

export function handleError(error: unknown) {
	if (error instanceof Panic) {
		throw error
	}
	if (error instanceof Error) {
		return error
	}
	throw new InvalidErrorPanic(error)
}
