import {inspectSymbol} from "../util"

export class Panic extends Error {
	readonly origin?: unknown
	override readonly name: string = "Panic"

	constructor(message?: string, origin?: unknown) {
		super(message)
		this.origin = origin
	}

	// override toString() {
	// 	let str = formatErrorString(this.name, this.message)
	// 	if (this.origin !== undefined) {
	// 		str += ", caused by "
	// 		if (this.origin instanceof Error) {
	// 			str += formatErrorString(this.origin.name, this.origin.message)
	// 		} else {
	// 			str += String(this.origin)
	// 		}
	// 	}
	// 	return str
	// }

	[inspectSymbol]() {
		let str = this.stack
		if (this.origin !== undefined) {
			str += "\nCaused by: "
			if (this.origin instanceof Error && this.origin.stack) {
				str += this.origin.stack
			} else {
				str += String(this.origin)
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
