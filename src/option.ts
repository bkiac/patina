import {AsyncOption} from "./async_option";
import {AsyncResult} from "./async_result";
import {Panic} from "./error";
import {Err, Ok, type Result} from "./result";
import * as symbols from "./symbols";

export type OptionMatch<T, A, B> = {
	Some: (value: T) => A;
	None: () => B;
};

export type OptionMatchAsync<T, A, B> = {
	Some: (value: T) => Promise<A>;
	None: () => Promise<B>;
};

export class OptionImpl<T> {
	private readonly kind?: true;
	private readonly wrapped?: T;

	[Symbol.toStringTag] = "Option";

	constructor(kind: boolean, x?: T) {
		if (kind) {
			this.kind = true;
			this.wrapped = x!;
		}
	}

	private unwrapFailed(message: string): never {
		throw new Panic(message, {cause: this.wrapped});
	}

	/**
	 * Matches the option to its content.
	 *
	 * **Examples**
	 *
	 * ```
	 * Some(42).match({
	 * 	Some: (value) => value + 1,
	 * 	None: () => 0
	 * }) // => 43
	 * ```
	 */
	match<A, B>(pattern: OptionMatch<T, A, B>): A | B {
		return this.kind ? pattern.Some(this.wrapped as T) : pattern.None();
	}

	matchAsync<A, B>(pattern: OptionMatchAsync<T, A, B>): Promise<A | B> {
		return this.kind ? pattern.Some(this.wrapped as T) : pattern.None();
	}

	/**
	 * Returns the contained `Some` value, if exists.
	 */
	value(): T | undefined {
		return this.wrapped;
	}

	/**
	 * Returns `true` if the option is a `Some` value.
	 */
	isSome(): this is Some<T> {
		return this.kind === true;
	}

	/**
	 * Returns `true` if the option is a `Some` value and the contained value is equal to `value`.
	 *
	 * Maybe not as useful as using `option.isSome() && f(option.value)`, because it doesn't narrow the type, but it's here for completeness.
	 */
	isSomeAnd(predicate: (value: T) => boolean): this is Some<T> {
		return this.kind === true && predicate(this.wrapped as T);
	}

	/**
	 * Returns `true` if the option is a `None` value.
	 */
	isNone(): this is None<T> {
		return this.kind !== true;
	}

	/**
	 * Returns the contained `Some` value, if exists.
	 *
	 * Throws `Panic` with the provided message if the value is `None`.
	 *
	 * **Examples**
	 *
	 * ```
	 * Some(42).expect("The world is ending") // => 42
	 * None.expect("The world is ending") // => Panic: The world is ending
	 * ```
	 */
	expect(message: string): T {
		return this.kind ? (this.wrapped as T) : this.unwrapFailed(message);
	}

	/**
	 * Returns the contained `Some` value, if exists.
	 *
	 * Throws `Panic` with a default message if the value is `None`.
	 *
	 * **Examples**
	 *
	 * ```
	 * Some(42).unwrap() // => 42
	 * None.unwrap() // => Panic: called "unwrap()" on None
	 * ```
	 */
	unwrap(): T {
		return this.expect(`called \`unwrap()\` on \`None\``);
	}

	/**
	 * Returns the contained `Some` value, if exists.
	 *
	 * Otherwise, returns the provided default value.
	 *
	 * **Examples**
	 *
	 * ```
	 * Some(42).unwrapOr(0) // => 42
	 * None.unwrapOr(0) // => 0
	 * ```
	 */
	unwrapOr<U>(defaultValue: U): T | U {
		return this.kind ? (this.wrapped as T) : defaultValue;
	}

	/**
	 * Returns the contained `Some` value, if exists.
	 *
	 * Otherwise, computes the provided default value.
	 *
	 * **Examples**
	 *
	 * ```
	 * Some(42).unwrapOrElse(() => 0) // => 42
	 * None.unwrapOrElse(() => 0) // => 0
	 * ```
	 */
	unwrapOrElse<U>(defaultValue: () => U): T | U {
		return this.kind ? (this.wrapped as T) : defaultValue();
	}

	unwrapOrElseAsync<U>(defaultValue: () => Promise<U>): Promise<T | U> {
		return this.kind ? Promise.resolve(this.wrapped as T) : defaultValue();
	}

	/**
	 * Maps an `Option<T>` to `Option<U>` by applying a function to a contained value.
	 *
	 * **Examples**
	 *
	 * ```
	 * Some(42).map(x => x + 1) // => Some(43)
	 * None.map(x => x + 1) // => None
	 * ```
	 */
	map<U>(f: (value: T) => U): Option<U> {
		return this.kind ? Some(f(this.wrapped as T)) : None;
	}

	mapAsync<U>(f: (value: T) => Promise<U>): AsyncOption<U> {
		return new AsyncOption(this.kind ? f(this.wrapped as T).then(Some) : Promise.resolve(None));
	}

	/**
	 * Calls `f` if the `Option` is `Some`, otherwise returns `None`.
	 *
	 * **Examples**
	 *
	 * ```
	 * Ok(42).inspect(console.log) // => 42
	 * ```
	 */
	inspect(f: (value: T) => void): this {
		if (this.kind) {
			f(this.wrapped as T);
		}
		return this;
	}

	inspectAsync(f: (value: T) => Promise<void>): AsyncOption<T> {
		return new AsyncOption(
			this.kind
				? f(this.wrapped as T).then(() => this as unknown as Some<T>)
				: Promise.resolve(None),
		);
	}

	/**
	 * Returns the provided default result (if none), or applies a function to the contained value (if any).
	 *
	 * **Examples**
	 *
	 * ```
	 * Some(42).mapOr(0, x => x + 1) // => 43
	 * None.mapOr(0, x => x + 1) // => 0
	 * ```
	 */
	mapOr<A, B>(defaultValue: A, f: (value: T) => B): A | B {
		return this.kind ? f(this.wrapped as T) : defaultValue;
	}

	mapOrAsync<A, B>(defaultValue: A, f: (value: T) => Promise<B>): Promise<A | B> {
		return this.kind ? f(this.wrapped as T) : Promise.resolve(defaultValue);
	}

	/**
	 * Returns the provided default result (if none), or computes a default value by applying a function to the contained value (if any).
	 *
	 * **Examples**
	 *
	 * ```
	 * const k = 21
	 * Some("foo").mapOrElse(() => k * 2, (v) => v.length) // => 3
	 * None.mapOrElse(() => k * 2, (v) => v.length) // => 42
	 * ```
	 */
	mapOrElse<A, B>(defaultValue: () => A, f: (value: T) => B): A | B {
		return this.kind ? f(this.wrapped as T) : defaultValue();
	}

	mapOrElseAsync<A, B>(
		defaultValue: () => Promise<A>,
		f: (value: T) => Promise<B>,
	): Promise<A | B> {
		return this.kind ? f(this.wrapped as T) : defaultValue();
	}

	/**
	 * Transforms the `Option<T>` into a `Result<T, E>`, mapping `Some(v)` to `Ok(v)` and `None` to `Err(err)`.
	 *
	 * **Examples**
	 *
	 * ```
	 * Some(42).okOr("failed") // => Ok(42)
	 * None.okOr("failed") // => Err("failed")
	 * ```
	 */
	okOr<E>(err: E): Result<T, E> {
		return this.kind ? Ok(this.wrapped as T) : Err(err);
	}

	/**
	 * Transforms the `Option<T>` into a `Result<T, E>`, mapping `Some(v)` to `Ok(v)` and `None` to `Err(err())`.
	 *
	 * **Examples**
	 *
	 * ```
	 * Some(42).okOrElse(() => "failed") // => Ok(42)
	 * None.okOrElse(() => "failed") // => Err("failed")
	 * ```
	 */
	okOrElse<E>(err: () => E): Result<T, E> {
		return this.kind ? Ok(this.wrapped as T) : Err(err());
	}

	okOrElseAsync<E>(err: () => Promise<E>): AsyncResult<T, E> {
		return new AsyncResult<T, E>(
			this.kind
				? Promise.resolve(Ok(this.wrapped as T))
				: (err().then(Err) as Promise<Result<T, E>>),
		);
	}

	/**
	 * Returns `None` if the option is `None`, otherwise returns `other`.
	 *
	 * **Examples**
	 *
	 * ```
	 * Some(42).and(Some(54)) // => Some(54)
	 * Some(42).and(None) // => None
	 * None.and(Some(54)) // => None
	 * None.and(None) // => None
	 * ```
	 */
	and<U>(other: Option<U>): Option<U> {
		return this.kind ? other : None;
	}

	/**
	 * Returns `None` if the option is `None`, otherwise calls `f` with the wrapped value and returns the result.
	 *
	 * **Examples**
	 *
	 * ```
	 * Some(42).andThen(x => Some(x + 1)) // => Some(43)
	 * Some(42).andThen(x => None) // => None
	 * None.andThen(x => Some(x + 1)) // => None
	 * ```
	 */
	andThen<U>(f: (value: T) => Option<U>): Option<U> {
		return this.kind ? f(this.wrapped as T) : None;
	}

	andThenAsync<U>(f: (value: T) => Promise<Option<U>> | AsyncOption<U>): AsyncOption<U> {
		return new AsyncOption(this.kind ? f(this.wrapped as T) : Promise.resolve(None));
	}

	/**
	 * Returns `None` if the option is `None`, otherwise calls `predicate` with the wrapped value and returns:
	 * - `Some<T>` if predicate returns true, and
	 * - `None` if predicate returns false.
	 *
	 * **Examples**
	 *
	 * ```
	 * Some(42).filter(x => x > 40) // => Some(42)
	 * Some(42).filter(x => x > 50) // => None
	 * None.filter(x => x > 40) // => None
	 * ```
	 */
	filter(predicate: (value: T) => boolean): Option<T> {
		return (this.kind && predicate(this.wrapped as T) ? this : None) as Option<T>;
	}

	/**
	 * Returns the option if it contains a value, otherwise returns `other`.
	 *
	 * **Examples**
	 *
	 * ```
	 * Some(42).or(Some(54)) // => Some(42)
	 * Some(42).or(None) // => Some(42)
	 * None.or(Some(54)) // => Some(54)
	 * None.or(None) // => None
	 * ```
	 */
	or<U>(other: Option<U>): Option<T | U> {
		return (this.kind ? this : other) as Option<T | U>;
	}

	/**
	 * Returns the option if it contains a value, otherwise calls `f` and returns the result.
	 *
	 * **Examples**
	 *
	 * ```
	 * Some(42).orElse(() => Some(54)) // => Some(42)
	 * Some(42).orElse(() => None) // => Some(42)
	 * None.orElse(() => Some(54)) // => Some(54)
	 * None.orElse(() => None) // => None
	 * ```
	 */
	orElse<U>(f: () => Option<U>): Option<T | U> {
		return (this.kind ? this : f()) as Option<T | U>;
	}

	orElseAsync<U>(f: () => Promise<Option<U>> | AsyncOption<U>): AsyncOption<T | U> {
		return new AsyncOption(
			(this.kind ? Promise.resolve(this as unknown as Some<T>) : f()) as Promise<
				Option<T | U>
			>,
		);
	}

	/**
	 * Returns `Some` if exactly one of `this` and `other` is `Some`, otherwise returns `None`.
	 *
	 * **Examples**
	 *
	 * ```
	 * Some(42).xor(Some(54)) // => None
	 * Some(42).xor(None) // => Some(42)
	 * None.xor(Some(54)) // => Some(54)
	 * None.xor(None) // => None
	 * ```
	 */
	xor<U>(other: Option<U>): Option<T | U> {
		return (this.kind ? (other.kind ? None : this) : other) as Option<T | U>;
	}

	/**
	 * Converts from `Option<Option<U>>` to `Option<U>`.
	 *
	 * **Examples**
	 *
	 * ```
	 * Some(Some(42)).flatten() // => Some(42)
	 * Some(None).flatten() // => None
	 * ```
	 */
	flatten<U>(this: Option<Option<U>>): Option<U> {
		return this.kind ? (this.wrapped as Option<U>) : None;
	}

	toObject(): {isSome: true; value: T} | {isSome: false; value: null} {
		return this.kind ? {isSome: true, value: this.wrapped as T} : {isSome: false, value: null};
	}

	toString(): `Some(${string})` | "None" {
		return this.kind ? `Some(${String(this.wrapped)})` : "None";
	}

	[symbols.inspect](): ReturnType<OptionImpl<T>["toString"]> {
		return this.toString();
	}
}

export interface Some<T> extends OptionImpl<T> {
	[symbols.tag]: "Some";
	value(): T;
	unwrap(): T;
	expect(message: string): T;
}

/**
 * Some value of type `T`.
 */
export function Some<T>(value: T): Some<T> {
	return new OptionImpl(true, value) as Some<T>;
}

export interface None<T = never> extends OptionImpl<T> {
	[symbols.tag]: "None";
	value(): undefined;
	unwrap(): never;
	expect(message: string): never;
}

/**
 * No value.
 */
export const None = new OptionImpl(false) as None;

/**
 * `Option` represents an optional value: every `Option` is either `Some` and contains a value, or `None`, and does not.
 */
export type Option<T> = Some<T> | None<T>;

export function Option() {}

Option.from = <T>(value: T | undefined | null): Option<T> => {
	return value == null ? None : Some(value);
};
