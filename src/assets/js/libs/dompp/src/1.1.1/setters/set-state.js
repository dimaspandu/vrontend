import { ensureState }
from "../runtime/state.js";

import { scheduleFlush }
from "../runtime/state.js";

import { createDomppContext }
from "../context/create-dompp-context.js";

export function setState(next) {

  ensureState(this);

  if (
    typeof next === "function"
  ) {

    next({

      state:
        this.__dompp_state,

      setState: (n) => {
        return this.setState(n);
      },

      ...createDomppContext(this)
    });

  } else {

    Object.assign(
      this.__dompp_state,
      next
    );
  }

  scheduleFlush(this);

  return this;
}