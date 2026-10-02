import twins, { SOURCE_OF_TRUTH } from "./twins.js";

export function twinb() {
  SOURCE_OF_TRUTH.phase++;
  return twins(`B(${SOURCE_OF_TRUTH.phase})`);
}