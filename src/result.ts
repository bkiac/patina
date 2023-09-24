import {Panic, PropagationPanic, UnwrapPanic} from "./panic"

export type OkVariant<T> = {
	readonly ok: true
	readonly value: T
	readonly error?: never
}

export type ErrVariant<E> = {
	readonly ok: false
	readonly value?: never
	readonly error: E
}

export type ResultVariants<T, E> = OkVariant<T> | ErrVariant<E>

export interface ResultMethods<T, E> {
	and<U, F>(other: Result<U, F>): Result<U, E | F>
	andThen<U, F>(f: (value: T) => Result<U, F>): Result<U, E | F>
	expect(panic: string | Panic): T
	expectErr(panic: string | Panic): E
	inspect(f: (value: T) => void): Result<T, E>
	inspectErr(f: (error: E) => void): Result<T, E>
	isErr(): this is Err<E>
	isErrAnd(f: (error: E) => boolean): this is Err<E>
	isOk(): this is Ok<T>
	isOkAnd(f: (value: T) => boolean): this is Ok<T>
	map<U>(f: (value: T) => U): Result<U, E>
	mapErr<F>(f: (error: E) => F): Result<T, F>
	mapOr<U>(defaultValue: U, f: (value: T) => U): U
	mapOrElse<U>(defaultValue: (error: E) => U, f: (value: T) => U): U
	or<U, F>(other: Result<U, F>): Result<T | U, E | F>
	orElse<U, F>(f: (error: E) => Result<U, F>): Result<T | U, E | F>
	unwrap(): T
	unwrapErr(): E
	unwrapOr<U>(defaultValue: U): T | U
	unwrapOrElse<U>(defaultValue: (error: E) => U): T | U
	match<A, B>(ok: (value: T) => A, err: (error: E) => B): A | B
	tap(): T
}

export type Result<T, E> = ResultMethods<T, E> & ResultVariants<T, E>

export class Ok<T = undefined> implements OkVariant<T>, ResultMethods<T, never> {
	readonly ok = true
	readonly value: T
	readonly error?: never

	constructor()
	constructor(value: T)
	constructor(value?: T) {
		this.value = value as T
	}

	and<U, F>(other: Result<U, F>) {
		return other
	}

	andThen<U, F>(f: (value: T) => Result<U, F>) {
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

	isErr(): this is Err<never> {
		return false
	}

	isErrAnd(_f: (error: never) => boolean): this is Err<never> {
		return false
	}

	isOk(): this is Ok<T> {
		return true
	}

	isOkAnd(f: (value: T) => boolean): this is Ok<T> {
		return f(this.value)
	}

	map<U>(f: (value: T) => U) {
		return new Ok(f(this.value))
	}

	mapErr<F>(_f: (error: never) => F) {
		return this
	}

	mapOr<U>(_defaultValue: U, f: (value: T) => U) {
		return f(this.value)
	}

	mapOrElse<U>(_defaultValue: (error: never) => U, f: (value: T) => U): U {
		return f(this.value)
	}

	or<U, F>(_other: Result<U, F>) {
		return this
	}

	orElse<U, F>(_f: (error: never) => Result<U, F>) {
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

export class Err<E = undefined> implements ErrVariant<E>, ResultMethods<never, E> {
	readonly ok = false
	readonly value?: never
	readonly error: E

	constructor()
	constructor(error: E)
	constructor(error?: E) {
		this.error = error as E
	}

	and<U, F>(_other: Result<U, F>) {
		return this
	}

	andThen<U, F>(_f: (value: never) => Result<U, F>) {
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

	isErr(): this is Err<E> {
		return true
	}

	isErrAnd(f: (error: E) => boolean): this is Err<E> {
		return f(this.error)
	}

	isOk(): this is Ok<never> {
		return false
	}

	isOkAnd(_f: (value: never) => boolean): this is Ok<never> {
		return false
	}

	map<U>(_f: (value: never) => U) {
		return this
	}

	mapErr<F>(f: (error: E) => F) {
		return new Err(f(this.error))
	}

	mapOr<U>(defaultValue: U, _f: (value: never) => U) {
		return defaultValue
	}

	mapOrElse<U>(defaultValue: (error: E) => U, _f: (value: never) => U): U {
		return defaultValue(this.error)
	}

	or<U, F>(other: Result<U, F>) {
		return other
	}

	orElse<U, F>(f: (error: E) => Result<U, F>) {
		return f(this.error)
	}

	unwrap(): never {
		throw new UnwrapPanic(`Cannot unwrap on an Err: ${this.error}`)
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
