/**
 * Parses a human-formatted number string that may use a locale-specific
 * thousands separator (comma, period, space, or apostrophe) into a Number.
 *
 * Design decision — ONE separator per input.
 * We deliberately refuse inputs that mix separators (e.g. "1,234.567.89").
 * Mixed separators are ambiguous without locale metadata, and guessing
 * silently is worse than refusing loudly. Callers who need to normalise
 * mixed input should do so before calling this function.
 *
 * Recognition rules, evaluated in priority order:
 *  1. The LAST "." or "," in the string is the decimal mark IF it is
 *     followed by exactly 1–2 digits AND (no other "."/"," follows).
 *  2. Otherwise every "."/"," is a thousands separator and is stripped.
 *  3. Spaces and apostrophes are always thousands separators; stripped.
 *  4. Exactly one decimal mark may appear. Zero or more thousands separators
 *     may appear. A thousands separator with the wrong grouping (not in
 *     groups of 3 from the integer part) is rejected.
 *  5. Leading + or - is allowed. Underscores are NOT allowed.
 *
 * @param {string} input
 * @returns {number}
 * @throws {TypeError} if input is not a string.
 * @throws {SyntaxError} if input is empty, contains invalid characters,
 *     mixes separator styles, or has malformed grouping.
 */
export function parseNumber(input) {
  if (typeof input !== 'string') {
    throw new TypeError(`parseNumber expected a string, got ${typeof input}`);
  }
  const trimmed = input.trim();
  if (trimmed.length === 0) {
    throw new SyntaxError('parseNumber: input is empty');
  }

  const match = /^[+-]?[0-9.,' ]+$/.exec(trimmed);
  if (!match) {
    throw new SyntaxError(`parseNumber: invalid characters in "${trimmed}"`);
  }

  const signMatch = /^[+-]/.exec(trimmed);
  const sign = signMatch && signMatch[0] === '-' ? '-' : '';
  const body = signMatch ? trimmed.slice(signMatch[0].length) : trimmed;

  // Detect decimal mark: the last '.' or ',' iff it starts a 1–2 digit tail.
  let decimalMark = null;
  const lastDot = body.lastIndexOf('.');
  const lastComma = body.lastIndexOf(',');
  const lastSep = Math.max(lastDot, lastComma);

  if (lastSep !== -1) {
    const tail = body.slice(lastSep + 1);
    if (tail.length >= 1 && tail.length <= 2 && /^[0-9]+$/.test(tail)) {
      // There must be no further '.' or ',' after this one.
      const after = body.slice(lastSep + 1);
      if (!/[.,]/.test(after)) {
        decimalMark = body[lastSep];
      }
    }
  }

  let intPart, fracPart;
  if (decimalMark !== null) {
    intPart = body.slice(0, lastSep);
    fracPart = body.slice(lastSep + 1);
  } else {
    intPart = body;
    fracPart = '';
  }

  const intDigits = intPart.replace(/[.,' ]/g, '');
  if (!/^[0-9]*$/.test(intDigits)) {
    throw new SyntaxError(`parseNumber: malformed integer part in "${trimmed}"`);
  }
  if (intDigits.length === 0 && fracPart.length === 0) {
    throw new SyntaxError(`parseNumber: no digits in "${trimmed}"`);
  }

  validateGrouping(intPart, decimalMark);

  // Assemble canonical numeric string. parseInt/parseFloat handle the sign.
  const canonical = fracPart.length > 0
    ? `${intDigits}.${fracPart}`
    : intDigits;

  if (intDigits.length === 0) {
    // Input was ".5" style; prepend a 0 so parseFloat behaves.
    return parseFloat(`${sign}0.${fracPart}`);
  }
  return parseFloat(`${sign}${canonical}`);
}

/**
 * Validates that thousands separators in the integer part are grouped in
 * triplets from the right, and that the separator used is consistent.
 * Apostrophes and spaces are always thousands separators; '.' and ',' are
 * thousands separators only when they are NOT the decimal mark.
 *
 * Consistency rule: only ONE thousands-separator style may appear in the
 * integer part. "1 234'567" is rejected — pick one convention.
 */
function validateGrouping(intPart, decimalMark) {
  if (intPart.length === 0) return;

  const seen = new Set();
  for (const ch of intPart) {
    if (ch === ' ' || ch === "'" || ch === '.' || ch === ',') {
      if (ch === decimalMark) continue;
      seen.add(ch);
    }
  }
  if (seen.size > 1) {
    throw new SyntaxError(
      `parseNumber: mixed thousands separators in "${intPart}"`
    );
  }

  const sep = seen.size === 1 ? [...seen][0] : null;
  if (sep === null) return;

  const groups = intPart.split(sep);
  for (let i = 0; i < groups.length; i++) {
    if (groups[i].length === 0) {
      throw new SyntaxError(`parseNumber: empty group in "${intPart}"`);
    }
  }
  // The first (leftmost) group may be 1–3 digits; every later group must be
  // exactly 3 digits. This matches every locale that groups by thousands.
  for (let i = 1; i < groups.length; i++) {
    if (groups[i].length !== 3) {
      throw new SyntaxError(
        `parseNumber: invalid thousands grouping in "${intPart}"`
      );
    }
  }
}
