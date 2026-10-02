/**
 * Dynamic bundle A.
 *
 * This module imports the shared dependency from the entry bundle context
 * and re-exports its result.
 *
 * Purpose:
 * - Verify that shared modules can be duplicated into dynamic bundles
 *   without breaking the entry bundle.
 * - Verify that the runtime execution cache prevents re-execution
 *   even when the module is registered by multiple bundles.
 */

import sharedMessage from "../shared/message.js";

export default function () {
  return sharedMessage();
}
