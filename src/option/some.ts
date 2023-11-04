import type {Panic} from "../error/panic"
import {inspectSymbol} from "../util"
import type {OptionMethods, Option, SomeVariant} from "./interface"
import {None} from "./none"

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
		return other.some ? other : this
	}

	into() {
		return this.value
	}

	match<A, B>(some: (value: T) => A, _none: () => B) {
		return some(this.value)
	}

	toString() {
		return `Some(${this.value})` as const
	}

	[inspectSymbol]() {
		return this.toString()
	}

	toObject() {
		return {some: true, value: this.value} as const
	}

	toJSON() {
		return {meta: "Some", data: this.value} as const
	}

	static from<T>(value: T): Some<T> {
		return new SomeImpl(value)
	}
}

export interface Some<T> extends SomeImpl<T> {}
export const Some = SomeImpl.from
