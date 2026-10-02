import { createDomppContext }
from "./create-dompp-context.js";

import { readInlineStyles }
from "../utils/read-inline-styles.js";

import { readAttributes }
from "../utils/read-attributes.js";

import { readEvents }
from "../utils/read-events.js";

export function createDomppSetterContext(
  node,
  setterName
) {

  const dom =
    createDomppContext(node);

  if (setterName === "setText") {

    return {
      ...dom,
      text:
        node.textContent ?? ""
    };
  }

  if (setterName === "setStyles") {

    return {
      ...dom,
      styles:
        readInlineStyles(node)
    };
  }

  if (
    setterName === "setAttributes"
  ) {

    return {
      ...dom,
      attributes:
        readAttributes(node)
    };
  }

  if (setterName === "setEvents") {

    return {
      ...dom,
      events:
        readEvents(node)
    };
  }

  if (setterName === "setState") {

    return {
      ...dom,
      state:
        node.__dompp_state ?? {}
    };
  }

  return dom;
}