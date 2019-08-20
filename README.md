# About

An expression-oriented fluent alternative to javascript's if-statement that compiles away to ternary expressions

## Example

Source:

```
processResult(
  If(2 === 2)
    .then('equals')
    .else('unequal')
    .end
)
```

Compiled output:

```
processResult(
  2 === 2 ? 'equals' : 'unequal'
)
```

## Why ?

1. Javascript if-else statements are not expressions.
2. Ternary expressions are ugly and even more so when nested.
3. Solutions like [lodash.cond](https://lodash.com/docs/latest#cond) have unnecessary function invocation overhead and are less readable.
   To ensure lazy evaluation we need to wrap each branch in function.

## Installation

This utility is implemented as a [babel-macro](https://github.com/kentcdodds/babel-plugin-macros).

Refer babel's [setup instructions](https://babeljs.io/setup) to learn how to setup your project to use [babel](https://babeljs.io) for compilation.

1. Install `babel-plugin-macros` and `if-expr.macro`:

```
npm install --save-dev babel-plugin-macros if-expr.macro
```

2. Add babel-plugin-macros to .babelrc (if not already preset):

```
// .babelrc

module.exports = {
  presets: [
    // ... other presets
  ],
  plugins: [
    'babel-plugin-macros'    // <-- REQUIRED
    // ... other plugins
  ],
};
```

3. Import `if-expr.macro` in your code:

```
// src/foo.js

import If from 'if-expr.macro';

const result = If(true).then(true).end;
```

## Features

- Branches are evaluated lazily

```
const result = If(true).then(someFn()).else(someOtherFn()).end;

// result is what someFn returns
// someOtherFn is never called
```

- then/else branches are optional

```
const result = If(false).then(someFn()).end;

// someFn is never called
// result is undefined
```

- Multiple then/else branches are allowed:

```
const result = If(true)
  .then(someFn())
  .then(someOtherFn())
  .end;

// Both someFn and someOtherFn are called
// result is what someOtherFn returns
```


```
const result = If(false)
  .then(someFn())
  .elseIf(true)
  .then(someOtherFn())
  .end;

// Only someOtherFn is called
// result is what someOtherFn returns
```


- Side-effect only branches:

```
If(true)
    .thenDo(someFn(), someOtherFn(), yetAnotherFn())
    .thenDo(someOtherFn())
    .end;

// All of the functions are called (in specified order), but their return values are discareded
// The expression evaluates to undefined
```

- Side-effect only branches can be combined with then/else branches:

```
const result = If(true)
    .then(someFn())
    .thenDo(someOtherFn())
    .end;

// result is what someFn returns
// returned value (if any) of someOtherFn is discarded
```

## Usage with TypeScript

This library is type-safe and comes with type definitions.

All code must be processed through babel. Compilation through tsc (only) is not supported.

Recommended babel configuration:

```
// .babelrc

module.exports = {
  presets: [
    '@babel/preset-typescript',
    // ... other presets
  ],
  plugins: [
    'babel-plugin-macros'
    // ... other plugins
  ],
};
```

### Flow based type inference

One caveat is that TypeScript's flow-based type inference will not treat `.then`, `.else` branches same as normal `if/else` branches.

```
const a: undefined | string = getSomeValue();

if (a) {
    someFnThatExpectsString(a); // Not an error because TypeScript is smart enough to know
                                // that a can not be undefined in this branch
}
```

```
const a: undefined | string = getSomeValue();

If(a).then(someFnThatexpectsString(a as string)).end
                                     |________|
// We need to identify  -.             ^
// a as a string to      |------------/
// prevent type error   -'
```

AFAIK, currently there is no workaround for feasible.

## Caveats

Every If/then/else chain fluent must end with an `.end` invocation without interruptions.

For example:

```
const a = 10;
const intermediate = If(a === 10).then('equal');
const result = intermediate.end;
```

Above code will fail to compile.

Because the entire If/then/else chain is compiled away, anything return by If/then/else can not be assigned, referenced, or used in any computation.

## License

MIT
