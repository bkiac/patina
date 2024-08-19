# ruts

... description ...

## Table of contents

-   [Installation](#installation)
-   [Similar Libraries](#similar-libraries)
-   [Basic Usage](#basic-usage)
-   [Result](#result)
    -   [and](#and)
    -   [andThen](#andthen)
    -   [expect](#expect)
    -   [expectErr](#expecterr)
    -   [inspect](#inspect)
    -   [inspectErr](#inspecterr)
    -   [map](#map)
    -   [mapErr](#maperr)
    -   [mapOr](#mapor)
    -   [mapOrElse](#maporelse)
    -   [or](#or)
    -   [orElse](#orelse)
    -   [unwrap](#unwrap)
    -   [unwrapErr](#unwraperr)
    -   [unwrapOr](#unwrapor)
    -   [unwrapOrElse](#unwraporelse)
    -   [match](#match)
-   [Helpers](#helpers)
-   [Async](#async)

## Installation

```sh
npm install ruts
```

## Basic Usage

... add basic example ...

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

## Helpers

## Async

## Similar Libraries

-   [@badrap/result](https://github.com/badrap/result)
-   [effect](https://github.com/Effect-TS/effect)
-   [neverthrow](https://github.com/supermacro/neverthrow)
-   [option-t](https://github.com/option-t/option-t)
-   [oxide.ts](https://github.com/traverse1984/oxide.ts)
-   [true-myth](https://github.com/true-myth/true-myth)
-   [ts-results](https://github.com/vultix/ts-results)

Other useful libraries

-   [ts-pattern](https://github.com/gvergnaud/ts-pattern)

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
