import {Panic, UnwrapPanic} from "../error/panic"
import {inspectSymbol} from "../util"
import type {Result} from "./interface"

export class ErrImpl<E = null> {
	readonly ok = false
	readonly err = true
	readonly value: E

	constructor()
	constructor(value?: E)
	constructor(value?: E) {
		this.value = (value ?? null) as E
	}

	and<U, F>(_other: Result<U, F>): Result<U, E | F> {
		return this
	}

	andThen<U, F>(_f: (value: never) => Result<U, F>): Result<U, E | F> {
		return this
	}

	expect(panic: string): never {
		throw new Panic(panic, this.value)
	}

	expectErr(_panic: string): E {
		return this.value
	}

	inspect(_f: (value: never) => void): Result<never, E> {
		return this
	}

	inspectErr(f: (error: E) => void): Result<never, E> {
		f(this.value)
		return this
	}

	map<U>(_f: (value: never) => U): Result<U, E> {
		return this
	}

	mapErr<F>(f: (error: E) => F): Result<never, F> {
		return new ErrImpl(f(this.value))
	}

	mapOr<A, B>(defaultValue: A, _f: (value: never) => B): A | B {
		return defaultValue
	}

	mapOrElse<A, B>(defaultValue: (error: E) => A, _f: (value: never) => B): A | B {
		return defaultValue(this.value)
	}

	or<U, F>(other: Result<U, F>): Result<U, E | F> {
		return other
	}

	orElse<U, F>(f: (error: E) => Result<U, F>): Result<U, E | F> {
		return f(this.value)
	}

	unwrap(): never {
		throw new UnwrapPanic(`called "unwrap()" on ${this.toString()}`)
	}

	unwrapErr(): E {
		return this.value
	}

	unwrapOr<U>(defaultValue: U): U {
		return defaultValue
	}

	unwrapOrElse<U>(defaultValue: (error: E) => U): U {
		return defaultValue(this.value)
	}

	match<A, B>(_ok: (value: never) => A, err: (error: E) => B): A | B {
		return err(this.value)
	}

	toString(): `Err(${string})` {
		return `Err(${this.value})` as const
	}

	[inspectSymbol](): ReturnType<Result<never, E>["toString"]> {
		return this.toString()
	}

	toObject(): {ok: false; value: E} {
		return {ok: false, value: this.value} as const
	}

	toJSON(): {meta: "Err"; value: E} {
		return {meta: "Err", value: this.value} as const
	}
}

export interface Err<E = null> extends ErrImpl<E> {}
export function Err(): Err
export function Err<E>(value: E): Err<E>
export function Err<E>(value?: E): Err<E> {
	return new ErrImpl(value)
}
