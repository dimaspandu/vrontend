/**
 * A tiny in-memory store. No framework, no subscriptions: views re-read it
 * through dompp bindings, so the store only has to expose plain data.
 */

const seed = [
  { id: 1, title: "Read the vrontend README", done: true },
  { id: 2, title: "Add a route and a view", done: false },
  { id: 3, title: "Run the production build", done: false }
];

let tasks = seed.map((task) => ({ ...task }));

export function list() {
  return tasks.map((task) => ({ ...task }));
}

export function find(id) {
  const task = tasks.find((item) => item.id === Number(id));
  return task ? { ...task } : null;
}

export function add(title) {
  const clean = String(title).trim();

  if (!clean) {
    return null;
  }

  const task = { id: nextId(), title: clean, done: false };

  tasks = [...tasks, task];

  return { ...task };
}

export function toggle(id) {
  tasks = tasks.map((task) =>
    task.id === Number(id) ? { ...task, done: !task.done } : task
  );

  return find(id);
}

export function remove(id) {
  tasks = tasks.filter((task) => task.id !== Number(id));
}

function nextId() {
  return tasks.reduce((max, task) => Math.max(max, task.id), 0) + 1;
}