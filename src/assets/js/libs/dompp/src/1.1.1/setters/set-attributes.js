import { createDomppSetterContext }
from "../context/create-dompp-setter-context.js";

export function setAttributes(
  attrs = {}
) {

  const nextAttrs =
    typeof attrs === "function"
      ? attrs(
          createDomppSetterContext(
            this,
            "setAttributes"
          )
        )
      : attrs;

  for (const k in (
    nextAttrs ?? {}
  )) {

    const v = nextAttrs[k];

    if (
      v === false ||
      v == null
    ) {

      this.removeAttribute(k);

    } else {

      this.setAttribute(
        k,
        v === true
          ? ""
          : v
      );
    }
  }

  return this;
}