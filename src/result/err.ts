import {Panic, UnwrapPanic} from "../error/panic"
import {inspectSymbol} from "../util"
import type {ErrVariant, Result, ResultMethods} from "./interface"
import type {Ok} from "./ok"

export class ErrImpl<E> implements ErrVariant<E>, ResultMethods<never, E> {
	readonly ok = false
	readonly err = true
	readonly error: E

	constructor(error: E) {
		this.error = error
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
		return Err(f(this.error))
	}

	mapOr<A, B>(defaultValue: A, _f: (value: never) => B) {
		return defaultValue
	}

	mapOrElse<A, B>(defaultValue: (error: E) => A, _f: (value: never) => B) {
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

	into() {
		return this.error
	}

	match<A, B>(_ok: (value: never) => A, err: (error: E) => B) {
		return err(this.error)
	}

	toString() {
		return `Err(${this.error})` as const
	}

	[inspectSymbol]() {
		return this.toString()
	}

	toObject() {
		return {ok: false, error: this.error} as const
	}

	toJSON() {
		return {meta: "Err", data: this.error} as const
	}

	static from(): Err
	static from<E>(error: E): Err<E>
	static from<E>(error?: E): Err<E> {
		return new ErrImpl(error ? error : null) as Err<E>
	}
}

export interface Err<E = null> extends ErrImpl<E> {}
export const Err = ErrImpl.from
