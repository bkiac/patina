import {Panic, UnwrapPanic} from "../error/panic"
import {inspectSymbol} from "../util"
import type {ErrVariant, Result, ResultMethods} from "./interface"

export class ErrImpl<E> implements ErrVariant<E>, ResultMethods<never, E> {
	readonly ok = false
	readonly err = true
	readonly value: E

	constructor(error: E) {
		this.value = error
	}

	and<U, F>(_other: Result<U, F>) {
		return this
	}

	andThen<U, F>(_f: (value: never) => Result<U, F>) {
		return this
	}

	expect(panic: string): never {
		throw new Panic(panic, this.value)
	}

	expectErr(_panic: string) {
		return this.value
	}

	inspect(_f: (value: never) => void) {
		return this
	}

	inspectErr(f: (error: E) => void) {
		f(this.value)
		return this
	}

	map<U>(_f: (value: never) => U) {
		return this
	}

	mapErr<F>(f: (error: E) => F) {
		return Err(f(this.value))
	}

	mapOr<A, B>(defaultValue: A, _f: (value: never) => B) {
		return defaultValue
	}

	mapOrElse<A, B>(defaultValue: (error: E) => A, _f: (value: never) => B) {
		return defaultValue(this.value)
	}

	or<U, F>(other: Result<U, F>) {
		return other
	}

	orElse<U, F>(f: (error: E) => Result<U, F>) {
		return f(this.value)
	}

	unwrap(): never {
		throw new UnwrapPanic(`called "unwrap()" on ${this.toString()}`)
	}

	unwrapErr() {
		return this.value
	}

	unwrapOr<U>(defaultValue: U) {
		return defaultValue
	}

	unwrapOrElse<U>(defaultValue: (error: E) => U) {
		return defaultValue(this.value)
	}

	get() {
		return this.value
	}

	match<A, B>(_ok: (value: never) => A, err: (error: E) => B) {
		return err(this.value)
	}

	toString() {
		return `Err(${this.value})` as const
	}

	[inspectSymbol]() {
		return this.toString()
	}

	toObject() {
		return {ok: false, value: this.value} as const
	}

	toJSON() {
		return {meta: "Err", value: this.value} as const
	}
}

export interface Err<E = null> extends ErrImpl<E> {}
export function Err(): Err
export function Err<E>(value: E): Err<E>
export function Err<E>(value?: E): Err<E> {
	return new ErrImpl(value ? value : null) as Err<E>
}
