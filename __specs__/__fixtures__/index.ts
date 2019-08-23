import If from '../../if-expr.macro';

const fn = <T>(i: T) => i;

export const r1 = If(true)
  .then(true)
  .else(false)
  .end();

export const r2 = If(true)
  .then(true)
  .end();

export const r3 = If(false)
  .then(true)
  .end();

export const r4 = If(false)
  .then(true)
  .else(false)
  .end();

export const r5 = fn(
  If(2 === 2)
    .then('equals')
    .else('unequal')
    .end()
);

export const r6 = fn(
  If(fn(2 === 2))
    .then('equals')
    .else('unequal')
    .end()
);

export const r7 = fn(
  If(fn(2 !== 2))
    .then('equals')
    .elseIf(3 === 3)
    .then('nextEquals')
    .end()
);

export const r8 = fn(
  If(fn(2 !== 2))
    .then('equals')
    .elseIf(3 !== 3)
    .then('nextEquals')
    .elseIf(4 === 4)
    .then('furtherNextEquals')
    .end()
);

export const r9 = If(
  // If branch goes here:
  If(true)
    .then(true)
    .elseIf(false)
    .then(true)
    .end()
)
  .then(
    // Then branch goes here:
    If(true)
      .then(true)
      .elseIf(false)
      .then(true)
      .end()
  )
  .else(
    // else branch goes here:
    If(true)
      .then(true)
      .elseIf(false)
      .then(true)
      .end()
  )
  .end();
