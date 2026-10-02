import { isNodeLike }
from "./is-node-like.js";

export function toNodeList(values) {

  const out = [];

  const pushOne = (value) => {

    if (
      value == null ||
      value === false
    ) {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach(pushOne);
      return;
    }

    if (isNodeLike(value)) {
      out.push(value);
      return;
    }

    out.push(
      document.createTextNode(
        String(value)
      )
    );
  };

  values.forEach(pushOne);

  return out;
}