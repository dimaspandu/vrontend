import { defineOn }
from "../core/define-on.js";

import { setText }
from "../setters/set-text.js";

import { setChildren }
from "../setters/set-children.js";

export function installFragment() {

  defineOn(
    DocumentFragment.prototype,
    "setText",
    setText
  );

  defineOn(
    DocumentFragment.prototype,
    "setChildren",
    setChildren
  );
}