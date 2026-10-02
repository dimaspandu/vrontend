/**
 * Shared dependency used by both entry and dynamic bundles.
 *
 * This module is intentionally:
 * - Side-effect free
 * - Stateless
 * - Synchronously executed
 *
 * Purpose:
 * - Verify that a module imported by the entry bundle
 *   remains available when also duplicated into dynamic bundles.
 * - Ensure runtime execution caching prevents re-execution issues
 *   even when the same module is registered multiple times.
 */
export default function sharedMessage() {
  return "Shared dependency is alive";
}
