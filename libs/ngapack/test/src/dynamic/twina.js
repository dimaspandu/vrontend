import twins, { SOURCE_OF_TRUTH } from "./twins.js";

export function twina() {
  SOURCE_OF_TRUTH.phase++;
  return twins(`A(${SOURCE_OF_TRUTH.phase})`);
}