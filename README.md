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

### and

### andThen

### expect

### expectErr

### inspect

### inspectErr

### map

### mapErr

### mapOr

### mapOrElse

### or

### orElse

### unwrap

### unwrapErr

### unwrapOr

### unwrapOrElse

### match

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
