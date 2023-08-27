import {test, expect} from "vitest"
import {asyncFn} from "./async"
import {err, ok} from "./sync"

test("asyncFn", async () => {
	const errFunc = asyncFn(async () => {
		return err(new (class CustomError extends Error {})())
	})

	const func = asyncFn(async () => {
		return ok("ok")
	})

	const errResult = await errFunc()
	expect(errResult.ok).toBe(false)
	const result = await func()
	expect(result.ok).toBe(true)
})
