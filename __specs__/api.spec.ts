import If from '../if-expr.macro';
import * as results from './__fixtures__';

test('API', () => {
  expect(results.r1).toBe(true);
  expect(results.r2).toBe(true);
  expect(results.r3).toBeUndefined();
  expect(results.r4).toBe(false);
  expect(results.r5).toBe('equals');
  expect(results.r6).toBe('equals');
  expect(results.r7).toBe('nextEquals');
  expect(results.r8).toBe('furtherNextEquals');
  const mockFn = jest.fn(() => {});
  expect(If(true).elseDo(mockFn(), mockFn())()).toBeUndefined();
  expect(mockFn.mock.calls.length).toBe(0);
  mockFn.mockReset();
  expect(
    If(true)
      .thenDo(mockFn(), mockFn())
      .elseDo(mockFn())()
  ).toBeUndefined();
  expect(mockFn.mock.calls.length).toBe(2);
  mockFn.mockReset();
  expect(
    If(false)
      .thenDo(mockFn(), mockFn())
      .elseIf(true)
      .then('result')()
  ).toBe('result');
  mockFn.mockReset();
  expect(
    If(true)
      .thenDo(mockFn(), mockFn())
      .then(2)
      .elseDo(mockFn())()
  ).toBe(2);
  expect(
    If(true)
      .then(2)
      .thenDo(mockFn(), mockFn())
      .elseDo(mockFn())()
  ).toBe(2);
  expect(
    If(false)
      .then(2)
      .thenDo(mockFn(), mockFn())
      .elseDo(mockFn())
      .else(5)()
  ).toBe(5);
  expect(
    If(false)
      .thenDo(mockFn(), mockFn())
      .elseDo(mockFn())
      .else(5)()
  ).toBe(5);
});
