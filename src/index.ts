import { capture } from "./capture"
import type { Ok, Err, Result } from "./core"
import { ok, err } from "./core"
import { guard } from "./guard"
import { tryCatch } from "./try"
import { Panic, PropagationPanic } from "./core/panic"

export type { Ok, Err, Result }
export { Panic, PropagationPanic }

export class R {
	/** Creates an {@link Ok} result with the provided value. */
	static ok = ok

	/** Creates an {@link Err} result with the provided error or error message. */
	static err = err

	/** Executes a function or settles promise and wraps the result or error in a {@link Result}. */
	static try = tryCatch

	/** Wraps a function in a guard that catches any thrown errors and returns a {@link Result} */
	static guard = guard

	/** Wraps a function in a capture that catches any thrown {@link PropagationPanic} errors and returns a {@link Result}. */
	static capture = capture
}
