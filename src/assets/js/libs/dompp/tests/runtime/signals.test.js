import test
from "node:test";

import assert
from "node:assert/strict";

import {
  createSignal,
  createSignalEffect
}
from "../../src/1.1.1/runtime/signals.js";

// =====================================
// createSignal
// =====================================

test(
  "createSignal returns initial value",
  () => {

    const [
      count
    ] =
      createSignal(0);

    assert.equal(
      count(),
      0
    );
  }
);

// =====================================
// signal setter
// =====================================

test(
  "signal setter updates value",
  () => {

    const [
      count,
      setCount
    ] =
      createSignal(0);

    setCount(5);

    assert.equal(
      count(),
      5
    );
  }
);

// =====================================
// effects rerun
// =====================================

test(
  "signal effects rerun",
  () => {

    const [
      count,
      setCount
    ] =
      createSignal(0);

    let runs = 0;

    createSignalEffect(
      () => {

        count();

        runs += 1;
      }
    );

    setCount(1);

    assert.equal(
      runs,
      2
    );
  }
);