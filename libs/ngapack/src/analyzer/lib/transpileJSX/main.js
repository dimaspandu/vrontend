/**
 * Minimal JSX -> JS compiler with customizable factory name
 *
 * Input:
 *   <div className="foo">
 *     <h1>{title}</h1>
 *     Hello
 *   </div>
 *
 * Output (factory: "d"):
 *   d("div", {
 *     className: "foo"
 *   },
 *     d("h1", null, title),
 *     "Hello"
 *   )
 *
 * The factory name can be customized via:
 * 1. The `factory` parameter (highest priority).
 * 2. A JSX pragma comment (e.g. jsx pragma with name) in source.
 *
 * Parameter takes precedence over pragma; pragma is used if
 * parameter is omitted.
 *
 * @param {string} source - JSX source code
 * @param {string} [factory] - Override factory name (e.g. "h", "jsx")
 * @returns {string} - Transformed JavaScript source
 */
export default function compileJSX(source, factory) {
  let i = 0;

  // -------------------------------------------------
  // Resolve the JSX factory name.
  // Priority: explicit parameter > @jsx pragma > "d"
  // -------------------------------------------------
  if (!factory) {
    factory = "d";

    const pragmaMatch = source.match(
      /^\s*\/\*\*?\s*@jsx\s+([A-Za-z_$][\w$]*)\s*\*\/\s*$/m
    );

    if (pragmaMatch) {
      factory = pragmaMatch[1];
      // Strip the pragma so it doesn't leak into output
      source = source.replace(pragmaMatch[0], "");
    }
  }

  function error(message) {
    throw new SyntaxError(`${message} at position ${i}`);
  }

  function skipWhitespace() {
    while (i < source.length && /\s/.test(source[i])) {
      i++;
    }
  }

  function readIdentifier() {
    const start = i;

    while (
      i < source.length &&
      /[A-Za-z0-9_$:.-]/.test(source[i])
    ) {
      i++;
    }

    if (start === i) {
      error("Expected identifier");
    }

    return source.slice(start, i);
  }

  function readQuotedString() {
    const quote = source[i++];

    let value = "";

    while (i < source.length) {
      const char = source[i++];

      if (char === "\\") {
        value += char;

        if (i < source.length) {
          value += source[i++];
        }

        continue;
      }

      if (char === quote) {
        return JSON.stringify(value);
      }

      value += char;
    }

    error("Unclosed string");
  }

  /**
   * Read {...}
   *
   * Contoh:
   *
   * {title}
   * {count()}
   * {{ color: "red" }}
   * {() => setCount(count() + 1)}
   */
  function readExpression() {
    if (source[i] !== "{") {
      error("Expected {");
    }

    i++;

    const start = i;
    let depth = 1;

    let quote = null;
    let template = false;

    while (i < source.length) {
      const char = source[i];

      // String
      if (quote) {
        if (char === "\\") {
          i += 2;
          continue;
        }

        if (char === quote) {
          quote = null;
        }

        i++;
        continue;
      }

      // Template literal
      if (template) {
        if (char === "\\") {
          i += 2;
          continue;
        }

        if (char === "`") {
          template = false;
          i++;
          continue;
        }

        i++;
        continue;
      }

      if (char === '"' || char === "'") {
        quote = char;
        i++;
        continue;
      }

      if (char === "`") {
        template = true;
        i++;
        continue;
      }

      if (char === "{") {
        depth++;
      }

      if (char === "}") {
        depth--;

        if (depth === 0) {
          const expression = source.slice(start, i).trim();

          i++;

          return expression;
        }
      }

      i++;
    }

    error("Unclosed expression");
  }

  function readAttributeValue() {
    skipWhitespace();

    if (source[i] === '"' || source[i] === "'") {
      return readQuotedString();
    }

    if (source[i] === "{") {
      return readExpression();
    }

    // JSX boolean attribute
    return "true";
  }

  function readAttributes() {
    const attributes = [];

    while (i < source.length) {
      skipWhitespace();

      // End of opening tag
      if (source.startsWith("/>", i)) {
        i += 2;

        return {
          attributes,
          selfClosing: true
        };
      }

      if (source[i] === ">") {
        i++;

        return {
          attributes,
          selfClosing: false
        };
      }

      // Spread:
      // {...props}
      if (source.startsWith("{...", i)) {
        const expression = readExpression();

        attributes.push({
          spread: expression.slice(3).trim()
        });

        continue;
      }

      const name = readIdentifier();

      skipWhitespace();

      let value = "true";

      if (source[i] === "=") {
        i++;
        value = readAttributeValue();
      }

      attributes.push({
        name,
        value
      });
    }

    error("Unclosed opening tag");
  }

  function buildProps(attributes) {
    if (!attributes.length) {
      return "null";
    }

    const parts = [];

    for (const attr of attributes) {
      if (attr.spread) {
        parts.push(`...(${attr.spread})`);
        continue;
      }

      parts.push(
        `${JSON.stringify(attr.name)}: ${attr.value}`
      );
    }

    return `{ ${parts.join(", ")} }`;
  }

  function normalizeText(text) {
    // JSX whitespace normalization sederhana
    return text
      .replace(/\r\n/g, "\n")
      .replace(/\n\s+/g, " ")
      .replace(/\s+\n/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function parseElement() {
    if (source[i] !== "<") {
      error("Expected <");
    }

    i++;

    // Fragment <>
    if (source[i] === ">") {
      i++;

      const children = parseChildren(null);

      return `${factory}.fragment(${children.join(", ")})`;
    }

    const tag = readIdentifier();

    const { attributes, selfClosing } =
      readAttributes();

    const props = buildProps(attributes);

    if (selfClosing) {
      return `${factory}(${JSON.stringify(tag)}, ${props})`;
    }

    const children = parseChildren(tag);

    const args = [
      JSON.stringify(tag),
      props,
      ...children
    ];

    return `${factory}(${args.join(", ")})`;
  }

  function parseChildren(parentTag) {
    const children = [];

    while (i < source.length) {
      // Closing tag
      if (source.startsWith("</", i)) {
        i += 2;

        // Fragment closing tag: </>
        if (source[i] === ">") {
          i++;
          return children;
        }

        const closingTag = readIdentifier();

        skipWhitespace();

        if (source[i] !== ">") {
          error("Expected >");
        }

        i++;

        if (
          parentTag &&
          closingTag !== parentTag
        ) {
          error(
            `Expected </${parentTag}> but found </${closingTag}>`
          );
        }

        return children;
      }

      // Nested JSX
      if (source[i] === "<") {
        children.push(parseElement());
        continue;
      }

      // Expression
      if (source[i] === "{") {
        const expression = readExpression();

        if (expression.trim()) {
          children.push(expression);
        }

        continue;
      }

      // Text
      const start = i;

      while (
        i < source.length &&
        source[i] !== "<" &&
        source[i] !== "{"
      ) {
        i++;
      }

      const text = normalizeText(
        source.slice(start, i)
      );

      if (text) {
        children.push(JSON.stringify(text));
      }
    }

    if (parentTag) {
      error(`Missing </${parentTag}>`);
    }

    return children;
  }

  /**
   * Find JSX inside normal JavaScript.
   *
   * Contoh:
   *
   * return (
   *   <div>Hello</div>
   * );
   */
  function transformJS() {
    let output = "";
    let cursor = 0;

    while (cursor < source.length) {
      const char = source[cursor];

      // Skip strings
      if (
        char === '"' ||
        char === "'" ||
        char === "`"
      ) {
        const quote = char;
        let end = cursor + 1;

        while (end < source.length) {
          if (source[end] === "\\") {
            end += 2;
            continue;
          }

          if (source[end] === quote) {
            end++;
            break;
          }

          end++;
        }

        output += source.slice(cursor, end);
        cursor = end;
        continue;
      }

      // Potential JSX
      if (
        char === "<" &&
        (
          /[A-Za-z]/.test(source[cursor + 1]) ||
          source[cursor + 1] === ">"
        )
      ) {
        i = cursor;

        const jsx = parseElement();

        output += jsx;

        cursor = i;
        continue;
      }

      output += char;
      cursor++;
    }

    return output;
  }

  return transformJS();
}
