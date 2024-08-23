# Patina

-   error- and nothing-handling library for TypeScript
-   inspired by Rust's [`Result`](https://doc.rust-lang.org/std/result/) and [`Option`](https://doc.rust-lang.org/std/option) types
-   utilities for composing functions that return errors and interacting with code that throws errors
-   no dependencies

## Table of contents

-   [Installation](#installation)
-   [Usage](#usage)
-   [Panic](#panic)
-   [Result](#result)
    -   [fromThrowable](#fromthrowablef-function)
    -   [fromPromise](#frompromisepromise-promise)
    -   [and](#andother-result)
    -   [andThen](#andthenf-function)
    -   [err](#err)
    -   [expect](#expectmessage-string)
    -   [expectErr](#expecterrmessage-string)
    -   [flatten](#flatten)
    -   [inspect](#inspectf-function)
    -   [inspectErr](#inspecterrf-function)
    -   [isErr](#iserr)
    -   [isOk](#isok)
    -   [map](#mapf-function)
    -   [mapErr](#maperrf-function)
    -   [mapOr](#mapordefaultvalue-t-f-function)
    -   [mapOrElse](#maporelsedefaultvalue-function-f-function)
    -   [ok](#ok)
    -   [or](#orother-result)
    -   [orElse](#orelsef-function)
    -   [unwrap](#unwrap)
    -   [unwrapErr](#unwraperr)
    -   [unwrapOr](#unwrapordefaultvalue-t)
    -   [unwrapOrElse](#unwraporelsef-function)
    -   [match](#matchmatcher-matcher)
-   [AsyncResult](#asyncresult)
-   [Option](#option)
-   [AsyncOption](#asyncoption)
-   [Utilities](#utilities)
    -   [Generators](#generators)
-   [Testing](#testing)
-   [Similar Libraries](#similar-libraries)

## Installation

CommonJS and ESM modules are available.

```sh
npm install @patina/core
```

## Usage

```ts
import {
	Result,
	Ok,
	Err,
	Option,
	Some,
	AsyncResult,
	None,
	asyncFn,
	Panic,
	ErrorWithCause,
} from "@patina/core";
import {db} from "./db";

function divide(a: number, b: number): Result<number, Error> {
	if (b === 0) {
		return Err(new Error("division by zero"));
	}
	return Ok(a / b);
}

// You do not have to use `namespace` pattern, but I find it useful to group errors and their mappers together.
namespace DatabaseError {
	export class Unreachable extends ErrorWithCause<Error> {
		readonly tag = "DatabaseError.Unreachable";
	}

	export class ValidationError extends ErrorWithCause<Error> {
		readonly tag = "DatabaseError.ValidationError";
	}

	export function from(error: Error): DatabaseError {
		if (error.message === "validation error") {
			return new ValidationError(error.message, {cause: error});
		}
		if (error.message === "unreachable") {
			return new Unreachable(error.message, {cause: error});
		}
		// Add more error variants here, for now we panic if we encounter an unknown error
		throw new Panic("unhandled database error", {cause: error});
	}
}
export type DatabaseError = DatabaseError.ValidationError | DatabaseError.Unreachable;

// Chain API example:
function findGradesByStudentId(id: string): AsyncResult<Option<number[]>, DatabaseError> {
	return Result.fromPromise(db.findGradesByStudentId(id))
		.map((grades) => (grades ? Some(grades) : None))
		.mapErr(DatabaseError.from);
}

// Or you can use `asyncFn` to wrap functions that return `Promise<Result<T, E>>` to convert return type to `AsyncResult<T, E>`
// Inferred type is `(studentId: string) => AsyncResult<number, Error>`
const getAverageGrade = asyncFn(async (studentId: string) => {
	const grades = await findGradesByStudentId(studentId)
		.andThen((maybeGrades) => {
			return maybeGrades.match({
				Some: (grades) => {
					if (grades.length === 0) {
						return Err(new Error("grades not found"));
					}
					return Ok(grades);
				},
				None: () => {
					// Map to error if grades not found
					return Err(new Error("grades not found"));
				},
			});
		})
		.mapErr(() => {
			// Map to generic error from database error, or handle each variant
			return new Error("failed to get grades");
		});

	// Check and return error
	if (grades.isErr()) {
		return Err(grades.unwrapErr());
	}

	// Safe to unwrap because we checked for error
	const value = grades.unwrap();
	return divide(
		value.reduce((a, b) => a + b, 0),
		value.length,
	);
});
```

## `Panic`

`Panic` is a special error that extends native `Error` and represents a panic condition. It is used to indicate that a function has failed in an unrecoverable way. The `throw` statement should only be used to raise exceptions that represent a bug detected in your program.

On the other hand, `Result` can represent either the successful outcome of some operation, `Ok<T>`, or an expected runtime error, `Err<E>`. `Result` types are used alongside user-defined error types that represent the various anticipated runtime failure modes that the associated operation might encounter. Unlike exceptions, `Result` types must be explicitly handled and propagated by the developer.

The utilities of this library are designed to differentiate between recoverable errors and panics. For example thrown `Panics` will not be caught:

```ts
function panicOrError() {
	const rand = Math.random();
	if (rand > 0.5) {
		throw new Panic("random panic");
	}
	return rand;
}

// Will not catch the panic
const result = Result.from(() => {
	panicOrError();
});
```

## `Result`

`Result` is a type that represents either success (`Ok`) or failure (`Err`).

`Result<T, E>` is the type used for returning errors. It is a discriminated union with the variants, `Ok<T>`, representing success and containing a value, and `Err<E>`, representing error and containing an error value.

Functions return `Result` whenever errors are expected and recoverable.

### `.fromThrowable(f: Function)`

Tries to execute a function and returns the result as a `Result`.

```ts
const result = Result.from(() => {
	if (Math.random() > 0.5) {
		return 42;
	} else {
		throw new Error("random error");
	}
});
```

### `.fromPromise(promise: Promise)`

Tries to resolve a promise and returns the result as a `AsyncResult`.

```ts
// AsyncResult<number, Error>
const result = Result.fromPromise(Promise.resolve(42));
```

### `.and(other: Result)`

Returns `other` if the result is `Ok`, otherwise returns `this` (as `Err`).

### `.andThen(f: Function)`

Calls `f` if the result is `Ok`, otherwise returns `this` (as `Err`).

```ts
let x: Result<number, string> = Ok(2);
assert.deepStrictEqual(x.andThen((n) => Ok(n * 2)).unwrap(), 4);

let y: Result<string, string> = Err("late error");
assert.deepStrictEqual(y.andThen((n) => Ok(n * 2)).unwrapErr(), "late error");
```

### `.err()`

Returns `None` if the result is `Ok`, otherwise returns `Some` containing the error.

### `.expect(message: string)`

Returns the contained `Ok` value.

Throws `Panic` if the value is an `Err`, with a message containing `message` and content of the `Err` as `cause`.

```ts
const x = Err("emergency failure");
x.expect("Testing expect"); // throws Panic: Testing expect
```

### `.expectErr(message: string)`

Returns the contained `Err` value.

Throws `Panic` if the value is an `Ok`, with a message containing `message` and content of the `Ok` as `cause`.

```ts
const x = Ok(2);
x.expectErr("Testing expectErr"); // throws Panic: Testing expectErr
```

### `.flatten()`

Converts from `Result<Result<U, F>, E>` to `Result<U, E | F>`.

### `.inspect(f: Function)`

Calls the provided function with the contained value (if `Ok`).

```ts
const x = Ok(2);
x.inspect((v) => console.log(v));
```

### `.inspectErr(f: Function)`

Calls the provided function with the contained error (if `Err`).

```ts
const x = Err("error");
x.inspectErr((e) => console.error(e));
```

### `.isErr()`

Returns `true` if the result is an `Err`, and narrows the type to `Err`.

### `.isOk()`

Returns `true` if the result is an `Ok`, and narrows the type to `Ok`.

### `.map(f: Function)`

Maps a `Result<T, E>` to `Result<U, E>` by applying a function to a contained `Ok` value, leaving an `Err` value untouched.

```ts
const x = Ok(10);
const mapped = x.map((n) => `number ${n}`);
assert.strictEqual(mapped.unwrap(), "number 10");
```

### `.mapErr(f: Function)`

Maps a `Result<T, E>` to `Result<T, F>` by applying a function to a contained `Err` value, leaving an `Ok` value untouched.

```ts
const x = Err("error");
const mapped = x.mapErr((s) => s.length);
assert.strictEqual(mapped.unwrapErr(), 5);
```

### `.mapOr(defaultValue: T, f: Function)`

Returns the provided default (if `Err`), or applies a function to the contained value (if `Ok`).

```ts
const x: Result<string, string> = Ok("foo");
assert.strictEqual(
	x.mapOr(42, (v) => v.length),
	3,
);

const y: Result<string, string> = Err("bar");
assert.strictEqual(
	y.mapOr(42, (v) => v.length),
	42,
);
```

### `.mapOrElse(defaultValue: Function, f: Function)`

Maps a `Result<T, E>` to `A | B` by applying fallback function `defaultValue` to a contained `Err` value, or function `f` to a contained `Ok` value.

```ts
const k = 21;

let x: Result<string, string> = Ok("foo");
assert.strictEqual(
	x.mapOrElse(
		() => k * 2,
		(v) => v.length,
	),
	3,
);

x = Err("bar");
assert.strictEqual(
	x.mapOrElse(
		() => k * 2,
		(v) => v.length,
	),
	42,
);
```

### `.ok()`

Returns `Some` if the result is `Ok`, otherwise returns `None`.

### `.or(other: Result)`

Returns `other` if the result is `Err`, otherwise returns `this` (as `Ok`).

```ts
let x: Result<number, string> = Ok(2);
let y: Result<number, string> = Err("late error");
assert.deepStrictEqual(x.or(y).unwrap(), 2);
assert.deepStrictEqual(y.or(x).unwrap(), 2);
```

### `.orElse(f: Function)`

Calls `f` if the result is `Err`, otherwise returns `this` (as `Ok`).

```ts
let x: Result<number, string> = Ok(2);
assert.deepStrictEqual(x.orElse((e) => Err(e + "bar")).unwrap(), 2);

let y: Result<number, string> = Err("foo");
assert.deepStrictEqual(y.orElse((e) => Err(e + "bar")).unwrapErr(), "foobar");
```

### `.unwrap()`

Returns the contained `Ok` value or `undefined`.

This works differently from Rust's `unwrap` method, which panics if the value is an `Err`. Since TypeScript compiler is not able to enforce that a value is checked for error before unwrapping, this method is safer to use.

```ts
let x: Result<number, string> = Ok(2);
let value = x.unwrap(); // `value` type is `2 | undefined`
if (x.isOk()) {
	value = x.unwrap(); // `value` type is `2`
} else {
	value = x.unwrap(); // `value` type is `undefined`
}
```

### `.unwrapErr()`

Returns the contained `Err` value or `undefined`.

This works differently from Rust's `unwrap_err` method, which panics if the value is an `Ok`. Since TypeScript compiler is not able to enforce that a value is checked for error before unwrapping, this method is safer to use.

```ts
let x: Result<number, string> = Err("failure");
let value = x.unwrapErr(); // `value` type is `"failure" | undefined`
if (x.isErr()) {
	value = x.unwrapErr(); // `value` type is `"failure"`
} else {
	value = x.unwrapErr(); // `value` type is `undefined`
}
```

### `.unwrapOr(defaultValue: T)`

Returns the contained `Ok` value or `defaultValue`.

```ts
let x: Result<number, string> = Ok(2);
assert.strictEqual(x.unwrapOr(0), 2);

let y: Result<number, string> = Err("error");
assert.strictEqual(y.unwrapOr(0), 0);
```

### `.unwrapOrElse(f: Function)`

Returns the contained `Ok` value or the result of a function.

```ts
let x: Result<number, string> = Ok(2);
assert.strictEqual(
	x.unwrapOrElse(() => 0),
	2,
);

let y: Result<number, string> = Err("error");
assert.strictEqual(
	y.unwrapOrElse(() => 0),
	0,
);
```

### `.match(matcher: Matcher)`

Matches a `Result<T, E>` to `A | B` by applying a matcher object. Similar to Rust's `match` statement.

```ts
const x: Result<number, string> = Ok(2);
assert.strictEqual(
	x.match({
		Ok: (v) => v * 2,
		Err: (e) => e.length,
	}),
	4,
);

const y: Result<number, string> = Err("error");
assert.strictEqual(
	y.match({
		Ok: (v) => v * 2,
		Err: (e) => e.length,
	}),
	5,
);
```

## `AsyncResult`

`AsyncResult` is a type that represents either success (`Ok`) or failure (`Err`) of an asynchronous operation.

It implements the `Promise` interface, so you can use it as a drop-in replacement for promises.

The same methods are available on `AsyncResult` as on `Result`.

Methods on both `Result` and `AsyncResult` have `async` versions that accept a function that return a `Promise`, e.g. `mapAsync`, `inspectAsync` `andThenAsync`, etc. These methods are useful for chaining asynchronous operations and will turn a `Result` into an `AsyncResult`.

## `Option`

Similar methods are available on `Option` as on `Result`.

### `.fromNullish(value: T)`

Returns `Some` if the value is not `null` or `undefined`, otherwise returns `None`.

```ts
const x = Option.fromNullish(42);
assert.deepStrictEqual(x.unwrap(), 42);

const y = Option.fromNullish(null);
assert.deepStrictEqual(y, None);

const z = Option.fromNullish(undefined);
assert.deepStrictEqual(z, None);
```

## `AsyncOption`

`AsyncOption` is a type that represents either a value (`Some`) or nothing (`None`) of an asynchronous operation.

## Utilities

### `asyncFn`

Wraps a function that returns any shape of `Promise<Result<any, any>>` and wraps the return value in a `AsyncResult`.

```ts
// (a: number, b: number) => Promise<Err<string> | Ok<number>>
const divide = async (a: number, b: number) => (b === 0 ? Err("division by zero") : Ok(a / b));

// (a: number, b: number) => AsyncResult<number, string>
const wrapped = asyncFn(divide);

// then you can await the result
const result = await wrapped(1, 2); // => Result<number, string>
```

### `isResult(value: any): value is Result`

Returns `true` if `value` is an instance of `Result`.

### `isAsyncResult(value: any): value is AsyncResult`

Returns `true` if `value` is an instance of `AsyncResult`.

### `isOption(value: any): value is Option`

Returns `true` if `value` is an instance of `Option`.

### `isAsyncOption(value: any): value is AsyncOption`

Returns `true` if `value` is an instance of `AsyncOption`.

### Generators

These utilities help your code appear and behave more like traditional synchronous code by propagating errors automatically.

Note that TS sometimes has trouble inferring yielded result type, especially when a lot of `yield*` operations are used in a single function. For complex cases, you may need to explicitly type the result or revert to handling `Results` directly.

#### `trySync`

Runs a generator function that returns a `Result` and infers its return type as `Result<T, E>`.

`yield*` must be used to unwrap and propagate a `Result`:

-   yielding an `Ok` will unwrap the value
-   yielding an `Err` will stop the function and return the error

```ts
// Result<number, string>
const result = tryFn(function* () {
	const a = yield* Ok(1);
	if (Math.random() > 0.5) {
		yield* Err("error");
	}
	return a + random;
});
```

#### `tryAsync`

Runs an async generator function that returns a `Result` and infers its return type as `AsyncResult<T, E>`.

`yield*` must be used to unwrap and propagate a `Result`:

-   yielding an `Ok` will unwrap the value
-   yielding an `Err` will stop the function and return the error

```ts
const okOne = () => new AsyncResult(Promise.resolve(Ok(1)));

// AsyncResult<number, string>
const result = tryAsync(async function* () {
	const a = yield* okOne();
	if (Math.random() > 0.5) {
		yield* Err("error");
	}
	return a + random;
});
```

## Testing

Adding an iterator to the Result class -- to make `trySync` and `tryAsync` work -- has introduced an unexpected behavior that has an effect on how testing libraries handle deep comparisons of instances of this class.
This may interfere with how deep equality checks are performed, as the tests rely on iterating over object properties or their prototypes to determine equality.

This means asserting equality between any two instances of the Result class will always pass, even if the instances are not equal:

```ts
expect(Ok()).toEqual(Ok(1));
expect(Err()).toEqual(Err(1));
expect(Ok()).toEqual(Err());
```

To properly test equality between instances of the Result class, you can unwrap the value or error and compare it with the expected value directly:

```ts
expect(Ok().unwrap()).toEqual(Ok(1).unwrap()); // Now fails as expected
```

## Similar Libraries

Unfortunately, there are no native TypeScript statements or expression that can help you deal with or propagate errors and you can only go so far with wrapping `try` and `catch`. Writing code with this library will look very different to what you're used to. Although it may seem verbose, it is more explicit and safer, but on the other hand it may not be straightforward to use and sometimes you can find yourself fighting the type system.

If you find this library lacking, you may want to check out similar libraries:

-   [@badrap/result](https://github.com/badrap/result)
-   [effect](https://github.com/Effect-TS/effect)
-   [neverthrow](https://github.com/supermacro/neverthrow)
-   [option-t](https://github.com/option-t/option-t)
-   [oxide.ts](https://github.com/traverse1984/oxide.ts)
-   [true-myth](https://github.com/true-myth/true-myth)
-   [ts-results](https://github.com/vultix/ts-results)
-   [ts-results-es](https://github.com/lune-climate/ts-results-es)
