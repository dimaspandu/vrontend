let currentSignalEffect = null;

export function createSignal(initial) {

  let value = initial;

  const subscribers =
    new Set();

  function getter() {

    if (currentSignalEffect) {

      subscribers.add(
        currentSignalEffect
      );
    }

    return value;
  }

  function setter(next) {

    value = next;

    const effects =
      Array.from(subscribers);

    for (const effect of effects) {
      effect();
    }
  }

  return [
    getter,
    setter
  ];
}

export function createSignalEffect(fn) {

  const wrapped = () => {

    currentSignalEffect =
      wrapped;

    fn();

    currentSignalEffect =
      null;
  };

  wrapped();

  return wrapped;
}