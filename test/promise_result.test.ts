import {describe, it, expect} from "vitest"
import {Err, Panic, PromiseResult, Ok, UnwrapPanic, PropagationPanic} from "../src"

describe.concurrent("expect", () => {
	it("returns the value when called on an Ok result", async () => {
		const result = new PromiseResult(Promise.resolve(new Ok(42)))
		const value = await result.expect("")
		expect(value).to.equal(42)
	})

	it("throws a Panic with the provided message when called on an Err result", async () => {
		const error = new Error("Original error")
		const result = new PromiseResult(Promise.resolve(new Err(error)))
		await expect(result.expect("Panic message")).rejects.toThrow(Panic)
	})

	it("throws a Panic with the provided Panic when called on an Err result", async () => {
		const error = new Error("Original error")
		const result = new PromiseResult(Promise.resolve(new Err(error)))
		const panic = new Panic("Panic")
		await expect(result.expect(panic)).rejects.toEqual(panic)
	})
})

describe.concurrent("expectErr", () => {
	it("returns the error when called on an Err result", async () => {
		const result = new PromiseResult(Promise.resolve(new Err(new Error("Test error"))))
		const error = await result.expectErr("")
		expect(error).toEqual(new Error("Test error"))
	})

	it("throws a Panic with the provided message when called on an Ok result", async () => {
		const result = new PromiseResult(Promise.resolve(new Ok()))
		await expect(result.expectErr("Panic message")).rejects.toThrow(Panic)
	})

	it("throws a Panic with the provided Panic when called on an Ok result", async () => {
		const result = new PromiseResult(Promise.resolve(new Ok()))
		const panic = new Panic("Panic")
		await expect(result.expectErr(panic)).rejects.toEqual(panic)
	})
})

describe.concurrent("isErr", () => {
	it("returns false for an Ok result", async () => {
		const result = new PromiseResult(Promise.resolve(new Ok()))
		await expect(result.isErr()).resolves.toEqual(false)
	})

	it("returns true for an Err result", async () => {
		const result = new PromiseResult(Promise.resolve(new Err(new Error("Test error"))))
		await expect(result.isErr()).resolves.toEqual(true)
	})
})

describe.concurrent("isErrAnd", () => {
	it("returns false for an Ok result", async () => {
		const result = new PromiseResult(Promise.resolve(new Ok()))
		await expect(result.isErrAnd(() => true)).resolves.toEqual(false)
	})

	it("returns true for an Err result when the provided function returns true", async () => {
		const result = new PromiseResult(Promise.resolve(new Err(new Error("Test error"))))
		await expect(result.isErrAnd(() => true)).resolves.toEqual(true)
	})

	it("returns false for an Err result when the provided function returns false", async () => {
		const result = new PromiseResult(Promise.resolve(new Err(new Error("Test error"))))
		await expect(result.isErrAnd(() => false)).resolves.toEqual(false)
	})
})

describe.concurrent("isOk", () => {
	it("returns true for an Ok result", async () => {
		const result = new PromiseResult(Promise.resolve(new Ok()))
		await expect(result.isOk()).resolves.toEqual(true)
	})

	it("returns false for an Err result", async () => {
		const result = new PromiseResult(Promise.resolve(new Err(new Error("Test error"))))
		await expect(result.isOk()).resolves.toEqual(false)
	})
})

describe.concurrent("isOkAnd", () => {
	it("returns true for an Ok result when the provided function returns true", async () => {
		const result = new PromiseResult(Promise.resolve(new Ok()))
		await expect(result.isOkAnd(() => true)).resolves.toEqual(true)
	})

	it("returns false for an Ok result when the provided function returns false", async () => {
		const result = new PromiseResult(Promise.resolve(new Ok()))
		await expect(result.isOkAnd(() => false)).resolves.toEqual(false)
	})

	it("returns false for an Err result", async () => {
		const result = new PromiseResult(Promise.resolve(new Err(new Error("Test error"))))
		await expect(result.isOkAnd(() => true)).resolves.toEqual(false)
	})
})

describe.concurrent("map", () => {
	it("returns the mapped value for an Ok result", async () => {
		const result = new PromiseResult(Promise.resolve(new Ok(42)))
		const result2 = result.map((value) => value * 2)
		await expect(result2).resolves.toEqual(new Ok(84))
	})

	it("returns the original Err for an Err result", async () => {
		const error = new Error("Test error")
		const result = new PromiseResult<number, Error>(Promise.resolve(new Err(error)))
		const result2 = result.map((value) => value * 2)
		const awaitedResult = await result
		await expect(result2).resolves.toEqual(awaitedResult)
	})
})

describe.concurrent("mapErr", () => {
	it("returns the mapped error for an Err result", async () => {
		const error = new Error("Test error")
		const result = new PromiseResult(Promise.resolve(new Err(error)))
		const result2 = result.mapErr(() => new Error("New error"))
		await expect(result2).resolves.toEqual(new Err(new Error("New error")))
	})

	it("returns the original Ok for an Err result", async () => {
		const result = new PromiseResult(Promise.resolve(new Ok()))
		const result2 = result.mapErr(() => new Error("New error"))
		await expect(result2).resolves.toEqual(new Ok())
	})
})

describe.concurrent("mapOr", () => {
	it("returns the mapped value for an Ok result", async () => {
		const result = new PromiseResult(Promise.resolve(new Ok(42)))
		const value = await result.mapOr(0, (value) => value * 2)
		expect(value).toEqual(84)
	})

	it("returns the default value for an Err result", async () => {
		const error = new Error("Test error")
		const result = new PromiseResult<number, Error>(Promise.resolve(new Err(error)))
		const value = await result.mapOr(0, (value) => value * 2)
		expect(value).toEqual(0)
	})
})

describe.concurrent("mapOrElse", () => {
	it("returns the mapped value for an Ok result", async () => {
		const result = new PromiseResult(Promise.resolve(new Ok(42)))
		const value = await result.mapOrElse(
			() => 0,
			(value) => value * 2,
		)
		expect(value).toEqual(84)
	})

	it("returns the default value from a function for an Err result", async () => {
		const result = new PromiseResult<number, Error>(
			Promise.resolve(new Err(new Error("Test error"))),
		)
		const value = await result.mapOrElse(
			() => 0,
			(value) => value * 2,
		)
		expect(value).toEqual(0)
	})
})

describe.concurrent("unwrap", () => {
	it("returns the value for an Ok result", async () => {
		const result = new PromiseResult(Promise.resolve(new Ok(42)))
		await expect(result.unwrap()).resolves.toEqual(42)
	})

	it("throws a Panic for an Err result", async () => {
		const error = new Error("Test error")
		const result = new PromiseResult(Promise.resolve(new Err(error)))
		await expect(result.unwrap()).rejects.toThrow(UnwrapPanic)
	})
})

describe.concurrent("unwrapErr", () => {
	it("returns the error for an Err result", async () => {
		const error = new Error("Test error")
		const result = new PromiseResult(Promise.resolve(new Err(error)))
		await expect(result.unwrapErr()).resolves.toEqual(error)
	})

	it("throws for an Ok result", async () => {
		const result = new PromiseResult(Promise.resolve(new Ok(42)))
		await expect(result.unwrapErr()).rejects.toThrow(UnwrapPanic)
	})
})

describe.concurrent("unwrapOr", () => {
	it("returns the value for an Ok result", async () => {
		const result = new PromiseResult(Promise.resolve(new Ok(42)))
		await expect(result.unwrapOr(0)).resolves.toEqual(42)
	})

	it("returns the default value for an Err result", async () => {
		const error = new Error("Test error")
		const result = new PromiseResult(Promise.resolve(new Err(error)))
		await expect(result.unwrapOr(42)).resolves.toEqual(42)
	})
})

describe.concurrent("unwrapOrElse", () => {
	it("returns the value for an Ok result", async () => {
		const result = new PromiseResult(Promise.resolve(new Ok(42)))
		await expect(result.unwrapOrElse(() => 0)).resolves.toEqual(42)
	})

	it("returns the default value from a function for an Err result", async () => {
		const error = new Error("Test error")
		const result = new PromiseResult(Promise.resolve(new Err(error)))
		await expect(result.unwrapOrElse(() => 42)).resolves.toEqual(42)
	})

	it("can panic", async () => {
		const error = new Error("Test error")
		const result = new PromiseResult(Promise.resolve(new Err(error)))
		await expect(() =>
			result.unwrapOrElse((error) => {
				throw new Panic(error)
			}),
		).rejects.toThrow(Panic)
	})
})

describe.concurrent("match", () => {
	it("calls the ok function for an Ok result", async () => {
		const result = new PromiseResult(Promise.resolve(new Ok(42)))
		const output = result.match(
			(value) => value * 2,
			() => 0,
		)
		await expect(output).resolves.toEqual(84)
	})

	it("calls the err function for an Err result", async () => {
		const error = new Error("Test error")
		const result = new PromiseResult<number, Error>(Promise.resolve(new Err(error)))
		const output = result.match(
			(value) => value * 2,
			() => 0,
		)
		await expect(output).resolves.toEqual(0)
	})
})

describe.concurrent("tap", () => {
	it("returns value for an Ok result", async () => {
		const result = new PromiseResult(Promise.resolve(new Ok(1)))
		await expect(result.tap()).resolves.toEqual(1)
	})

	it("throws PropagationPanic for an Err result", async () => {
		const error = new Error("custom error")
		const result = new PromiseResult(Promise.resolve(new Err(error)))
		await expect(() => result.tap()).rejects.toThrow(PropagationPanic)
		try {
			await result.tap()
		} catch (err) {
			expect((err as PropagationPanic<Error>).originalError).toEqual(error)
		}
	})
})
