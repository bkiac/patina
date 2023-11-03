import type {Panic} from "../error"
import type {inspectSymbol} from "../util"
import type {None} from "./none"
import type {Some} from "./some"

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

	into(): T | null
	match<A, B>(some: (value: T) => A, none: () => B): A | B

	toString(): `Some(${string})` | "None"
	[inspectSymbol](): ReturnType<OptionMethods<T>["toString"]>
	toObject(): {some: true; value: T} | {some: false; value: null}
	toJSON(): {meta: "Some"; data: T} | {meta: "None"}
}

export type Option<T> = Some<T> | None
