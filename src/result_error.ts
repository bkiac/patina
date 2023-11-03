import {InvalidErrorPanic, Panic} from "./panic"

// TODO: Capture original error if possible
export abstract class ResultError extends Error {
	abstract readonly tag: string
}

export class StdError extends ResultError {
	static readonly tag = "std"
	readonly tag = StdError.tag
}

export type ErrorHandler<E extends ResultError = StdError> = (error: StdError) => E

export function toStdError(error: unknown): StdError {
	if (error instanceof Panic) {
		throw error
	}
	if (error instanceof Error) {
		return new StdError()
	}
	throw new InvalidErrorPanic(error)
}
