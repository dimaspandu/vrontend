/**
 * Canonical CSS property order.
 *
 * This order defines a semantic contract for CSS comparison.
 * All CSS extracted from CSSStyleSheet instances must be
 * normalized and emitted following this order.
 *
 * This ensures deterministic output across browsers and runtimes.
 */
const CANONICAL_PROPERTY_ORDER = [
  "--accent",
  "font-family",
  "color",
  "font-weight",
  "background",
  "padding"
];

/**
 * Convert a CSSStyleSheet into a canonical semantic object.
 *
 * Purpose:
 * - Remove CSSOM-expanded noise (e.g. background-* longhands)
 * - Normalize shorthand properties
 * - Emit only semantically relevant properties
 * - Preserve a stable property order for test comparison
 *
 * @param {CSSStyleSheet} sheet
 * @returns {Record<string, Record<string, string>>}
 */
export default function sheetToCanonicalObject(sheet) {
  const result = {};

  for (const rule of sheet.cssRules) {
    if (!rule.selectorText) continue;

    const style = rule.style;
    const collected = {};

    /**
     * Collect custom CSS properties.
     */
    for (const prop of style) {
      if (prop.startsWith("--")) {
        collected[prop] = style.getPropertyValue(prop).trim();
      }
    }

    /**
     * Collect semantic typography and color properties.
     */
    if (style.fontFamily) {
      collected["font-family"] = style.fontFamily;
    }

    if (style.color) {
      collected["color"] = style.color;
    }

    if (style.fontWeight) {
      collected["font-weight"] = style.fontWeight;
    }

    /**
     * Canonical background shorthand.
     *
     * CSSOM expands background into multiple longhands,
     * but semantically only background color is relevant here.
     */
    if (style.backgroundColor) {
      collected["background"] = style.backgroundColor;
    }

    /**
     * Canonical padding shorthand.
     *
     * Emit padding only if all sides are equal to avoid
     * ambiguous or partial shorthand representations.
     */
    if (
      style.paddingTop &&
      style.paddingTop === style.paddingRight &&
      style.paddingTop === style.paddingBottom &&
      style.paddingTop === style.paddingLeft
    ) {
      collected["padding"] = style.paddingTop;
    }

    /**
     * Emit properties in canonical order.
     */
    const out = {};
    for (const key of CANONICAL_PROPERTY_ORDER) {
      if (key in collected) {
        out[key] = collected[key];
      }
    }

    if (Object.keys(out).length > 0) {
      result[rule.selectorText] = out;
    }
  }

  return result;
}