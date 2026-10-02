import test
from "node:test";

import assert
from "node:assert/strict";

import {
  ensureState
}
from "../../src/1.1.1/runtime/state.js";

// =====================================
// ensureState
// =====================================

test(
  "ensureState initializes state container",
  () => {

    const el = {};

    ensureState(el);

    assert.deepEqual(
      el.__dompp_state,
      {}
    );

    assert.ok(
      el.__dompp_bindings
        instanceof Set
    );
  }
);