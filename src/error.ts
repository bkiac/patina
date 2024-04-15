/**
 * A special error to indicate an unrecoverable error.
 *
 * This error is not caught by any function of the library, and is meant to be used to indicate a critical error that should not be caught.
 *
 * Use this error when you want to indicate that the program should stop executing.
 */
export class Panic extends Error {
	override readonly name = "Panic";
	override readonly cause?: unknown;

	constructor(message?: string, options?: {cause?: unknown}) {
		super(message, options);
		this.cause = options?.cause;
	}
}

/**
 * An abstract class with a `tag` discriminant.
 *
 * Adding a discriminant field can be beneficial for distinguishing between different types of errors during error handling. It also prevents TypeScript from unifying types, ensuring that each error is treated uniquely based on its discriminant value.
 */
export abstract class ErrorWithTag extends Error {
	abstract readonly tag: string;
}

/**
 * An abstract class with a typed `cause` field.
 *
 * This class is useful for errors that have a cause, which is another error that caused the current error to occur.
 */
export abstract class ErrorWithCause<Cause> extends ErrorWithTag {
	override readonly cause: Cause;

	constructor(message: string, options: {cause: Cause}) {
		super(message);
		this.cause = options.cause;
	}
}

/**
 * Parses an error into an `Error` instance.
 *
 * If the error is already an instance of `Error`, it is returned as is. Otherwise, a new `TypeError` instance is created with the error as the cause.
 */
export function parseError(error: unknown): Error {
	if (error instanceof Error) {
		return error;
	}
	return new TypeError(`Unexpected error type: "${String(error)}"`, {cause: error});
}
