# patina

-   error- and nothing-handling library for TypeScript
-   inspired by Rust's `Result` and `Option` types
-   utilities for composing functions that return errors and interacting with code that throws errors

## Table of contents

-   [Installation](#installation)
-   [Usage](#Usage)
-   [Panic](#panic)
-   [Result](#result)
    -   [and](#and)
    -   [andThen](#andthen)
    -   [err](#err)
    -   [expect](#expect)
    -   [expectErr](#expecterr)
    -   [flatten](#flatten)
    -   [inspect](#inspect)
    -   [inspectErr](#inspecterr)
    -   [isErr](#iserr)
    -   [isErrAnd](#iserrand)
    -   [isOk](#isok)
    -   [isOk](#isokand)
    -   [map](#map)
    -   [mapErr](#maperr)
    -   [mapOr](#mapor)
    -   [mapOrElse](#maporelse)
    -   [ok](#ok)
    -   [or](#or)
    -   [orElse](#orelse)
    -   [unwrap](#unwrap)
    -   [unwrapErr](#unwraperr)
    -   [unwrapOr](#unwrapor)
    -   [unwrapOrElse](#unwraporelse)
    -   [match](#match)
-   [Async](#async)
-   [Utilities](#utilities)
-   [Testing](#testing)
-   [Similar Libraries](#similar-libraries)

## Installation

CommonJS and ESM modules are available.

```sh
npm install ruts
```

## Usage

```ts

```

## Result

### and

### andThen

### expect

### expectErr

### inspect

### inspectErr

### map

### mapErr

### mapOr

### mapOrElse

### or

### orElse

### unwrap

### unwrapErr

### unwrapOr

### unwrapOrElse

### match

## Async

## Utilities

## Testing

Adding an iterator to the Result class has introduced behavior that affects how testing libraries handle deep comparisons of instances of this class.
This is interfering with how deep equality checks are performed, as the tests rely on iterating over object properties or their prototypes to determine equality.

This means asserting equality between any two instances of the Result class will always pass, even if the instances are not equal:

```ts
expect(Ok()).toEqual(Ok(1));
expect(Err()).toEqual(Err(1));
expect(Ok()).toEqual(Err());
```

To properly test equality between instances of the Result class, you can unwrap the value and compare it directly:

```ts
expect(Ok().unwrap()).toEqual(Ok(1).unwrap()); // Now fails as expected
```

## Similar Libraries

-   [@badrap/result](https://github.com/badrap/result)
-   [effect](https://github.com/Effect-TS/effect)
-   [neverthrow](https://github.com/supermacro/neverthrow)
-   [option-t](https://github.com/option-t/option-t)
-   [oxide.ts](https://github.com/traverse1984/oxide.ts)
-   [true-myth](https://github.com/true-myth/true-myth)
-   [ts-results](https://github.com/vultix/ts-results)
-   [ts-results-es](https://github.com/lune-climate/ts-results-es)
