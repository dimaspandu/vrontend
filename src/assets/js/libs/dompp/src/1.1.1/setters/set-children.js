import { toNodeList }
from "../utils/to-node-list.js";

import { createDomppSetterContext }
from "../context/create-dompp-setter-context.js";

export function setChildren(
  ...children
) {

  let nextChildren = children;

  if (
    children.length === 1 &&
    typeof children[0] ===
      "function"
  ) {

    const resolved =
      children[0](
        createDomppSetterContext(
          this,
          "setChildren"
        )
      );

    nextChildren =
      Array.isArray(resolved)
        ? resolved
        : [resolved];
  }

  this.replaceChildren(
    ...toNodeList(nextChildren)
  );

  return this;
}