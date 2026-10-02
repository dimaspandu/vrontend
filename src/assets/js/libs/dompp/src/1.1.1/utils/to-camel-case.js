export const toCamelCase = (cssProp) =>
  cssProp.replace(
    /-([a-z])/g,
    (_, ch) => ch.toUpperCase()
  );