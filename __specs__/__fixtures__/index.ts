import If from '../../if-expr.macro';

const fn = <T>(i: T) => i;

export const r1 = If(true)
  .then(true)
  .else(false).end;
export const r2 = If(true).then(true).end;
export const r3 = If(false).then(true).end;
export const r4 = If(false)
  .then(true)
  .else(false).end;
export const r5 = fn(
  If(2 === 2)
    .then('equals')
    .else('unequal').end
);
export const r6 = fn(
  If(fn(2 === 2))
    .then('equals')
    .else('unequal').end
);
