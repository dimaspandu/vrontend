/**
 * Checks whether a file extension represents a JSX module.
 *
 * JSX is enabled purely by file extension. A dependency is transpiled
 * with compileJSX() when it resolves to a ".jsx" file, no import
 * assertion is involved.
 *
 * The factory name is resolved by compileJSX() itself:
 *  1. the bundler-level `jsxFactory` option (highest priority),
 *  2. an @jsx pragma comment in the target file,
 *  3. default "d"
 *
 * The extension must include the leading dot (e.g. ".jsx", not "jsx").
 *
 * @param {string} ext - File extension as returned by path.extname().
 * @returns {boolean} True if the extension marks a JSX module.
 */
export default function isJSXExtension(ext) {
  return ext === ".jsx";
}