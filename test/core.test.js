import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseNumber } from '../src/index.js';

test('plain integer string', () => {
  assert.equal(parseNumber('42'), 42);
});

test('negative integer with sign', () => {
  assert.equal(parseNumber('-7'), -7);
});

test('explicit positive sign', () => {
  assert.equal(parseNumber('+7'), 7);
});

test('US grouping: comma thousands, dot decimal', () => {
  assert.equal(parseNumber('1,234.5'), 1234.5);
});

test('European grouping: dot thousands, comma decimal', () => {
  assert.equal(parseNumber('1.234,5'), 1234.5);
});

test('space as thousands separator', () => {
  assert.equal(parseNumber('1 234 567'), 1234567);
});

test('apostrophe as thousands separator (Swiss style)', () => {
  assert.equal(parseNumber("1'234'567"), 1234567);
});

test('decimal-only fraction with no integer part', () => {
  assert.equal(parseNumber('.5'), 0.5);
});

test('integer with no thousands separators but a decimal mark', () => {
  assert.equal(parseNumber('3.14'), 3.14);
});

test('whitespace around the value is trimmed', () => {
  assert.equal(parseNumber('  42  '), 42);
});

test('large number with many groups', () => {
  assert.equal(parseNumber('1,000,000,000'), 1_000_000_000);
});

test('number too large for safe integer still parses as float', () => {
  const result = parseNumber('9,007,199,254,740,993');
  assert.equal(result, 9007199254740993);
});

test('invalid characters are rejected', () => {
  assert.throws(() => parseNumber('12abc'), SyntaxError);
});

test('underscore in digits is rejected (not a supported separator)', () => {
  assert.throws(() => parseNumber('1_234'), SyntaxError);
});

test('mixed separator styles are rejected', () => {
  assert.throws(() => parseNumber("1 234'567"), SyntaxError);
});

test('invalid grouping: wrong group size after first', () => {
  assert.throws(() => parseNumber('1,23,456'), SyntaxError);
});

test('empty string is rejected', () => {
  assert.throws(() => parseNumber(''), SyntaxError);
});

test('whitespace-only string is rejected', () => {
  assert.throws(() => parseNumber('   '), SyntaxError);
});

test('non-string input throws TypeError', () => {
  assert.throws(() => parseNumber(42), TypeError);
  assert.throws(() => parseNumber(null), TypeError);
  assert.throws(() => parseNumber(undefined), TypeError);
});
