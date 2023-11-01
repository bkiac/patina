import type {Result} from "./result"
import {type Panic} from "./panic"

export class PromiseResult<T, E> implements PromiseLike<Result<T, E>> {
	constructor(readonly promise: Promise<Result<T, E>> | PromiseLike<Result<T, E>>) {}

	then<A, B>(
		successCallback?: (res: Result<T, E>) => A | PromiseLike<A>,
		failureCallback?: (reason: unknown) => B | PromiseLike<B>,
	): PromiseLike<A | B> {
		return this.promise.then(successCallback, failureCallback)
	}

	catch<B>(rejectionCallback?: (reason: unknown) => B | PromiseLike<B>): PromiseLike<B> {
		return this.promise.then(null, rejectionCallback)
	}

	finally(callback: () => void): PromiseLike<Result<T, E>> {
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

	and<U, F>(other: PromiseResult<U, F>) {
		return new PromiseResult<U, E | F>(
			this.then((result) => other.then((otherResult) => result.and(otherResult))),
		)
	}

	andThen<U, F>(f: (value: T) => Result<U, F>) {
		return new PromiseResult<U, E | F>(
			this.then((result) => result.andThen((value) => f(value))),
		)
	}

	async expect(panic: Panic | string) {
		return (await this).expect(panic)
	}

	async expectErr(panic: Panic | string) {
		return (await this).expectErr(panic)
	}

	inspect(f: (value: T) => void) {
		return new PromiseResult<T, E>(this.then((result) => result.inspect(f)))
	}

	inspectErr(f: (error: E) => void) {
		return new PromiseResult<T, E>(this.then((result) => result.inspectErr(f)))
	}

	async isErr(): Promise<boolean> {
		return (await this).isErr()
	}

	async isErrAnd(f: (error: E) => boolean): Promise<boolean> {
		return (await this).isErrAnd(f)
	}

	async isOk(): Promise<boolean> {
		return (await this).isOk()
	}

	async isOkAnd(f: (value: T) => boolean): Promise<boolean> {
		return (await this).isOkAnd(f)
	}

	map<U>(f: (value: T) => U): PromiseResult<U, E> {
		return new PromiseResult(this.then((result) => result.map(f)))
	}

	mapErr<F>(f: (error: E) => F) {
		return new PromiseResult<T, F>(this.then((result) => result.mapErr(f)))
	}

	async mapOr<U>(defaultValue: U, f: (value: T) => U) {
		return (await this).mapOr(defaultValue, f)
	}

	async mapOrElse<U>(defaultValue: (error: E) => U, f: (value: T) => U) {
		return (await this).mapOrElse(defaultValue, f)
	}

	or<U, F>(other: PromiseResult<U, F>) {
		return new PromiseResult<T | U, F | E>(
			this.then((result) => other.then((otherResult) => result.or(otherResult))),
		)
	}

	orElse<U, F>(f: (error: E) => Result<U, F>) {
		return new PromiseResult<T | U, F | E>(
			this.then((result) => result.orElse((error) => f(error))),
		)
	}

	async unwrap() {
		return (await this).unwrap()
	}

	async unwrapErr() {
		return (await this).unwrapErr()
	}

	async unwrapOr<U>(defaultValue: U) {
		return (await this).unwrapOr(defaultValue)
	}

	async unwrapOrElse<U>(defaultValue: (error: E) => U) {
		return (await this).unwrapOrElse(defaultValue)
	}

	async match<A, B>(ok: (value: T) => A, err: (error: E) => B) {
		return (await this).match(ok, err)
	}
}
