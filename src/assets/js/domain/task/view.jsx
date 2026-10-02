import elementBuilder from "../../factories/elementBuilder.js";
import { find, toggle, remove } from "../../store/tasks.js";

export default function view(ctx) {
  const id = ctx.params.id;

  if (!find(id)) {
    return (
      <section class="panel panel--center">
        <h1 class="notfound__title">Task not found</h1>
        <p class="notfound__text">No task with id <code>{id}</code> exists.</p>
        <a class="button" href="/">Back to Tasks</a>
      </section>
    );
  }

  const body = <div class="detail__body" />;
  const refresh = () => body.setState({ task: find(id) });

  // `refresh` is passed in because renderTask lives in module scope,
  // not inside view().
  body
    .setState({ task: find(id) })
    .setChildren(({ state }) => renderTask(state.task, refresh));

  return (
    <section class="panel">
      <p class="detail__meta">
        Task #{id} &middot; <a href="/">Back to all tasks</a>
      </p>

      {body}
    </section>
  );
}

function renderTask(task, refresh) {
  return (
    <>
      <h2
        class={
          "detail__title" + (task.done ? " detail__title--done" : "")
        }
      >
        {task.title}
      </h2>

      <p class="panel__subtitle">
        {task.done ? "Completed" : "Not completed yet"}
      </p>

      <div class="detail__row">
        <button
          class="button button--ghost"
          type="button"
          on={{
            click() {
              toggle(task.id);
              refresh();
            }
          }}
        >
          {task.done ? "Mark as not done" : "Mark as done"}
        </button>

        <button
          class="button button--danger"
          type="button"
          on={{
            click() {
              remove(task.id);
              history.navigatePush("/");
            }
          }}
        >
          Delete
        </button>
      </div>
    </>
  );
}