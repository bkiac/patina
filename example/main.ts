import {
	asyncFn,
	AsyncResult,
	Err,
	ErrorWithCause,
	None,
	Ok,
	Option,
	Panic,
	Result,
	Some,
} from "../";
import { db } from "./db";

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
