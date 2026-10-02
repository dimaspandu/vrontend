# Changelog

All notable changes to this project will be documented in this file.

# [1.2.7] - 2026-10-02

## Fixed

- Fixed multiline `export const/let/var` assignments being truncated when the initializer continued on the next line, which emitted invalid code such as `const createDOMPP = ;() => installDOMPP();`.
  - `getExportBlockEndIndex` treated any line break as a statement terminator, so a break directly after an operator awaiting its right-hand operand ended the statement early.
  - The break heuristic is now skipped for continuation operators (assignment, `=>`, logical/comparison operators, ternary, comma, compound assignment).
  - Explicit `;` detection and balanced bracket scanning are unchanged, so single-line statements and block-bodied arrows behave exactly as before.

## Added

- Added regression tests for multiline export assignments in `transpileExportTokensToCJS`:
  - `Export const arrow function, line break after =`
  - `Export const arrow with logical operator across lines`
  - `Export const arrow with multiline call arguments`
  - `Export const arrow with multiline block body`
  - `Export const simple value still ends at line break` (guards against over-eager continuation)
- Added `runExportTranspileFromSource` test helper that tokenizes real source first, so tests carry `line` info. Previously all tests in this module used hand-written tokens without positional data, which silently disabled the line-break heuristic and left this path untested.

## Changed

- Documented `getExportBlockEndIndex` and its statement-boundary rules in `lib/transpileExportTokensToCJS/README.md`.

---

# [1.2.6] - 2026-09-26

## Added

- New module `lib/transpileJSX/` — minimal JSX-to-JS compiler that transforms JSX syntax into `d(tag, props, ...children)` call expressions.
  - Supports customizable factory name via `compileJSX(source, factory)` parameter or `/** @jsx name */` pragma in source.
  - Features: elements, self-closing tags, fragments (`<>...</>` → `factory.fragment(...)`), spread attributes, boolean attributes, expression containers, template literals in expressions.
- Comprehensive test suite (20 test cases) covering basic JSX, custom factory, pragma parsing, fragments, error handling, and demo-level components.

## Changed

- Updated `test/index.js` to include the new `transpileJSX` test suite.

---

# [1.2.5] - 2026-08-13

## Fixed

- Fixed HTML minifier to collapse newlines between text nodes and inline elements into a single space, matching standard HTML whitespace behavior.
- Removed unwanted leading/trailing spaces in minified output for multiline text content.

## Added

- Added regression tests for multiline text node collapsing in HTML minifier:
  - `Minify HTML - multiline text nodes collapse to single space`
  - `Minify HTML - inline element between text nodes`
  - `Minify HTML - inline element followed by text`

---

# [1.2.4] - 2026-08-13

## Fixed

- Fixed incorrect semicolon insertion for dynamic `import()` expressions nested inside other expressions (e.g., arrow function bodies, function arguments).
- Prevented duplicate semicolons when dynamic import is already followed by a semicolon.

## Added

- Added test coverage for dynamic import inside arrow function call (with and without parenthesized parameter) across tokenizer, `transpileImportTokensToCJS`, and `convertESMToCJSWithMeta`.

---

# [1.2.3] - 2026-08-13

## Fixed

- Fixed infinite loop in HTML tokenizer when parsing multiline tags with newline characters inside tag attributes.
- Fixed trailing whitespace before `>` in minified HTML output for tags with attributes.
- Renamed ambiguous test case to `Minify HTML - multiline tag with attributes` in HTML minifier test suite.

## Added

- Added test coverage for multiline HTML tags with attributes in both tokenizer and minifier.
- Added regression test ensuring no trailing space before closing tag bracket after minification.

---

# [1.2.2] - 2026-05-02

## Added

- Test cases for export default async function (named and anonymous) in convertESMToCJSWithMeta module.

---

# [1.2.1] - 2026-04-26

## Added

- Test cases for export default async function (named and anonymous) in transpileExportTokensToCJS module.

---

# [1.2.0] - 2026-01-25

## Added

- SAFE mode whitespace normalization:
  - Collapses consecutive or long whitespace tokens into a single space.
  - Automatically trims leading and trailing whitespace in SAFE output.
- Regression tests for CSS token adjacency handling, including:
  - `dimension + hash` (e.g. `1px #fff`)
  - Integration coverage for SAFE vs DEEP behavior.

## Changed

- SAFE minification behavior updated:
  - No longer preserves original indentation or excessive spacing.
  - Guarantees clean, single-space normalized output without re-stringification.
- SAFE mode output is now deterministic and idempotent.

## Fixed

- Fixed invalid CSS output in DEEP mode where `dimension` followed by `hash`
  could merge without required whitespace (e.g. `1px#fff`).
- Prevent leading and trailing whitespace artifacts in SAFE mode output.

---

# [1.1.0] - 2026-01-23

## Added

- CSS minifier enhanced with three levels:
  - `DEEP` (default): fully aggressive minification; removes comments, newlines, and all whitespace, then re-stringifies tokens.
  - `SMART`: removes comments and newlines; collapses consecutive whitespace into a single space; preserves single-space readability.
  - `SAFE`: removes comments and newlines only; preserves all original whitespace to avoid risky re-stringification.
- Leading and trailing newlines ignored in `SMART` mode to prevent extra spaces.
- Comprehensive test coverage added for all three levels, including:
  - Basic declarations, selectors, pseudo-classes, combinators.
  - Functions (`calc`, `linear-gradient`) and URL/string values.
  - Nested rules, media queries, and edge-case whitespace handling.

## Changed

- Default minification level changed from `SAFE` → `DEEP`.
- `minifyCSS` implementation refactored for clarity and maintainability.

## Fixed

- Prevent extra whitespace at start/end of minified CSS in `SMART` mode.
- Preserve spacing for single whitespace between values in `SMART` mode.

---

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

# [1.0.0] - 2026-01-12

## Added

- Initial release of **JS Analyzer**.
- Core modules:
  - `lib/tokenizer` for JS, CSS, HTML, JSON.
  - `lib/stringifyTokens` for JS, CSS, HTML, JSON.
  - `lib/minifier` for JS, CSS, HTML, JSON.
  - `lib/extractModules` for module detection.
  - `transpileImportTokensToCJS` and `transpileExportTokensToCJS`.
  - `convertESMToCJSWithMeta` for full JS pipeline orchestration.
- Deterministic, token-based processing model.
- Test harness with aggregated test runner.
- Minifier supports safe operator spacing, comments, whitespace, and newline removal.
- Example minification:  
  `const percent = total === 0 ? 0 : ((passed/total) * 100).toFixed(2);` consistently minified.
- Explicit test coverage ensuring **multiline template literal whitespace and empty lines are preserved** during minification.

## Changed

- N/A (initial release).

## Deprecated

- N/A

## Removed

- N/A

## Fixed

- N/A

## Security

- N/A
