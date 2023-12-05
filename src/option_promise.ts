import type {Option, OptionMatcher} from "./option"

export class OptionPromise<T> implements PromiseLike<Option<T>> {
	constructor(readonly promise: Promise<Option<T>> | PromiseLike<Option<T>>) {}

	then<A, B>(
		successCallback?: (res: Option<T>) => A | PromiseLike<A>,
		failureCallback?: (reason: unknown) => B | PromiseLike<B>,
	): PromiseLike<A | B> {
		return this.promise.then(successCallback, failureCallback)
	}

	catch<B>(rejectionCallback?: (reason: unknown) => B | PromiseLike<B>): PromiseLike<B> {
		return this.promise.then(null, rejectionCallback)
	}

	finally(callback: () => void): PromiseLike<Option<T>> {
		return this.then(
			(value) => {
				callback()
				return value
			},
			(reason) => {
				callback()
				throw reason
			},
		)
	}

	and<U>(other: OptionPromise<U>): OptionPromise<U> {
		return new OptionPromise(
			this.then((option) => other.then((otherOption) => option.and(otherOption))),
		)
	}

	andThen<U>(f: (value: T) => Option<U>): OptionPromise<U> {
		return new OptionPromise(this.then((option) => option.andThen((value) => f(value))))
	}

	examine(f: (value: T) => void): OptionPromise<T> {
		return new OptionPromise(this.then((option) => option.examine(f)))
	}

	async expect(panic: string): Promise<T> {
		return (await this).expect(panic)
	}

	filter(f: (value: T) => boolean): OptionPromise<T> {
		return new OptionPromise(this.then((option) => option.filter(f)))
	}

	flatten<U>(this: OptionPromise<Option<U>>): OptionPromise<U> {
		return new OptionPromise(this.then((option) => option.flatten()))
	}

	map<U>(f: (value: T) => U): OptionPromise<U> {
		return new OptionPromise(this.then((option) => option.map(f)))
	}

	async mapOr<A, B>(defaultValue: A, f: (value: T) => B): Promise<A | B> {
		return (await this).mapOr(defaultValue, f)
	}

	async mapOrElse<A, B>(defaultValue: () => A, f: (value: T) => B): Promise<A | B> {
		return (await this).mapOrElse(defaultValue, f)
	}

	or<U>(other: OptionPromise<U>): OptionPromise<T | U> {
		return new OptionPromise(
			this.then((thisOption) => other.then((otherOption) => thisOption.or(otherOption))),
		)
	}

	orElse<U>(f: () => Option<U>): OptionPromise<T | U> {
		return new OptionPromise(this.then((thisOption) => thisOption.orElse(() => f())))
	}

	async unwrap(): Promise<T> {
		return (await this).unwrap()
	}

	async unwrapOr<U>(defaultValue: U): Promise<T | U> {
		return (await this).unwrapOr(defaultValue)
	}

	async unwrapOrElse<U>(f: () => U): Promise<T | U> {
		return (await this).unwrapOrElse(f)
	}

	xor<U>(other: OptionPromise<U>): OptionPromise<T | U> {
		return new OptionPromise(
			this.then((thisOption) => other.then((otherOption) => thisOption.xor(otherOption))),
		)
	}

	async match<A, B>(matcher: OptionMatcher<T, A, B>): Promise<A | B> {
		return (await this).match(matcher)
	}
}
