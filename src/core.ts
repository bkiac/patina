import {InvalidErrorPanic, Panic, PropagationPanic, UnwrapPanic} from "./panic"

export type OkVariant<T> = {
	ok: true
	value: T
	error?: never
}

export type ErrVariant<E extends Error> = {
	ok: false
	value?: never
	error: E
}

export type ResultVariants<T, E extends Error> = OkVariant<T> | ErrVariant<E>

export type Result<T, E extends Error = Error> = ResultMethods<T, E> & ResultVariants<T, E>

export interface ResultMethods<T, E extends Error> {
	and<U, E2 extends Error>(other: Result<U, E2>): Result<U, E | E2>
	andThen<U, E2 extends Error>(f: (value: T) => Result<U, E2>): Result<U, E | E2>
	expect(panic: string | Panic): T
	expectErr(panic: string | Panic): E
	inspect(f: (value: T) => void): Result<T, E>
	inspectErr(f: (error: E) => void): Result<T, E>
	map<U>(f: (value: T) => U): Result<U, E>
	mapErr<E2 extends Error>(f: (error: E) => E2): Result<T, E2>
	mapOr<U>(defaultValue: U, f: (value: T) => U): U
	mapOrElse<U>(defaultValue: (error: E) => U, f: (value: T) => U): U
	or<U, E2 extends Error>(other: Result<U, E2>): Result<T | U, E | E2>
	orElse<U, E2 extends Error>(f: (error: E) => Result<U, E2>): Result<T | U, E | E2>
	unwrap(): T
	unwrapErr(): E
	unwrapOr<U>(defaultValue: U): T | U
	unwrapOrElse<U>(defaultValue: (error: E) => U): T | U
	match<A, B>(ok: (value: T) => A, err: (error: E) => B): A | B
	tap(): T
}

export class Ok<T = undefined> implements OkVariant<T>, ResultMethods<T, never> {
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

	expect(_panic: string | Panic) {
		return this.value
	}

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

	inspectErr(_f: (error: never) => void) {
		return this
	}

	map<U>(f: (value: T) => U) {
		return new Ok(f(this.value))
	}

	mapErr(_f: (error: never) => never) {
		return this
	}

	mapOr<U>(_defaultValue: U, f: (value: T) => U) {
		return f(this.value)
	}

	mapOrElse<U>(_defaultValue: (error: never) => U, f: (value: T) => U): U {
		return f(this.value)
	}

	or<U, E2 extends Error>(_other: Result<U, E2>) {
		return this
	}

	orElse<U, E2 extends Error>(_f: (error: never) => Result<U, E2>) {
		return this
	}

	unwrap() {
		return this.value
	}

	unwrapErr(): never {
		throw new UnwrapPanic("Cannot unwrapErr on an Ok")
	}

	unwrapOr<U>(_defaultValue: U) {
		return this.value
	}

	unwrapOrElse<U>(_defaultValue: (error: never) => U) {
		return this.value
	}

	match<A, B>(ok: (value: T) => A, _err: (error: never) => B) {
		return ok(this.value)
	}

	tap() {
		return this.value
	}
}

export class Err<E extends Error> implements ErrVariant<E>, ResultMethods<never, E> {
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

	expect(panic: string | Panic): never {
		if (panic instanceof Panic) {
			throw panic
		}
		throw new Panic(panic)
	}

	expectErr(_panic: string | Panic) {
		return this.error
	}

	inspect(_f: (value: never) => void) {
		return this
	}

	inspectErr(f: (error: E) => void) {
		f(this.error)
		return this
	}

	map<U>(_f: (value: never) => U) {
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

	or<U, E2 extends Error>(other: Result<U, E2>) {
		return other
	}

	orElse<U, E2 extends Error>(f: (error: E) => Result<U, E2>) {
		return f(this.error)
	}

	unwrap(): never {
		throw new UnwrapPanic(this.error)
	}

	unwrapErr() {
		return this.error
	}

	unwrapOr<U>(defaultValue: U) {
		return defaultValue
	}

	unwrapOrElse<U>(defaultValue: (error: E) => U) {
		return defaultValue(this.error)
	}

	match<A, B>(_ok: (value: never) => A, err: (error: E) => B) {
		return err(this.error)
	}

	tap(): never {
		throw new PropagationPanic(this.error)
	}
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
