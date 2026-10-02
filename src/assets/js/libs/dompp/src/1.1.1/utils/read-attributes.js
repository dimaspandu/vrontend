export function readAttributes(node) {

  const attributes = {};

  for (
    const attr of Array.from(
      node.attributes ?? []
    )
  ) {

    attributes[attr.name] =
      attr.value;
  }

  return attributes;
}