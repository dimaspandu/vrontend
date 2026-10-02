export function createDomppContext(node) {

  return {

    el: node,

    children: Array.from(
      node.children ?? []
    ),

    childNodes: Array.from(
      node.childNodes ?? []
    ),

    firstChild:
      node.firstChild ?? null,

    lastChild:
      node.lastChild ?? null
  };
}