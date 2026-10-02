import greetings from "../greetings.js";
import hail from "./hail.js";

export function getMessage() {
  return greetings + " " + hail[2];
}
