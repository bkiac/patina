import {Panic, UnwrapPanic} from "../error"
import {inspectSymbol} from "../util"
import type {Err} from "./err"
import type {Result, ResultMethods} from "./interface"

export class OkImpl<T> implements ResultMethods<T, never> {
	readonly ok = true
	readonly value: T
	readonly err = false
	readonly error?: never

	constructor(value: T) {
		this.value = value
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
		return Ok(f(this.value))
	}

	mapErr<F>(_f: (error: never) => F) {
		return this
	}

	mapOr<A, B>(_defaultValue: A, f: (value: T) => B) {
		return f(this.value)
	}

	mapOrElse<A, B>(_defaultValue: (error: never) => A, f: (value: T) => B) {
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

	into() {
		return this.value
	}

	match<A, B>(ok: (value: T) => A, _err: (error: never) => B) {
		return ok(this.value)
	}

	toString() {
		return `Ok(${this.value})` as const
	}

	[inspectSymbol]() {
		return this.toString()
	}

	toObject() {
		return {ok: true, value: this.value} as const
	}

	toJSON() {
		return {meta: "Ok", data: this.value} as const
	}

	static from(): Ok
	static from<T>(value: T): Ok<T>
	static from<T>(value?: T): Ok<T> {
		return new OkImpl(value ? value : null) as Ok<T>
	}
}

export interface Ok<T = null> extends OkImpl<T> {}
export const Ok = OkImpl.from
