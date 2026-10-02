export default function taskHandler(app) {
  return {
    onMeet: async (ctx) => {
      const { default: view } = await import("./view.jsx");
      app.setChildren(view(ctx));
    }
  };
}