import type {Panic} from "../error/panic"
import type {Option} from "./interface"

export class PromiseOption<T> implements PromiseLike<Option<T>> {
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

	and<U>(other: PromiseOption<U>) {
		return new PromiseOption<U>(
			this.then((option) => other.then((otherOption) => option.and(otherOption))),
		)
	}

	andThen<U>(f: (value: T) => Option<U>) {
		return new PromiseOption<U>(this.then((option) => option.andThen((value) => f(value))))
	}

	async expect(panic: Panic | string) {
		return (await this).expect(panic)
	}

	async filter(f: (value: T) => boolean) {
		return (await this).filter(f)
	}

	async inspect(f: (value: T) => void) {
		return new PromiseOption<T>(this.then((option) => option.inspect(f)))
	}

	async isNone() {
		return (await this).isNone()
	}

	async isSome() {
		return (await this).isSome()
	}

	async isSomeAnd(f: (value: T) => boolean) {
		return (await this).isSomeAnd(f)
	}

	async map<U>(f: (value: T) => U) {
		return (await this).map(f)
	}

	async mapOr<A, B>(defaultValue: A, f: (value: T) => B) {
		return (await this).mapOr(defaultValue, f)
	}

	async mapOrElse<A, B>(defaultValue: () => A, f: (value: T) => B) {
		return (await this).mapOrElse(defaultValue, f)
	}

	or<U>(other: PromiseOption<U>) {
		return new PromiseOption<T | U>(
			this.then((thisOption) => other.then((otherOption) => thisOption.or(otherOption))),
		)
	}

	orElse<U>(f: () => Option<U>) {
		return new PromiseOption<T | U>(this.then((thisOption) => thisOption.orElse(() => f())))
	}

	async unwrap() {
		return (await this).unwrap()
	}

	async unwrapOr<U>(defaultValue: U) {
		return (await this).unwrapOr(defaultValue)
	}

	async unwrapOrElse<U>(f: () => U) {
		return (await this).unwrapOrElse(f)
	}

	xor<U>(other: PromiseOption<U>) {
		return new PromiseOption<T | U>(
			this.then((thisOption) => other.then((otherOption) => thisOption.xor(otherOption))),
		)
	}

	async into() {
		return (await this).into()
	}

	async match<A, B>(some: (value: T) => A, none: () => B) {
		return (await this).match(some, none)
	}
}
