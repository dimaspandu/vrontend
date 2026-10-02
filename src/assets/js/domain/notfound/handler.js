export default function notFoundHandler(app) {
  return async (ctx) => {
    const { default: view } = await import("./view.jsx");
    app.setChildren(view(ctx));
  };
}