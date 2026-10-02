import { createDomppSetterContext }
from "../context/create-dompp-setter-context.js";

export function setEvents(
  events = {}
) {

  const nextEvents =
    typeof events === "function"
      ? events(
          createDomppSetterContext(
            this,
            "setEvents"
          )
        )
      : events;

  this.__dompp_handlers ??= {};

  for (const e in (
    nextEvents ?? {}
  )) {

    if (
      this.__dompp_handlers[e]
    ) {

      this.removeEventListener(
        e,
        this.__dompp_handlers[e]
      );
    }

    this.addEventListener(
      e,
      nextEvents[e]
    );

    this.__dompp_handlers[e] =
      nextEvents[e];
  }

  return this;
}