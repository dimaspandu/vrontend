import { createDomppContext }
from "../context/create-dompp-context.js";

export function setEnhancement(
  callback
) {

  if (
    typeof callback ===
    "function"
  ) {

    callback({

      state:
        this.__dompp_state ?? {},

      setState: (next) =>
        this.setState(next),

      ...createDomppContext(this)
    });
  }

  return this;
}