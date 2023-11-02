abstract class ResultError extends Error {
	abstract readonly tag: string
}

class StdError extends ResultError {
	readonly tag = "std"
}

class IoError extends ResultError {
	readonly tag = "io"
}

class HttpError extends ResultError {
	readonly tag = "http"
}
