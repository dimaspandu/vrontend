import elementBuilder from "../../factories/elementBuilder.js";
import { list, add, toggle, remove } from "../../store/tasks.js";

export default function view() {
  const input = (
    <input
      class="task-form__input"
      type="text"
      name="title"
      placeholder="What needs to be done?"
      aria-label="New task"
    />
  );

  // dompp stateful mode: the setChildren callback re-runs on every setState,
  // so changing the store only requires a refresh.
  const taskList = <ul class="task-list" />;
  taskList
    .setState({ tasks: list() })
    .setChildren(({ state }) => renderItems(state.tasks));

  const refresh = () => taskList.setState({ tasks: list() });

  const form = (
    <form
      class="task-form"
      on={{
        submit(event) {
          event.preventDefault();

          if (!add(input.value)) {
            return;
          }

          input.value = "";
          refresh();
        }
      }}
    >
      {input}
      <button class="button" type="submit">Add</button>
    </form>
  );

  return (
    <section class="panel">
      <h1 class="panel__title">Tasks</h1>
      <p class="panel__subtitle">
        JSX views, dompp reactivity, historypp routing, no dependencies.
      </p>

      {form}
      {taskList}
    </section>
  );
}

function renderItems(tasks) {
  if (!tasks.length) {
    return <li class="empty">Nothing here yet. Add your first task above.</li>;
  }

  return tasks.map((task) => (
    <li class="task-item">
      <button
        class={
          "task-item__toggle" +
          (task.done ? " task-item__toggle--done" : "")
        }
        type="button"
        aria-label={task.done ? "Mark as not done" : "Mark as done"}
        on={{
          click() {
            toggle(task.id);
            refresh();
          }
        }}
      />

      <a
        class={
          "task-item__link" +
          (task.done ? " task-item__title--done" : "")
        }
        href={`/task/${task.id}`}
      >
        {task.title}
      </a>

      <button
        class="task-item__remove"
        type="button"
        on={{
          click() {
            remove(task.id);
            refresh();
          }
        }}
      >
        Remove
      </button>
    </li>
  ));
}