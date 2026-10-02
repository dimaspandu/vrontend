import { wrapSetterForState }
from "../runtime/wrappers.js";

export function installReactiveWrappers() {

  [
    "setText",
    "setChildren",
    "setStyles",
    "setAttributes",
    "setEvents",
    "setEnhancement"
  ].forEach(
    wrapSetterForState
  );
}