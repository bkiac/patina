import {Methods, Result, err, ok} from "./core"
import {CaughtNonErrorPanic, Panic, PropagationPanic} from "./panic"

/** Represents the result of an operation that can either succeed with a value or fail */
export class ResultAsync<T> implements PromiseLike<Result<T>>, Methods<Promise<T>> {
	public constructor(private readonly promise: Promise<Result<T>>) {}

	public then<A, B>(
		successCallback?: (res: Result<T>) => A | PromiseLike<A>,
		failureCallback?: (reason: unknown) => B | PromiseLike<B>,
	): PromiseLike<A | B> {
		return this.promise.then(successCallback, failureCallback)
	}

	public unwrap = async () => {
		const result = await this.promise // What happens if promise rejects?
		return result.unwrap()
	}

	public unwrapErr = async () => {
		const result = await this.promise
		return result.unwrapErr()
	}

	public propagate = async () => {
		const result = await this.promise
		return result.propagate()
	}
}

export class OkAsync<T> extends ResultAsync<T> {}

export function okAsync<T>(value: T): OkAsync<T> {
	return new OkAsync(Promise.resolve(ok(value)))
}

export class ErrAsync extends ResultAsync<never> {}

export function errAsync(error: Error | string): ErrAsync {
	return new ErrAsync(Promise.resolve(err(error)))
}

function asyncFn<I, O>(fn: (args: I) => Promise<Result<O>>): (args: I) => ResultAsync<O> {
	return (() => {}) as any
}

// Instead of:
// async function ye(): ResultAsync<string> {
// 	if (Math.random() > 0.5) {
// 		return okAsync("ok")
// 	}
// 	return errAsync("err")
// }
// You'll have to do:
const ye = asyncFn(async (args: number): Promise<Result<string>> => {
	if (args > 1) {
		return ok("ok")
	}
	return err("err")
})

interface MyPromise extends Promise<string> {}

// This will never work, so I'll need to use the custom wrapper
// This is not a big deal since to make propagation work, we'll need the custom wrapper anyway
async function myAsyncFn(): MyPromise {
	return "hello"
}

// Second problem is, thw wrapper does not return a native promise, would that be a problem?
// Prisma uses their own promise, but prisma is only in Node.js; I'm not sure how thenable works in the browser
// Composition would be safer but it would require another call to get the value out
export class ResultAsync2<T> /* implements Methods<Promise<T>> */ {
	public constructor(private readonly promise: Promise<Result<T>>) {}

	public settle = async () => {
		// ResultAsync is a private entity, consumers should not instantiate it themselves
		// a Promise<Result<T>> should never reject, if it does it should be a "panic" error
		const result = await this.promise
		return result
	}

	public unwrap = async () => {
		const result = await this.promise // What happens if promise rejects?
		return result.unwrap()
	}

	public propagate = async () => {
		const result = await this.promise
		return result.propagate()
	}
}

// Instead of capture, there would be an R.function or R.fn that would wrap the function and return Result or ResultAsync

async function main() {
	const foo = new ResultAsync(Promise.resolve(ok("hello")))
	const bar = await foo
	if (bar.ok) {
		const ye = bar.value
	}
	const baz = await foo.unwrap()

	const str1 = await ye(2).propagate()
	const str2 = await ye(1).propagate()

	const fo22 = new ResultAsync2(Promise.resolve(ok("hello")))
	const bar2 = await fo22.settle()
}
