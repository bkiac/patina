import { db } from "./db.ts";
import { Err, Ok, Result } from "../src/result.ts";
import { ResultAsync } from "../src/result_async.ts";
import { asyncFn } from "../src/fn.ts";
import { None, Option, Some } from "../src/option.ts";
import { ErrorWithCause, Panic } from "../src/error.ts";

function divide(a: number, b: number): Result<number, Error> {
	if (b === 0) {
		return Err(new Error("division by zero"));
	}
	return Ok(a / b);
}

// You do not have to use `namespace` pattern, but I find it useful to group errors and their mappers together.
// deno-lint-ignore no-namespace
namespace DatabaseError {
	export class Unreachable extends ErrorWithCause<Error> {
		readonly tag = "DatabaseError.Unreachable";
	}

	export class ValidationError extends ErrorWithCause<Error> {
		readonly tag = "DatabaseError.ValidationError";
	}

	export function from(error: Error): DatabaseError {
		if (error.message === "validation error") {
			return new ValidationError(error.message, { cause: error });
		}
		if (error.message === "unreachable") {
			return new Unreachable(error.message, { cause: error });
		}
		// Add more error variants here, for now we panic if we encounter an unknown error
		throw new Panic("unhandled database error", { cause: error });
	}
}
export type DatabaseError = DatabaseError.ValidationError | DatabaseError.Unreachable;

// Chain API example:
function findGradesByStudentId(id: string): ResultAsync<Option<number[]>, DatabaseError> {
	return Result.fromPromise(db.findGradesByStudentId(id))
		.map((grades) => (grades ? Some(grades) : None))
		.mapErr(DatabaseError.from);
}

// Or you can use `asyncFn` to wrap functions that return `Promise<Result<T, E>>` to convert return type to `ResultAsync<T, E>`
// Inferred type is `(studentId: string) => ResultAsync<number, Error>`
// @ts-ignore
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

const args: string[] = [];

function readFileSync(path: string, encoding: string): string;

// @ts-ignore
function parseConfig(): Result<number, Error> {
	return Option.fromNullish(args[2])
		.mapOrElse(
			() => {
				return Result.fromThrowable(() => {
					return readFileSync("/etc/someconfig.conf", "utf8");
				});
			},
			Ok,
		)
		.andThen((str) =>
			Result.fromThrowable(() => {
				return parseInt(str);
			})
		);
}

const json = Result.fromThrowable(() => {
	return readFileSync("config.json", "utf8");
}).andThen((contents) => {
	return Result.fromThrowable(() => JSON.parse(contents));
});
