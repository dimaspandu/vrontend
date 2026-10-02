export default function appendStyleSheet(sheet, target = document.head) {
  const style = document.createElement("style");

  if (typeof sheet === "string") {
    // Raw CSS string case
    style.textContent = sheet;
  } else if (sheet instanceof CSSStyleSheet) {
    // CSSStyleSheet case
    style.textContent = Array.from(sheet.cssRules)
      .map(rule => rule.cssText)
      .join("\n");
  } else {
    throw new TypeError("Argument must be a CSSStyleSheet or a string");
  }

  target.appendChild(style);

  return style;
}
