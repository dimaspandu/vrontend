import elementBuilder from "../../factories/elementBuilder.js";

function Counter(props) {
  const initial = (props && props.initial) || 0;
  let count = initial;

  const display = <span class="counter__value">{count}</span>;

  return (
    <div class="counter">
      {display}
      <button
        class="counter__dec"
        type="button"
        on={{
          click() {
            count--;
            display.setText(count);
          }
        }}
      >
        −
      </button>
      <button
        class="counter__inc"
        type="button"
        on={{
          click() {
            count++;
            display.setText(count);
          }
        }}
      >
        +
      </button>
    </div>
  );
}

export default function view() {
  return (
    <section class="panel">
      <h1 class="panel__title">Counter</h1>
      <p class="panel__subtitle">Uppercase component example</p>
      <Counter initial={0} />
    </section>
  );
}
