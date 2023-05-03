/**
 * Returns true if the value is a Promise.
 *
 * This is needed because Prisma returns a Promise-like object that is not an instance of Promise.
 */
export function isPromiseLike<T>(v: unknown): v is Promise<T> {
	return (
		v instanceof Promise ||
		(v != null && typeof v === "object" && typeof (v as Promise<T>).then === "function")
	)
}
