import { AsyncResult } from "./async_result.ts";
import { None, type Option, type OptionMatch, type OptionMatchAsync, Some } from "./option.ts";

/**
 * A promise that resolves to an `Option`.
 *
 * This class is useful for chaining multiple asynchronous operations that return an `Option`.
 */
export class AsyncOption<T> implements PromiseLike<Option<T>> {
	public readonly promise: Promise<Option<T>> | PromiseLike<Option<T>> | AsyncOption<T>;

	public constructor(promise: Promise<Option<T>> | PromiseLike<Option<T>> | AsyncOption<T>) {
		this.promise = promise;
	}

	public get [Symbol.toStringTag](): "AsyncOption" {
		return "AsyncOption";
	}

	public toJSON(): { AsyncOption: Promise<Option<T>> | PromiseLike<Option<T>> | AsyncOption<T> } {
		return { AsyncOption: this.promise };
	}

	public toString(): string {
		return `AsyncOption(${this.promise.toString()})`;
	}

	public [Symbol.for("nodejs.util.inspect.custom")](): string {
		return this.toString();
	}

	public then<A, B>(
		successCallback?: (res: Option<T>) => A | PromiseLike<A>,
		failureCallback?: (reason: unknown) => B | PromiseLike<B>,
	): PromiseLike<A | B> {
		return this.promise.then(successCallback, failureCallback);
	}

	public catch<B>(rejectionCallback?: (reason: unknown) => B | PromiseLike<B>): PromiseLike<B> {
		return this.promise.then(undefined, rejectionCallback);
	}

	public finally(callback: () => void): PromiseLike<Option<T>> {
		return this.then(
			(value) => {
				callback();
				return value;
			},
			(reason) => {
				callback();
				throw reason;
			},
		);
	}

	public async match<A, B>(matcher: OptionMatch<T, A, B>): Promise<A | B> {
		return (await this).match(matcher);
	}

	public async matchAsync<A, B>(matcher: OptionMatchAsync<T, A, B>): Promise<A | B> {
		return (await this).matchAsync(matcher);
	}

	public okOr<E>(err: E): AsyncResult<T, E> {
		return new AsyncResult(this.then((option) => option.okOr(err)));
	}

	public okOrElse<E>(err: () => E): AsyncResult<T, E> {
		return new AsyncResult(this.then((option) => option.okOrElse(err)));
	}

	public okOrElseAsync<E>(err: () => Promise<E>): AsyncResult<T, E> {
		return new AsyncResult(this.then((option) => option.okOrElseAsync(err)));
	}

	public and<U>(other: AsyncOption<U>): AsyncOption<U> {
		return new AsyncOption(
			this.then((option) => other.then((otherOption) => option.and(otherOption))),
		);
	}

	public andThen<U>(f: (value: T) => Option<U>): AsyncOption<U> {
		return new AsyncOption(this.then((option) => option.andThen((value) => f(value))));
	}

	public andThenAsync<U>(f: (value: T) => Promise<Option<U>> | AsyncOption<U>): AsyncOption<U> {
		return new AsyncOption(this.then((option) => option.andThenAsync(f)));
	}

	public inspect(f: (value: T) => void): AsyncOption<T> {
		return new AsyncOption(this.then((option) => option.inspect(f)));
	}

	public async expect(message: string): Promise<T> {
		return (await this).expect(message);
	}

	public filter(f: (value: T) => boolean): AsyncOption<T> {
		return new AsyncOption(this.then((option) => option.filter(f)));
	}

	public filterAsync(f: (value: T) => Promise<boolean>): AsyncOption<T> {
		return new AsyncOption(this.then((option) => option.filterAsync(f)));
	}

	public flatten<U>(this: AsyncOption<Option<U>>): AsyncOption<U> {
		return new AsyncOption(this.then((option) => option.flatten()));
	}

	public map<U>(f: (value: T) => U): AsyncOption<U> {
		return new AsyncOption(this.then((option) => option.map(f)));
	}

	public mapAsync<U>(f: (value: T) => Promise<U>): AsyncOption<U> {
		return new AsyncOption(this.then((option) => option.mapAsync(f)));
	}

	public async mapOr<A, B>(defaultValue: A, f: (value: T) => B): Promise<A | B> {
		return (await this).mapOr(defaultValue, f);
	}

	public async mapOrElse<A, B>(defaultValue: () => A, f: (value: T) => B): Promise<A | B> {
		return (await this).mapOrElse(defaultValue, f);
	}

	public async mapOrElseAsync<A, B>(
		defaultValue: () => Promise<A>,
		f: (value: T) => Promise<B>,
	): Promise<A | B> {
		return (await this).mapOrElseAsync(defaultValue, f);
	}

	public or<U>(other: AsyncOption<U>): AsyncOption<T | U> {
		return new AsyncOption(
			this.then((thisOption) => other.then((otherOption) => thisOption.or(otherOption))),
		);
	}

	public orElse<U>(f: () => Option<U>): AsyncOption<T | U> {
		return new AsyncOption(this.then((thisOption) => thisOption.orElse(() => f())));
	}

	public orElseAsync<U>(f: () => Promise<Option<U>> | AsyncOption<U>): AsyncOption<T | U> {
		return new AsyncOption(this.then((thisOption) => thisOption.orElseAsync(() => f())));
	}

	public async unwrap(): Promise<T | undefined> {
		return (await this).unwrap();
	}

	public async unwrapOr<U>(defaultValue: U): Promise<T | U> {
		return (await this).unwrapOr(defaultValue);
	}

	public async unwrapOrElse<U>(f: () => U): Promise<T | U> {
		return (await this).unwrapOrElse(f);
	}

	public async unwrapOrElseAsync<U>(f: () => Promise<U>): Promise<T | U> {
		return (await this).unwrapOrElseAsync(f);
	}

	public xor<U>(other: AsyncOption<U>): AsyncOption<T | U> {
		return new AsyncOption(
			this.then((thisOption) => other.then((otherOption) => thisOption.xor(otherOption))),
		);
	}

	// Deprecated

	/**
	 * @deprecated Use `unwrap()` instead.
	 */
	async value(): Promise<T | undefined> {
		return (await this).value();
	}
}

export function AsyncSome<T>(value: T): AsyncOption<T> {
	return new AsyncOption(Promise.resolve(Some(value)));
}

export function AsyncNone(): AsyncOption<never> {
	return new AsyncOption(Promise.resolve(None));
}
