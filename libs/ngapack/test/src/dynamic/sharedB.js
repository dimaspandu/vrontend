/**
 * Dynamic bundle B.
 *
 * This module imports the same shared dependency as `sharedA.js`.
 * It exists to confirm that multiple separated bundles can safely
 * depend on the same shared module.
 */

import sharedMessage from "../shared/message.js";

export default function () {
  return sharedMessage();
}
