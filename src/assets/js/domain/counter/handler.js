export default function counterHandler(app) {
  return {
    onMeet: async (ctx) => {
      const { default: stylesheet } = await import(
        "../../../css/counter.module.css",
        { with: { type: "css" } }
      );

      if (stylesheet instanceof CSSStyleSheet) {
        document.adoptedStyleSheets = [
          ...document.adoptedStyleSheets,
          stylesheet
        ];
      }

      const { default: view } = await import("./view.jsx");
      app.setChildren(view(ctx));
    }
  };
}
