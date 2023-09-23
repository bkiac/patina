import {InvalidErrorPanic, Panic, PropagationPanic, UnwrapPanic} from "./panic"

export type MatchArgs<T, E, A, B> = {ok: (value: T) => A; err: (error: E) => B}

interface Methods<T, E extends Error> {
	and<U, E2 extends Error>(other: Result<U, E2>): Result<U, E | E2>
	andThen<U, E2 extends Error>(f: (value: T) => Result<U, E2>): Result<U, E | E2>
	expect(panic: Panic | string): T
	expectErr(panic: Panic | string): E
	inspect(f: (value: T) => void): Result<T, E>
	inspectErr(f: (error: E) => void): Result<T, E>
	map<U>(f: (value: T) => U): Result<U, E>
	mapErr<E2 extends Error>(f: (error: E) => E2): Result<T, E2>
	mapOr<U>(defaultValue: U, f: (value: T) => U): U
	mapOrElse<U>(defaultValue: (error: E) => U, f: (value: T) => U): U
	unwrap(): T
	unwrapOr<U>(defaultValue: U): T | U
	unwrapOrElse<U>(defaultValue: (error: E) => U): T | U
	unwrapErr(): E
	match<A, B>(args: MatchArgs<T, E, A, B>): A | B
	tap(): T
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

	and<U, E2 extends Error>(other: Result<U, E2>) {
		return other
	}

	andThen<U, E2 extends Error>(f: (value: T) => Result<U, E2>) {
		return f(this.value)
	}

	expect = this.unwrap

	expectErr(panic: string | Panic): never {
		if (panic instanceof Panic) {
			throw panic
		}
		throw new Panic(panic)
	}

	inspect(f: (value: T) => void) {
		f(this.value)
		return this
	}

	inspectErr() {
		return this
	}

	map<U>(f: (value: T) => U) {
		return new Ok(f(this.value))
	}

	mapErr() {
		return this
	}

	mapOr<U>(_defaultValue: U, f: (value: T) => U) {
		return f(this.value)
	}

	mapOrElse<U>(_defaultValue: (error: never) => U, f: (value: T) => U): U {
		return f(this.value)
	}

	unwrap() {
		return this.value
	}

	unwrapOr = this.unwrap

	unwrapOrElse = this.unwrap

	unwrapErr(): never {
		throw new UnwrapPanic("Cannot unwrapErr on an Ok")
	}

	match<A, B>({ok}: MatchArgs<T, never, A, B>) {
		return ok(this.value)
	}

	tap = this.unwrap
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

	and<U, E2 extends Error>(_other: Result<U, E2>) {
		return this
	}

	andThen<U, E2 extends Error>(_f: (value: never) => Result<U, E2>) {
		return this
	}

	expect(panic: Panic | string): never {
		if (panic instanceof Panic) {
			throw panic
		}
		throw new Panic(panic)
	}

	expectErr() {
		return this.error
	}

	inspect() {
		return this
	}

	inspectErr(f: (error: E) => void) {
		f(this.error)
		return this
	}

	map() {
		return this
	}

	mapErr<E2 extends Error>(f: (error: E) => E2) {
		return new Err(f(this.error))
	}

	mapOr<U>(defaultValue: U, _f: (value: never) => U) {
		return defaultValue
	}

	mapOrElse<U>(defaultValue: (error: E) => U, _f: (value: never) => U): U {
		return defaultValue(this.error)
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

	match<A, B>({err}: MatchArgs<never, E, A, B>) {
		return err(this.error)
	}

	tap(): never {
		throw new PropagationPanic(this.error)
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
