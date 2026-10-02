import { ensureState }
from "./state.js";

import { createSignalEffect }
from "./signals.js";

import { createDomppContext }
from "../context/create-dompp-context.js";

import { createDomppSetterContext }
from "../context/create-dompp-setter-context.js";

export function wrapSetterForState(
  name
) {

  const original =
    Element.prototype[name];

  if (
    !original ||
    original.__dompp_wrapped
  ) {
    return;
  }

  function wrapped(...args) {

    const first = args[0];

    // Fine-grained signals

    if (
      this.__dompp_finegrained &&
      typeof first === "function"
    ) {

      createSignalEffect(() => {

        const context = {

          ...createDomppContext(
            this
          ),

          ...createDomppSetterContext(
            this,
            name
          )
        };

        const nextResult =
          first(context);

        if (
          name === "setChildren"
        ) {

          const children =
            Array.isArray(nextResult)
              ? nextResult
              : [nextResult];

          original.call(
            this,
            ...children
          );

          return;
        }

        original.call(
          this,
          nextResult
        );
      });

      return this;
    }

    // Direct mutation

    if (
      typeof first !== "function"
    ) {

      return original.apply(
        this,
        args
      );
    }

    // Stateful runtime

    ensureState(this);

    let previousResult;

    const runner = () => {

      const context = {

        state:
          this.__dompp_state,

        setState: (n) =>
          this.setState(n),

        ...createDomppContext(this),

        ...createDomppSetterContext(
          this,
          name
        )
      };

      const nextResult =
        first(context);

      if (
        Object.is(
          previousResult,
          nextResult
        )
      ) {
        return;
      }

      previousResult =
        nextResult;

      if (
        name === "setChildren"
      ) {

        const children =
          Array.isArray(
            nextResult
          )
            ? nextResult
            : [nextResult];

        original.call(
          this,
          ...children
        );

        return;
      }

      original.call(
        this,
        nextResult
      );
    };

    this.__dompp_bindings.add(
      runner
    );

    runner();

    return this;
  }

  wrapped.__dompp_wrapped =
    true;

  Object.defineProperty(
    Element.prototype,
    name,
    {
      value: wrapped,
      writable: false,
      configurable: true
    }
  );
}