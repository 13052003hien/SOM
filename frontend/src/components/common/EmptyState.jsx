export function EmptyState({ title, description, hint }) {
  return (
    <div className="empty-state" role="status" aria-live="polite">
      <div className="empty-state-icon" aria-hidden="true">◌</div>
      <h3>{title}</h3>
      <p>{description}</p>
      {hint ? <small>{hint}</small> : null}
    </div>
  );
}
