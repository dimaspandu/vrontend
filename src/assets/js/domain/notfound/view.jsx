import elementBuilder from "../../factories/elementBuilder.js";

export default function view(ctx) {
  return (
    <section class="panel panel--center">
      <p class="notfound__code">404</p>
      <h1 class="notfound__title">Page Not Found</h1>
      <p class="notfound__text">
        No route matches <code>{ctx.path}</code>.
      </p>

      <a class="button" href="/">Back to Tasks</a>
    </section>
  );
}
