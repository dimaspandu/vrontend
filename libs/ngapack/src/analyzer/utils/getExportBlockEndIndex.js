/**
 * getExportBlockEndIndex(tokens, startIndex)
 *
 * Computes the end index of an ESM "export" statement, including:
 *  - export { ... } [from ...]
 *  - export * [as ...] from ...
 *  - export const/let/var ...
 *  - export function / export async function
 *  - export default / export default async function
 *  - export class / export default class
 */
export default function getExportBlockEndIndex(tokens, startIndex) {
  let i = startIndex;

  if (tokens[i].value !== "export") {
    throw new Error("Start index must be at 'export'");
  }
  i++;

  // ------------------------------------------------------
  // export default ...
  // ------------------------------------------------------
  if (tokens[i] && tokens[i].value === "default") {
    i++;

    // Handle optional 'async' after default
    if (tokens[i] && tokens[i].value === "async") {
      i++;
      return parseExportedFunction(tokens, i);
    }

    if (tokens[i] && tokens[i].value === "function") {
      return parseExportedFunction(tokens, i);
    }

    if (tokens[i] && tokens[i].value === "class") {
      return parseExportedClass(tokens, i);
    }

    if (tokens[i] && tokens[i].value === "{") {
      const end = findMatching(tokens, i, "{", "}");
      if (tokens[end + 1] && tokens[end + 1].value === ";") return end + 1;
      return end;
    }

    if (tokens[i] && tokens[i].value === "(") {
      const end = findMatching(tokens, i, "(", ")");
      if (tokens[end + 1] && tokens[end + 1].value === ";") return end + 1;
      return end;
    }

    return findStatementEnd(tokens, i);
  }

  // ------------------------------------------------------
  // export { ... } [from ...]
  // ------------------------------------------------------
  if (tokens[i] && tokens[i].value === "{") {
    const end = findMatching(tokens, i, "{", "}");
    i = end + 1;

    if (tokens[i] && tokens[i].value === "from") {
      i++;
      if (tokens[i] && (tokens[i].type === "string" || tokens[i].type === "identifier")) i++;
    }

    if (tokens[i] && tokens[i].value === ";") return i;
    return i - 1;
  }

  // ------------------------------------------------------
  // export * [as ...] from ...
  // ------------------------------------------------------
  if (tokens[i] && tokens[i].value === "*") {
    i++;
    if (tokens[i] && tokens[i].value === "as") {
      i++;
      if (tokens[i] && tokens[i].type === "identifier") i++;
    }

    if (tokens[i] && tokens[i].value === "from") {
      i++;
      if (tokens[i] && (tokens[i].type === "string" || tokens[i].type === "identifier")) i++;
    }

    if (tokens[i] && tokens[i].value === ";") return i;
    return i - 1;
  }

  // ------------------------------------------------------
  // export const/let/var ...
  // ------------------------------------------------------
  if (tokens[i] && ["const", "let", "var"].includes(tokens[i].value)) {
    return findStatementEnd(tokens, i);
  }

  // ------------------------------------------------------
  // export function / export async function
  // ------------------------------------------------------
  if (tokens[i] && (tokens[i].value === "function" || tokens[i].value === "async")) {
    // Handle optional 'async'
    if (tokens[i].value === "async") {
      i++;
      if (!tokens[i] || tokens[i].value !== "function") {
        throw new Error("Expected 'function' after 'async' in export");
      }
    }

    return parseExportedFunction(tokens, i);
  }

  // ------------------------------------------------------
  // export class
  // ------------------------------------------------------
  if (tokens[i] && tokens[i].value === "class") {
    return parseExportedClass(tokens, i);
  }

  throw new Error("Unsupported export variant at token: " + tokens[i].value);
}

/**
 * parseExportedFunction(tokens, i)
 *
 * Handles:
 *  - function foo(...) { ... }
 *  - async function foo(...) { ... }
 */
function parseExportedFunction(tokens, i) {
  i++; // skip 'function'

  // Optional function name
  if (tokens[i] && tokens[i].type === "identifier") i++;

  if (!tokens[i] || tokens[i].value !== "(") {
    throw new Error("Expected '(' after function name");
  }

  i = findMatching(tokens, i, "(", ")") + 1;

  if (!tokens[i] || tokens[i].value !== "{") {
    throw new Error("Expected '{' for function body");
  }

  return findMatching(tokens, i, "{", "}");
}

/**
 * parseExportedClass(tokens, i)
 *
 * Handles export class ... { ... }
 */
function parseExportedClass(tokens, i) {
  i++; // skip 'class'

  if (tokens[i] && tokens[i].type === "identifier") i++;

  if (!tokens[i] || tokens[i].value !== "{") {
    throw new Error("Expected '{' for class body");
  }

  return findMatching(tokens, i, "{", "}");
}

/**
 * findMatching(tokens, startIndex, open, close)
 *
 * Brace/paren/bracket matcher.
 */
function findMatching(tokens, startIndex, open, close) {
  let depth = 0;

  for (let i = startIndex; i < tokens.length; i++) {
    const t = tokens[i];

    if (t.value === open) depth++;
    else if (t.value === close) {
      depth--;
      if (depth === 0) return i;
    }
  }

  throw new Error("Unmatched token: " + open);
}

/**
 * Operators that always require a right-hand operand.
 *
 * A line break right after one of these is NOT a statement terminator: the
 * expression is still incomplete and continues on the following line, e.g.
 *
 *   export const createDOMPP =
 *     () => installDOMPP();
 *
 *   export const isNodeLike = (value) =>
 *     typeof Node !== "undefined" &&
 *     value instanceof Node;
 */
const CONTINUATION_OPERATORS = new Set([
  "=",
  "=>",
  ",",
  "+",
  "-",
  "*",
  "/",
  "%",
  "**",
  "&&",
  "||",
  "??",
  "?",
  ":",
  "==",
  "===",
  "!=",
  "!==",
  "<",
  ">",
  "<=",
  ">=",
  "+=",
  "-=",
  "*=",
  "/=",
  "%=",
  "&&=",
  "||=",
  "??="
]);

/**
 * findStatementEnd(tokens, i)
 *
 * Robust statement end finder:
 *  - semicolon
 *  - braces / parentheses / arrays / objects
 *  - multiline detection (only when the expression is actually complete)
 */
function findStatementEnd(tokens, i) {
  let last = tokens.length - 1;

  for (; i < tokens.length; i++) {
    const t = tokens[i];

    if (t.value === ";") return i;
    if (t.value === "(") { i = findMatching(tokens, i, "(", ")"); continue; }
    if (t.value === "{") { i = findMatching(tokens, i, "{", "}"); continue; }
    if (t.value === "[") { i = findMatching(tokens, i, "[", "]"); continue; }

    // An operator awaiting its right-hand operand cannot end the statement,
    // so a following line break must not be treated as a terminator.
    if (CONTINUATION_OPERATORS.has(t.value)) continue;

    const next = tokens[i + 1];
    if (next && next.line > t.line) return i;
  }

  return last;
}
