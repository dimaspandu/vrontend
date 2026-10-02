export default function tasksHandler(app) {
  return {
    onMeet: async () => {
      const { default: view } = await import("./view.jsx");
      app.setChildren(view());
    }
  };
}