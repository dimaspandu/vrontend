export const isNodeLike = (value) =>
  typeof Node !== "undefined" &&
  value instanceof Node;