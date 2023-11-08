import type {inspectSymbol} from "../util"

export interface OptionMethods<T> {
	and<U>(other: Option<U>): Option<U>
	andThen<U>(f: (value: T) => Option<U>): Option<U>
	expect(panic: string): T
	filter(f: (value: T) => boolean): Option<T>
	inspect(f: (value: T) => void): Option<T>
	map<U>(f: (value: T) => U): Option<U>
	mapOr<A, B>(defaultValue: A, f: (value: T) => B): A | B
	mapOrElse<A, B>(defaultValue: () => A, f: (value: T) => B): A | B
	or<U>(other: Option<U>): Option<T | U>
	orElse<U>(f: () => Option<U>): Option<T | U>
	unwrap(): T
	unwrapOr<U>(defaultValue: U): T | U
	unwrapOrElse<U>(defaultValue: () => U): T | U
	xor<U>(other: Option<U>): Option<T | U>

	into(): T | null
	match<A, B>(some: (value: T) => A, none: () => B): A | B

	toString(): `Some(${string})` | "None"
	[inspectSymbol](): ReturnType<OptionMethods<T>["toString"]>
	toObject(): {some: true; value: T} | {some: false; value: null}
	toJSON(): {meta: "Some"; data: T} | {meta: "None"}
}

export interface SomeVariant<T> {
	readonly some: true
	readonly none: false
	readonly value: T
}

export interface NoneVariant {
	readonly some: false
	readonly none: true
}

export type OptionVariants<T> = SomeVariant<T> | NoneVariant

export type Option<T> = OptionVariants<T> & OptionMethods<T>
