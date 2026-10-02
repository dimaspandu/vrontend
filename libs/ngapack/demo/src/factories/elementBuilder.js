/**
 * elementBuilder.js — Custom JSX factory.
 *
 * Demonstrates that ngapack can use any factory name, not just "d".
 *
 * The transpiler calls the factory in two ways:
 *   elementBuilder(tag, props, ...children)
 *   elementBuilder.fragment(...children)   // for <></>
 */

const SVG_NS = "http://www.w3.org/2000/svg";

const SVG_TAGS = new Set([
  "a", "animate", "animateMotion", "animateTransform", "circle", "clipPath",
  "defs", "desc", "ellipse", "feBlend", "feColorMatrix", "feComposite",
  "feFlood", "feGaussianBlur", "feImage", "feMerge", "feOffset", "filter",
  "foreignObject", "g", "image", "line", "linearGradient", "marker", "mask",
  "metadata", "mpath", "path", "pattern", "polygon", "polyline",
  "radialGradient", "rect", "stop", "svg", "symbol", "text", "textPath",
  "tspan", "use", "view"
]);

const SVG_CAMEL_ATTRIBUTES = new Set([
  "viewBox", "preserveAspectRatio", "gradientUnits", "gradientTransform",
  "spreadMethod", "patternUnits", "patternContentUnits", "patternTransform",
  "clipPathUnits", "maskUnits", "maskContentUnits", "markerWidth",
  "markerHeight", "refX", "refY", "textLength", "lengthAdjust", "startOffset",
  "baseProfile", "attributeName", "repeatCount", "keyTimes"
]);

function isSvgTag(tag) {
  return SVG_TAGS.has(tag);
}

function toKebabCase(name) {
  return name.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`);
}

function toStyleText(style) {
  return Object.entries(style)
    .filter(([, value]) => value != null && value !== false)
    .map(([name, value]) => `${toKebabCase(name)}: ${value}`)
    .join("; ");
}

function appendChildren(node, children) {
  for (const child of children.flat(Infinity)) {
    if (child == null || typeof child === "boolean") {
      continue;
    }

    node.append(
      child instanceof Node
        ? child
        : document.createTextNode(String(child))
    );
  }

  return node;
}

function elementBuilder(tag, props, ...children) {
  const isSvg = isSvgTag(tag);

  const node = tag === "fragment"
    ? document.createDocumentFragment()
    : isSvg
      ? document.createElementNS(SVG_NS, tag)
      : document.createElement(tag);

  if (props) {
    const {
      style,
      className,
      class: classAttr,
      on,
      ...attrs
    } = props;

    const classValue = className ?? classAttr;

    if (classValue) {
      if (isSvg) {
        node.setAttribute("class", classValue);
      } else {
        node.className = classValue;
      }
    }

    if (style) {
      if (isSvg) {
        node.setAttribute("style", toStyleText(style));
      } else {
        Object.assign(node.style, style);
      }
    }

    if (on) {
      for (const [event, handler] of Object.entries(on)) {
        node.addEventListener(event, handler);
      }
    }

    for (const [name, value] of Object.entries(attrs)) {
      if (value == null || value === false) {
        continue;
      }

      // SVG attributes are case sensitive and are set as attributes,
      // not as DOM properties.
      if (isSvg) {
        const attribute = SVG_CAMEL_ATTRIBUTES.has(name)
          ? name
          : toKebabCase(name);

        node.setAttribute(attribute, value === true ? "" : value);
        continue;
      }

      if (name === "htmlFor") {
        node.htmlFor = value;
      } else if (name in node && !name.startsWith("aria-") && !name.startsWith("data-")) {
        node[name] = value;
      } else {
        node.setAttribute(name, value === true ? "" : value);
      }
    }
  }

  return appendChildren(node, children);
}

elementBuilder.fragment = (...children) =>
  appendChildren(document.createDocumentFragment(), children);

export default elementBuilder;
