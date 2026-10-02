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

/**
 * Tag yang hanya valid di namespace SVG, jadi aman dibuat via createElementNS.
 * Tag yang ambigu (a, script, style, title, desc, metadata) sengaja TIDAK
 * ada di sini karena bisa dipakai di HTML dan akan rusak bila dipaksa
 * menjadi elemen SVG.
 */
const svgOnlyTags = new Set([
  "svg",
  "circle", "path", "rect",
  "line", "polyline", "polygon", "ellipse",
  "g", "defs", "use", "symbol",
  "text", "tspan", "textPath",
  "image", "foreignObject",
  "mask", "clipPath", "pattern",
  "linearGradient", "radialGradient", "stop",
  "filter", "feGaussianBlur", "feColorMatrix",
  "animate", "animateTransform", "animateMotion",
  "marker", "view", "switch"
]);

export default function elementBuilder(tag, props, ...children) {
  let node;
  if (tag === "fragment" || tag === "Fragment") {
    node = document.createDocumentFragment();
  } else if (svgOnlyTags.has(tag)) {
    node = document.createElementNS(SVG_NS, tag);
  } else {
    node = document.createElement(tag);
  }

  if (props) {
    const { style, className, class: classAttr, on, ...attrs } = props;

    if (className || classAttr) {
      node.setAttributes({ class: className || classAttr });
    }

    if (style) {
      node.setStyles(style);
    }

    if (on) {
      node.setEvents(on);
    }

    if (Object.keys(attrs).length) {
      node.setAttributes(attrs);
    }
  }

  if (children.length) {
    node.setChildren(...children.flat());
  }

  return node;
}

/**
 * Dipanggil oleh transpiler untuk `<>...</>` -> `factory.fragment(...)`.
 */
elementBuilder.fragment = function fragment(...children) {
  const node = document.createDocumentFragment();

  if (children.length) {
    node.setChildren(...children.flat());
  }

  return node;
};