import If from '../../if-expr.macro';

const fn = <T>(i: T) => i;

export const r1 = If(true)
  .then(true)
  .else(false)();

export const r2 = If(true).then(true)();

export const r3 = If(false).then(true)();

export const r4 = If(false)
  .then(true)
  .else(false)();

export const r5 = fn(
  If(2 === 2)
    .then('equals')
    .else('unequal')()
);

export const r6 = fn(
  If(fn(2 === 2))
    .then('equals')
    .else('unequal')()
);

export const r7 = fn(
  If(fn(2 !== 2))
    .then('equals')
    .elseIf(3 === 3)
    .then('nextEquals')()
);

export const r8 = fn(
  If(fn(2 !== 2))
    .then('equals')
    .elseIf(3 !== 3)
    .then('nextEquals')
    .elseIf(4 === 4)
    .then('furtherNextEquals')()
);

export const r9 = If(
  // If branch goes here:
  If(true)
    .then(true)
    .elseIf(false)
    .then(true)()
)
  .then(
    // Then branch goes here:
    If(true)
      .then(true)
      .elseIf(false)
      .then(true)()
  )
  .else(
    // else branch goes here:
    If(true)
      .then(true)
      .elseIf(false)
      .then(true)()
  )();
