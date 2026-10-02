export function defineOn(
  proto,
  name,
  fn
) {

  if (!proto[name]) {

    Object.defineProperty(
      proto,
      name,
      {
        value: fn,
        writable: false,
        configurable: true
      }
    );
  }
}