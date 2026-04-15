export function PageSection({ title, subtitle, children, action }) {
  return (
    <section className="page-section">
      <header className="page-section-head">
        <div>
          <h2>{title}</h2>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
        {action ? <div>{action}</div> : null}
      </header>
      <div>{children}</div>
    </section>
  );
}
