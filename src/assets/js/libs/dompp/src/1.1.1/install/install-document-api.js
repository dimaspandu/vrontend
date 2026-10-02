import { defineOn }
from "../core/define-on.js";

import { createSignal }
from "../runtime/signals.js";

export function installDocumentApi() {

  defineOn(
    Document.prototype,
    "createSignal",
    function (initial) {

      return createSignal(
        initial
      );
    }
  );
}