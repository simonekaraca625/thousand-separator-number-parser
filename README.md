# Thousand Separator Number Parser

Parses human-formatted numbers that use locale-specific thousands separators — comma, period, space, or apostrophe — into JavaScript `Number` values.

```js
import { parseNumber } from 'thousand-separator-number-parser';

parseNumber('1,234.5');     // 1234.5   (US: comma thousands, dot decimal)
parseNumber('1.234,5');     // 1234.5   (European: dot thousands, comma decimal)
parseNumber("1'234'567");   // 1234567  (Swiss apostrophe grouping)
parseNumber('1 234 567');   // 1234567  (space grouping)
parseNumber('42');          // 42
```

## Why this exists

Copying a number out of a European spreadsheet or pasting a Swiss price into a form usually lands a string like `1.234,56` in your code, which `parseFloat` silently truncates to `1.234`. This library reads the separator style from the string itself instead of requiring you to pass a locale tag.

The trade-off: it guesses the decimal mark from position and grouping, so it refuses inputs that mix separator styles (e.g. `1 234'567`) rather than guess wrong. It does not parse scientific notation, currency symbols, or leading/trailing labels — feed it the digits only.

## Awkward edge

The decimal mark is inferred as the last `.` or `,` only when it is followed by 1–3 digits and no further `.`/`,` appears after it. So `1,234` is `1234` (comma is thousands), but `1,2345` treats the comma as thousands and then rejects it for bad grouping — it does **not** silently become `1.2345`. If you need to parse a value with a four-digit fractional part, prepend a zero: `0,2345` is read as `0.2345`.

The single exported name is `parseNumber`.

## Performance

The window keeps a bounded buffer, so `push` is constant time and memory does not
grow with the length of the stream. `peak` and `trough` are linear in the window
size, which is the trade that keeps `push` cheap.

