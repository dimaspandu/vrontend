import { defineOn }
from "../core/define-on.js";

import { setText }
from "../setters/set-text.js";

import { setChildren }
from "../setters/set-children.js";

import { setStyles }
from "../setters/set-styles.js";

import { setAttributes }
from "../setters/set-attributes.js";

import { setEvents }
from "../setters/set-events.js";

import { setState }
from "../setters/set-state.js";

import { setEnhancement }
from "../setters/set-enhancement.js";

import { setFineGrained }
from "../setters/set-fine-grained.js";

export function installSetters() {

  defineOn(
    Element.prototype,
    "setText",
    setText
  );

  defineOn(
    Element.prototype,
    "setChildren",
    setChildren
  );

  defineOn(
    Element.prototype,
    "setStyles",
    setStyles
  );

  defineOn(
    Element.prototype,
    "setAttributes",
    setAttributes
  );

  defineOn(
    Element.prototype,
    "setEvents",
    setEvents
  );

  defineOn(
    Element.prototype,
    "setState",
    setState
  );

  defineOn(
    Element.prototype,
    "setEnhancement",
    setEnhancement
  );

  defineOn(
    Element.prototype,
    "setFineGrained",
    setFineGrained
  );
}