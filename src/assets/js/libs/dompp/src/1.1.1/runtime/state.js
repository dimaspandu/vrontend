export function ensureState(el) {

  if (!el.__dompp_state) {

    el.__dompp_state = {};

    el.__dompp_bindings =
      new Set();

    el.__dompp_flushScheduled =
      false;
  }
}

export function flushBindings(el) {

  el.__dompp_flushScheduled =
    false;

  if (!el.__dompp_bindings) {
    return;
  }

  const runners = Array.from(
    el.__dompp_bindings
  );

  for (const run of runners) {
    run();
  }
}

export function scheduleFlush(el) {

  if (el.__dompp_flushScheduled) {
    return;
  }

  el.__dompp_flushScheduled =
    true;

  queueMicrotask(() => {
    flushBindings(el);
  });
}