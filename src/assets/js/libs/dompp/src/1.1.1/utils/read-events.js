export const readEvents = (node) => ({
  ...(node.__dompp_handlers ?? {})
});