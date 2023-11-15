import {Panic, UnwrapPanic} from "../error/panic"
import {inspectSymbol} from "../util"
import type {OptionMethods, Option} from "./option"

export class NoneImpl implements OptionMethods<never> {
	readonly some = false
	readonly none = true
	readonly value = null

	and<U>(_other: Option<U>) {
		return None
	}

	andThen<U>(_f: (value: never) => Option<U>) {
		return None
	}

	expect(panic: string): never {
		throw new Panic(panic)
	}

	filter(_f: (value: never) => boolean) {
		return None
	}

	inspect(_f: (value: never) => void) {
		return this
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

	toString() {
		return "None" as const
	}

	[inspectSymbol]() {
		return this.toString()
	}

	toObject() {
		return {some: false, value: null} as const
	}

	toJSON() {
		return {meta: "None", value: null} as const
	}
}

export interface None extends NoneImpl {}
export const None: None = new NoneImpl()
