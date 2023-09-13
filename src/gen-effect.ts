export const EffectTypeId: unique symbol = Symbol.for("@effect/io/Effect") as EffectTypeId
export type EffectTypeId = typeof EffectTypeId

export interface Hash {
	[symbol](): number
}

export const symbol: unique symbol = Symbol.for("@effect/data/Equal")
export interface Equal extends Hash {
	[symbol](that: Equal): boolean
}

export interface Variance<R, E, A> {
	readonly [EffectTypeId]: {
		readonly _R: (_: never) => R
		readonly _E: (_: never) => E
		readonly _A: (_: never) => A
	}
}

export interface Pipeable {
	pipe<A, B>(this: A, ab: (_: A) => B): B
	pipe<A, B, C>(this: A, ab: (_: A) => B, bc: (_: B) => C): C
	pipe<A, B, C, D>(this: A, ab: (_: A) => B, bc: (_: B) => C, cd: (_: C) => D): D
	pipe<A, B, C, D, E>(
		this: A,
		ab: (_: A) => B,
		bc: (_: B) => C,
		cd: (_: C) => D,
		de: (_: D) => E,
	): E
	pipe<A, B, C, D, E, F>(
		this: A,
		ab: (_: A) => B,
		bc: (_: B) => C,
		cd: (_: C) => D,
		de: (_: D) => E,
		ef: (_: E) => F,
	): F
	pipe<A, B, C, D, E, F, G>(
		this: A,
		ab: (_: A) => B,
		bc: (_: B) => C,
		cd: (_: C) => D,
		de: (_: D) => E,
		ef: (_: E) => F,
		fg: (_: F) => G,
	): G
	pipe<A, B, C, D, E, F, G, H>(
		this: A,
		ab: (_: A) => B,
		bc: (_: B) => C,
		cd: (_: C) => D,
		de: (_: D) => E,
		ef: (_: E) => F,
		fg: (_: F) => G,
		gh: (_: G) => H,
	): H
	pipe<A, B, C, D, E, F, G, H, I>(
		this: A,
		ab: (_: A) => B,
		bc: (_: B) => C,
		cd: (_: C) => D,
		de: (_: D) => E,
		ef: (_: E) => F,
		fg: (_: F) => G,
		gh: (_: G) => H,
		hi: (_: H) => I,
	): I
	pipe<A, B, C, D, E, F, G, H, I, J>(
		this: A,
		ab: (_: A) => B,
		bc: (_: B) => C,
		cd: (_: C) => D,
		de: (_: D) => E,
		ef: (_: E) => F,
		fg: (_: F) => G,
		gh: (_: G) => H,
		hi: (_: H) => I,
		ij: (_: I) => J,
	): J
	pipe<A, B, C, D, E, F, G, H, I, J, K>(
		this: A,
		ab: (_: A) => B,
		bc: (_: B) => C,
		cd: (_: C) => D,
		de: (_: D) => E,
		ef: (_: E) => F,
		fg: (_: F) => G,
		gh: (_: G) => H,
		hi: (_: H) => I,
		ij: (_: I) => J,
		jk: (_: J) => K,
	): K
	pipe<A, B, C, D, E, F, G, H, I, J, K, L>(
		this: A,
		ab: (_: A) => B,
		bc: (_: B) => C,
		cd: (_: C) => D,
		de: (_: D) => E,
		ef: (_: E) => F,
		fg: (_: F) => G,
		gh: (_: G) => H,
		hi: (_: H) => I,
		ij: (_: I) => J,
		jk: (_: J) => K,
		kl: (_: K) => L,
	): L
	pipe<A, B, C, D, E, F, G, H, I, J, K, L, M>(
		this: A,
		ab: (_: A) => B,
		bc: (_: B) => C,
		cd: (_: C) => D,
		de: (_: D) => E,
		ef: (_: E) => F,
		fg: (_: F) => G,
		gh: (_: G) => H,
		hi: (_: H) => I,
		ij: (_: I) => J,
		jk: (_: J) => K,
		kl: (_: K) => L,
		lm: (_: L) => M,
	): M
	pipe<A, B, C, D, E, F, G, H, I, J, K, L, M, N>(
		this: A,
		ab: (_: A) => B,
		bc: (_: B) => C,
		cd: (_: C) => D,
		de: (_: D) => E,
		ef: (_: E) => F,
		fg: (_: F) => G,
		gh: (_: G) => H,
		hi: (_: H) => I,
		ij: (_: I) => J,
		jk: (_: J) => K,
		kl: (_: K) => L,
		lm: (_: L) => M,
		mn: (_: M) => N,
	): N
	pipe<A, B, C, D, E, F, G, H, I, J, K, L, M, N, O>(
		this: A,
		ab: (_: A) => B,
		bc: (_: B) => C,
		cd: (_: C) => D,
		de: (_: D) => E,
		ef: (_: E) => F,
		fg: (_: F) => G,
		gh: (_: G) => H,
		hi: (_: H) => I,
		ij: (_: I) => J,
		jk: (_: J) => K,
		kl: (_: K) => L,
		lm: (_: L) => M,
		mn: (_: M) => N,
		no: (_: N) => O,
	): O
	pipe<A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P>(
		this: A,
		ab: (_: A) => B,
		bc: (_: B) => C,
		cd: (_: C) => D,
		de: (_: D) => E,
		ef: (_: E) => F,
		fg: (_: F) => G,
		gh: (_: G) => H,
		hi: (_: H) => I,
		ij: (_: I) => J,
		jk: (_: J) => K,
		kl: (_: K) => L,
		lm: (_: L) => M,
		mn: (_: M) => N,
		no: (_: N) => O,
		op: (_: O) => P,
	): P
	pipe<A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q>(
		this: A,
		ab: (_: A) => B,
		bc: (_: B) => C,
		cd: (_: C) => D,
		de: (_: D) => E,
		ef: (_: E) => F,
		fg: (_: F) => G,
		gh: (_: G) => H,
		hi: (_: H) => I,
		ij: (_: I) => J,
		jk: (_: J) => K,
		kl: (_: K) => L,
		lm: (_: L) => M,
		mn: (_: M) => N,
		no: (_: N) => O,
		op: (_: O) => P,
		pq: (_: P) => Q,
	): Q
	pipe<A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q, R>(
		this: A,
		ab: (_: A) => B,
		bc: (_: B) => C,
		cd: (_: C) => D,
		de: (_: D) => E,
		ef: (_: E) => F,
		fg: (_: F) => G,
		gh: (_: G) => H,
		hi: (_: H) => I,
		ij: (_: I) => J,
		jk: (_: J) => K,
		kl: (_: K) => L,
		lm: (_: L) => M,
		mn: (_: M) => N,
		no: (_: N) => O,
		op: (_: O) => P,
		pq: (_: P) => Q,
		qr: (_: Q) => R,
	): R
	pipe<A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q, R, S>(
		this: A,
		ab: (_: A) => B,
		bc: (_: B) => C,
		cd: (_: C) => D,
		de: (_: D) => E,
		ef: (_: E) => F,
		fg: (_: F) => G,
		gh: (_: G) => H,
		hi: (_: H) => I,
		ij: (_: I) => J,
		jk: (_: J) => K,
		kl: (_: K) => L,
		lm: (_: L) => M,
		mn: (_: M) => N,
		no: (_: N) => O,
		op: (_: O) => P,
		pq: (_: P) => Q,
		qr: (_: Q) => R,
		rs: (_: R) => S,
	): S
	pipe<A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q, R, S, T>(
		this: A,
		ab: (_: A) => B,
		bc: (_: B) => C,
		cd: (_: C) => D,
		de: (_: D) => E,
		ef: (_: E) => F,
		fg: (_: F) => G,
		gh: (_: G) => H,
		hi: (_: H) => I,
		ij: (_: I) => J,
		jk: (_: J) => K,
		kl: (_: K) => L,
		lm: (_: L) => M,
		mn: (_: M) => N,
		no: (_: N) => O,
		op: (_: O) => P,
		pq: (_: P) => Q,
		qr: (_: Q) => R,
		rs: (_: R) => S,
		st: (_: S) => T,
	): T
	pipe<A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q, R, S, T, U>(
		this: A,
		ab: (_: A) => B,
		bc: (_: B) => C,
		cd: (_: C) => D,
		de: (_: D) => E,
		ef: (_: E) => F,
		fg: (_: F) => G,
		gh: (_: G) => H,
		hi: (_: H) => I,
		ij: (_: I) => J,
		jk: (_: J) => K,
		kl: (_: K) => L,
		lm: (_: L) => M,
		mn: (_: M) => N,
		no: (_: N) => O,
		op: (_: O) => P,
		pq: (_: P) => Q,
		qr: (_: Q) => R,
		rs: (_: R) => S,
		st: (_: S) => T,
		tu: (_: T) => U,
	): U
	pipe<A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q, R, S, T, U>(
		this: A,
		ab: (_: A) => B,
		bc: (_: B) => C,
		cd: (_: C) => D,
		de: (_: D) => E,
		ef: (_: E) => F,
		fg: (_: F) => G,
		gh: (_: G) => H,
		hi: (_: H) => I,
		ij: (_: I) => J,
		jk: (_: J) => K,
		kl: (_: K) => L,
		lm: (_: L) => M,
		mn: (_: M) => N,
		no: (_: N) => O,
		op: (_: O) => P,
		pq: (_: P) => Q,
		qr: (_: Q) => R,
		rs: (_: R) => S,
		st: (_: S) => T,
		tu: (_: T) => U,
	): U
}

export const NodeInspectSymbol = Symbol.for("nodejs.util.inspect.custom")
export type NodeInspectSymbol = typeof NodeInspectSymbol

export interface Inspectable {
	readonly toString: () => string
	readonly toJSON: () => unknown
	readonly [NodeInspectSymbol]: () => unknown
}

export interface Effect<R, E, A> extends Variance<R, E, A>, Equal, Pipeable, Inspectable {
	readonly [Unify.typeSymbol]?: unknown
	readonly [Unify.unifySymbol]?: EffectUnify<this>
	readonly [Unify.blacklistSymbol]?: EffectUnifyBlacklist
}

export interface EffectGen<R, E, A> {
	readonly _R: () => R
	readonly _E: () => E
	readonly _A: () => A
	readonly value: Effect<R, E, A>

	[Symbol.iterator](): Generator<EffectGen<R, E, A>, A>
}

const gen: <Eff extends EffectGen<any, any, any>, AEff>(
	f: (resume: Adapter) => Generator<Eff, AEff, any>,
) => Effect<
	[Eff] extends [never] ? never : [Eff] extends [EffectGen<infer R, any, any>] ? R : never,
	[Eff] extends [never] ? never : [Eff] extends [EffectGen<any, infer E, any>] ? E : never,
	AEff
> = effect.gen

const suspend = <R, E, A>(effect: LazyArg<Effect.Effect<R, E, A>>): Effect.Effect<R, E, A> =>
	flatMap(sync(effect), identity)

const adapter = function () {
	let x = arguments[0]
	for (let i = 1; i < arguments.length; i++) {
		x = arguments[i](x)
	}
	return new EffectGen(x) as any
}

const succeed = <A>(value: A): Effect.Effect<never, never, A> => {
	const effect = new EffectPrimitiveSuccess(OpCodes.OP_SUCCESS) as any
	effect.i0 = value
	return effect
}

function pipe(
	a: unknown,
	ab?: Function,
	bc?: Function,
	cd?: Function,
	de?: Function,
	ef?: Function,
	fg?: Function,
	gh?: Function,
	hi?: Function,
): unknown {
	switch (arguments.length) {
		case 1:
			return a
		case 2:
			return ab!(a)
		case 3:
			return bc!(ab!(a))
		case 4:
			return cd!(bc!(ab!(a)))
		case 5:
			return de!(cd!(bc!(ab!(a))))
		case 6:
			return ef!(de!(cd!(bc!(ab!(a)))))
		case 7:
			return fg!(ef!(de!(cd!(bc!(ab!(a))))))
		case 8:
			return gh!(fg!(ef!(de!(cd!(bc!(ab!(a)))))))
		case 9:
			return hi!(gh!(fg!(ef!(de!(cd!(bc!(ab!(a))))))))
		default: {
			let ret = arguments[0]
			for (let i = 1; i < arguments.length; i++) {
				ret = arguments[i](ret)
			}
			return ret
		}
	}
}

const flatMap = dual<
	<A, R1, E1, B>(
		f: (a: A) => Effect.Effect<R1, E1, B>,
	) => <R, E>(self: Effect.Effect<R, E, A>) => Effect.Effect<R1 | R, E1 | E, B>,
	<R, E, A, R1, E1, B>(
		self: Effect.Effect<R, E, A>,
		f: (a: A) => Effect.Effect<R1, E1, B>,
	) => Effect.Effect<R1 | R, E1 | E, B>
>(2, (self, f) => {
	const effect = new EffectPrimitive(OpCodes.OP_ON_SUCCESS) as any
	effect.i0 = self
	effect.i1 = f
	return effect
})

export const genInternal: typeof gen = (f) =>
	suspend(() => {
		const iterator = f(adapter)
		const state = iterator.next()
		const run = (
			state: IteratorYieldResult<any> | IteratorReturnResult<any>,
		): Effect.Effect<any, any, any> =>
			state.done
				? succeed(state.value)
				: pipe(
						state.value.value as unknown as Effect.Effect<any, any, any>,
						flatMap((val: any) => run(iterator.next(val))),
				  )
		return run(state)
	})
