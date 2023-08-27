/**
 * Returns true if the value is `PromiseLike`.
 */
export function isPromiseLike<T>(v: unknown): v is PromiseLike<T> {
	return (
		v instanceof Promise ||
		(v != null && typeof v === "object" && typeof (v as PromiseLike<T>).then === "function")
	)
}
