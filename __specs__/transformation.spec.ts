import * as path from 'path';
import { transformFileSync } from '@babel/core';

test('Transformations', () => {
  expect(transformFileSync(path.join(__dirname, '__fixtures__/index.ts'))!.code)
    .toMatchInlineSnapshot(`
    "\\"use strict\\";

    Object.defineProperty(exports, \\"__esModule\\", {
      value: true
    });
    exports.r6 = exports.r5 = exports.r4 = exports.r3 = exports.r2 = exports.r1 = void 0;

    const fn = i => i;

    const r1 = true ? true : false;
    exports.r1 = r1;
    const r2 = true ? true : undefined;
    exports.r2 = r2;
    const r3 = false ? true : undefined;
    exports.r3 = r3;
    const r4 = false ? true : false;
    exports.r4 = r4;
    const r5 = fn(2 === 2 ? 'equals' : 'unequal');
    exports.r5 = r5;
    const r6 = fn(fn(2 === 2) ? 'equals' : 'unequal');
    exports.r6 = r6;"
  `);
});
