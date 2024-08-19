# patina

-   error- and nothing-handling library for TypeScript
-   inspired by Rust's `Result` and `Option` types
-   utilities for composing functions that return errors and interacting with code that throws errors
-   no dependencies

## Table of contents

-   [Installation](#installation)
-   [Usage](#Usage)
-   [Panic](#panic)
-   [Result](#result)
    -   [and](#and)
    -   [andThen](#andthen)
    -   [err](#err)
    -   [expect](#expect)
    -   [expectErr](#expecterr)
    -   [flatten](#flatten)
    -   [inspect](#inspect)
    -   [inspectErr](#inspecterr)
    -   [isErr](#iserr)
    -   [isErrAnd](#iserrand)
    -   [isOk](#isok)
    -   [isOk](#isokand)
    -   [map](#map)
    -   [mapErr](#maperr)
    -   [mapOr](#mapor)
    -   [mapOrElse](#maporelse)
    -   [ok](#ok)
    -   [or](#or)
    -   [orElse](#orelse)
    -   [unwrap](#unwrap)
    -   [unwrapErr](#unwraperr)
    -   [unwrapOr](#unwrapor)
    -   [unwrapOrElse](#unwraporelse)
    -   [match](#match)
-   [Async](#async)
-   [Utilities](#utilities)
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
} from "../";
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

## Result

`Result` is a type that represents either success (`Ok`) or failure (`Err`).

`Result<T, E>` is the type used for returning errors. It is a discriminated union with the variants, `Ok<T>`, representing success and containing a value, and `Err<E>`, representing error and containing an error value.

Functions return `Result` whenever errors are expected and recoverable.

### `.from(f: Function)`

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

## Async

## Utilities

## Testing

Adding an iterator to the Result class has introduced behavior that affects how testing libraries handle deep comparisons of instances of this class.
This is interfering with how deep equality checks are performed, as the tests rely on iterating over object properties or their prototypes to determine equality.

This means asserting equality between any two instances of the Result class will always pass, even if the instances are not equal:

```ts
expect(Ok()).toEqual(Ok(1));
expect(Err()).toEqual(Err(1));
expect(Ok()).toEqual(Err());
```

To properly test equality between instances of the Result class, you can unwrap the value and compare it directly:

```ts
expect(Ok().unwrap()).toEqual(Ok(1).unwrap()); // Now fails as expected
```

## Similar Libraries

-   [@badrap/result](https://github.com/badrap/result)
-   [effect](https://github.com/Effect-TS/effect)
-   [neverthrow](https://github.com/supermacro/neverthrow)
-   [option-t](https://github.com/option-t/option-t)
-   [oxide.ts](https://github.com/traverse1984/oxide.ts)
-   [true-myth](https://github.com/true-myth/true-myth)
-   [ts-results](https://github.com/vultix/ts-results)
-   [ts-results-es](https://github.com/lune-climate/ts-results-es)
