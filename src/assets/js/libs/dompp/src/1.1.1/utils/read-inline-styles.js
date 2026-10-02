import { toCamelCase }
from "./to-camel-case.js";

export function readInlineStyles(node) {

  const styles = {};
  const styleDecl = node.style;

  for (
    let i = 0;
    i < styleDecl.length;
    i += 1
  ) {

    const prop = styleDecl[i];

    styles[toCamelCase(prop)] =
      styleDecl.getPropertyValue(prop);
  }

  return styles;
}