/**
 * Tries to replace the stack trace to include the subclass error name.
 *
 * May not work in every environment, since `stack` property is implementation-dependent and isn't standardized,
 *
 * meaning different JavaScript engines might produce different stack traces.
 *
 * See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/stack
 */
export function replaceStack(name: string, originName: string, stack?: string) {
	const r = new RegExp(`^${originName}`)
	return stack?.replace(r, name)
}

export function replaceName(name: string, originName?: string) {
	return originName ? `${name} from ${originName}` : name
}
