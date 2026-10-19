import test from 'node:test';
import assert from 'node:assert/strict';
import { swipeDirection } from '../src/gesture.js';

test('swipe distance and direction thresholds include the exact boundary only', () => {
  for (const sign of [-1, 1]) {
    const direction = sign < 0 ? 'left' : 'right';
    assert.equal(swipeDirection(sign * 59.9, 0), null);
    assert.equal(swipeDirection(sign * 60, 0), direction);
    assert.equal(swipeDirection(sign * 60.1, 0), direction);
    assert.equal(swipeDirection(sign * 60, 40), direction);
    assert.equal(swipeDirection(sign * 60, 40.1), null);
    assert.equal(swipeDirection(sign * 90, 90), null);
  }
  for (const [dx, dy] of [[0, 100], [0, 0], [NaN, 0], [50, 80]]) assert.equal(swipeDirection(dx, dy), null);
});
