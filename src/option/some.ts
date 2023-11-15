import {inspectSymbol} from "../util"
import type {OptionMethods, Option} from "./interface"
import {None} from "./none"

export class SomeImpl<T> implements OptionMethods<T> {
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

	expect(_panic: string) {
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
		return other.some ? None : this
	}

	get() {
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
		return {meta: "Some", value: this.value} as const
	}
}

export interface Some<T> extends SomeImpl<T> {}
export function Some<T>(value: T): Some<T> {
	return new SomeImpl(value)
}
