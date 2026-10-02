import { createDomppSetterContext }
from "../context/create-dompp-setter-context.js";

export function setText(text) {

  const nextText =
    typeof text === "function"
      ? text(
          createDomppSetterContext(
            this,
            "setText"
          )
        )
      : text;

  this.textContent = nextText;

  return this;
}