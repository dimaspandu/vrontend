import { createDomppSetterContext }
from "../context/create-dompp-setter-context.js";

export function setStyles(
  styles = {}
) {

  const nextStyles =
    typeof styles === "function"
      ? styles(
          createDomppSetterContext(
            this,
            "setStyles"
          )
        )
      : styles;

  Object.assign(
    this.style,
    nextStyles ?? {}
  );

  return this;
}