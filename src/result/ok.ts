import {Panic, UnwrapPanic} from "../error/panic"
import {inspectSymbol} from "../util"
import type {Result, ResultMethods} from "./interface"

export class OkImpl<T = null> {
	readonly ok = true
	readonly err = false
	readonly value: T

	constructor()
	constructor(value?: T)
	constructor(value?: T) {
		this.value = (value ?? null) as T
	}

	and<U, F>(other: Result<U, F>): Result<U, F> {
		return other
	}

	andThen<U, F>(f: (value: T) => Result<U, F>): Result<U, F> {
		return f(this.value)
	}

	expect(_panic: string): T {
		return this.value
	}

	expectErr(panic: string): never {
		throw new Panic(panic, this.value)
	}

	inspect(f: (value: T) => void): Result<T, never> {
		f(this.value)
		return this
	}

	inspectErr(_f: (error: never) => void): Result<T, never> {
		return this
	}

	map<U>(f: (value: T) => U): Result<U, never> {
		return new OkImpl(f(this.value))
	}

	mapErr<F>(_f: (error: never) => F): Result<T, F> {
		return this
	}

	mapOr<A, B>(_defaultValue: A, f: (value: T) => B): B {
		return f(this.value)
	}

	mapOrElse<A, B>(_defaultValue: (error: never) => A, f: (value: T) => B): B {
		return f(this.value)
	}

	or<U, F>(_other: Result<U, F>): Result<T | U, F> {
		return this
	}

	orElse<U, F>(_f: (error: never) => Result<U, F>): Result<T | U, F> {
		return this
	}

	unwrap(): T {
		return this.value
	}

	unwrapErr(): never {
		throw new UnwrapPanic(`called "unwrapErr()" on ${this.toString()}`)
	}

	unwrapOr<U>(_defaultValue: U): T | U {
		return this.value
	}

	unwrapOrElse<U>(_defaultValue: (error: never) => U): T | U {
		return this.value
	}

	match<A, B>(ok: (value: T) => A, _err: (error: never) => B): A | B {
		return ok(this.value)
	}

	toString(): `Ok(${string})` {
		return `Ok(${this.value})` as const
	}

	[inspectSymbol](): ReturnType<ResultMethods<T, never>["toString"]> {
		return this.toString()
	}

	toObject(): {ok: true; value: T} {
		return {ok: true, value: this.value} as const
	}

	toJSON(): {meta: "Ok"; value: T} {
		return {meta: "Ok", value: this.value} as const
	}
}

export interface Ok<T = null> extends OkImpl<T> {}
export function Ok(): Ok
export function Ok<T>(value: T): Ok<T>
export function Ok<T>(value?: T): Ok<T> {
	return new OkImpl(value)
}
