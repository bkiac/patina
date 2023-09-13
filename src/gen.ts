type Ok<T> = {
	ok: true
	value: T
}

type Err<E extends Error> = {
	ok: false
	err: E
}

type Result<T, E extends Error> = Ok<T> | Err<E>

type GeneratorYieldType<T extends Generator> = T extends Generator<infer U, any, any> ? U : never
type GeneratorReturnType<T extends Generator> = T extends Generator<any, infer U, any> ? U : never
type ExtractErr<T> = T extends Err<infer E> ? E : never

function gen<T extends (...args: any[]) => Generator<Result<any, any>, any, any>>(f: T) {
	return (
		...args: Parameters<T>
	): Result<
		GeneratorReturnType<ReturnType<T>>,
		ExtractErr<GeneratorYieldType<ReturnType<T>>>
	> => {
		const generator = f(...args)

		while (true) {
			try {
				const next = generator.next()

				if (next.done) {
					return {ok: true, value: next.value}
				} else {
					if (next.value.ok === false) {
						return next.value
					}
				}
			} catch (error) {
				return {ok: false, err: error}
			}
		}
	}
}

class PositiveError extends Error {
	constructor() {
		super("not positive")
	}
}

class TooBigError extends Error {
	constructor() {
		super("too big")
	}
}

// type is (arg: number) => Result<void, TooBigError>
// but should be (arg: number) => Result<string, ParseError | TooBigError>
const fn = gen(function* (arg: number) {
	if (arg < 0) {
		yield {ok: true, value: "negative"}
	} else if (arg > 500) {
		yield {ok: false, err: new TooBigError()}
	} else {
		yield {ok: false, err: new PositiveError()}
	}
})
