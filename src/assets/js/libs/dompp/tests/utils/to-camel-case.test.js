import test
from "node:test";

import assert
from "node:assert/strict";

import { toCamelCase }
from "../../src/1.1.1/utils/to-camel-case.js";

test(
  "converts kebab-case to camelCase",
  () => {

    assert.equal(
      toCamelCase(
        "background-color"
      ),
      "backgroundColor"
    );
  }
);