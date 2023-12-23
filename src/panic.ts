import {inspectSymbol} from "./util"

export class Panic extends Error {
	override readonly cause?: unknown
	override readonly name: string = "Panic"

	constructor(message?: string, cause?: unknown) {
		super(message)
		this.cause = cause
	}

	// override toString() {
	// 	let str = formatErrorString(this.name, this.message)
	// 	if (this.cause !== undefined) {
	// 		str += ", caused by "
	// 		if (this.cause instanceof Error) {
	// 			str += formatErrorString(this.cause.name, this.cause.message)
	// 		} else {
	// 			str += String(this.cause)
	// 		}
	// 	}
	// 	return str
	// }

	[inspectSymbol]() {
		let str = this.stack
		if (this.cause !== undefined) {
			str += "\nCaused by: "
			if (this.cause instanceof Error && this.cause.stack) {
				str += this.cause.stack
			} else {
				str += String(this.cause)
			}
		}
		return str
	}
}

export class UnwrapPanic extends Panic {
	constructor(msg: string) {
		super(msg)
	}
}
