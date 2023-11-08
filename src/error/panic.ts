import {inspectSymbol} from "../util"

function formatErrorString(name: string, message = "") {
	return name + `(${message})`
}

function formatPanicString(panicName: string, panicMessage?: string, origin?: unknown) {
	let str = formatErrorString(panicName, panicMessage)
	if (origin) {
		str += " from "
		if (origin instanceof Error) {
			str += formatErrorString(origin.name, origin.message)
		} else {
			str += String(origin)
		}
	}
	return str
}

export class Panic extends Error {
	readonly origin?: unknown
	override readonly name: string = "Panic"

	constructor(message?: string, origin?: unknown) {
		super(message)
		this.origin = origin
		this.stack = this.stack?.replace(/^(.*?\n)/, this.toString() + "\n")
	}

	override toString() {
		return formatPanicString(this.name, this.message, this.origin)
	}

	[inspectSymbol]() {
		return this.stack
	}
}

export class UnwrapPanic extends Panic {
	constructor(msg: string) {
		super(msg)
	}
}
