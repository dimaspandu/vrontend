import elementBuilder from "../factories/elementBuilder.js";

export default function Card({ title, body }) {
  return (
      <div className="card">
        <h2>{title}</h2>
        <p>{body}</p>
        <>
          <span className="badge">fragment</span>
          <span className="badge">child</span>
        </>
        <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
          <path d="M4 12l5 5 11-11" fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>
      </div>
  );
}