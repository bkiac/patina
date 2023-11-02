import {InvalidErrorPanic, Panic} from "./panic"

// TODO: Capture original error if possible
export abstract class ResultError extends Error {
	abstract readonly tag: string
}

export class StdError extends ResultError {
	static readonly tag = "std"
	readonly tag = StdError.tag
}

// TODO: Maybe arg should be StdError, and don't let consumer override panics?
export type ErrorHandler<E extends ResultError = StdError> = (error: unknown) => E

export function defaultErrorHandler(error: unknown): StdError {
	if (error instanceof Panic) {
		throw error
	}
	if (error instanceof Error) {
		return new StdError()
	}
	throw new InvalidErrorPanic(error)
}
