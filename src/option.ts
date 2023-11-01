import {Panic, UnwrapPanic} from "./panic"

export type SomeVariant<T> = {
	readonly some: true
	readonly none: false
	readonly value: T
}

export type NoneVariant = {
	readonly some: false
	readonly none: true
	readonly value: null
}

export type OptionVariants<T> = SomeVariant<T> | NoneVariant

export interface OptionMethods<T> {
	and<U>(other: Option<U>): Option<U>
	andThen<U>(f: (value: T) => Option<U>): Option<U>
	expect(panic: string | Panic): T
	filter(f: (value: T) => boolean): Option<T>
	inspect(f: (value: T) => void): Option<T>
	isNone(): this is None
	isSome(): this is Some<T>
	isSomeAnd(f: (value: T) => boolean): this is Some<T>
	map<U>(f: (value: T) => U): Option<U>
	mapOr<A, B>(defaultValue: A, f: (value: T) => B): A | B
	mapOrElse<A, B>(defaultValue: () => A, f: (value: T) => B): A | B
	or<U>(other: Option<U>): Option<T | U>
	orElse<U>(f: () => Option<U>): Option<T | U>
	unwrap(): T
	unwrapOr<U>(defaultValue: U): T | U
	unwrapOrElse<U>(defaultValue: () => U): T | U
	xor<U>(other: Option<U>): Option<T | U>

	get(): T | null
	match<A, B>(some: (value: T) => A, none: () => B): A | B
}

export type Option<T> = OptionMethods<T> & OptionVariants<T>

export class SomeImpl<T> implements SomeVariant<T>, OptionMethods<T> {
	readonly some = true
	readonly none = false
	readonly value: T

	constructor(value: T) {
		this.value = value
	}

	and<U>(other: Option<U>) {
		return other
	}

	andThen<U>(f: (value: T) => Option<U>) {
		return f(this.value)
	}

	expect(_panic: string | Panic) {
		return this.value
	}

	filter(f: (value: T) => boolean) {
		return f(this.value) ? this : None
	}

	inspect(f: (value: T) => void) {
		f(this.value)
		return this
	}

	isNone(): this is None {
		return false
	}

	isSome(): this is Some<T> {
		return true
	}

	isSomeAnd(f: (value: T) => boolean): this is Some<T> {
		return f(this.value)
	}

	map<U>(f: (value: T) => U) {
		return Some(f(this.value))
	}

	mapOr<A, B>(_defaultValue: A, f: (value: T) => B) {
		return f(this.value)
	}

	mapOrElse<A, B>(_defaultValue: () => A, f: (value: T) => B) {
		return f(this.value)
	}

	or<U>(_other: Option<U>) {
		return this
	}

	orElse<U>(_f: () => Option<U>) {
		return this
	}

	unwrap() {
		return this.value
	}

	unwrapOr<U>(_defaultValue: U) {
		return this.value
	}

	unwrapOrElse<U>(_defaultValue: () => U) {
		return this.value
	}

	xor<U>(other: Option<U>) {
		return other.isSome() ? None : this
	}

	get() {
		return this.value
	}

	match<A, B>(some: (value: T) => A, _none: () => B) {
		return some(this.value)
	}
}

export interface Some<T> extends SomeImpl<T> {}
export function Some<T>(value: T): Some<T> {
	return new SomeImpl(value)
}

export class NoneImpl implements NoneVariant, OptionMethods<never> {
	readonly some = false
	readonly none = true
	readonly value = null

	and<U>(_other: Option<U>) {
		return None
	}

	andThen<U>(_f: (value: never) => Option<U>) {
		return None
	}

	expect(panic: string | Panic): never {
		throw typeof panic === "string" ? new Panic(panic) : panic
	}

	filter(_f: (value: never) => boolean) {
		return None
	}

	inspect(_f: (value: never) => void) {
		return this
	}

	isNone(): this is None {
		return true
	}

	isSome(): this is Some<never> {
		return false
	}

	isSomeAnd(_f: (value: never) => boolean): this is Some<never> {
		return false
	}

	map<U>(_f: (value: never) => U) {
		return None
	}

	mapOr<A, B>(defaultValue: A, _f: (value: never) => B) {
		return defaultValue
	}

	mapOrElse<A, B>(defaultValue: () => A, _f: (value: never) => B) {
		return defaultValue()
	}

	or<U>(other: Option<U>) {
		return other
	}

	orElse<U>(f: () => Option<U>) {
		return f()
	}

	unwrap(): never {
		throw new UnwrapPanic("Cannot unwrap on a None")
	}

	unwrapOr<U>(defaultValue: U) {
		return defaultValue
	}

	unwrapOrElse<U>(defaultValue: () => U) {
		return defaultValue()
	}

	xor<U>(other: Option<U>) {
		return other
	}

	get() {
		return null
	}

	match<A, B>(_some: (value: never) => A, none: () => B) {
		return none()
	}
}

export interface None extends NoneImpl {}
export const None: None = Object.freeze(new NoneImpl())
