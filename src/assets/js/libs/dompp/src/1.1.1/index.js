import { installDOMPP }
from "./install/install-dompp.js";

// Node.js / unit tests

export const createDOMPP =
  () => installDOMPP();

// Browser globals

if (
  typeof window !==
  "undefined"
) {

  const dompp =
    installDOMPP();

  window.DOMPP =
    dompp;
}