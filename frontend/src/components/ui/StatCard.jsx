export function StatCard({ label, value, helper, tone = "neutral" }) {
  const toneClass = tone === "positive" ? "stat-card-positive" : tone === "negative" ? "stat-card-negative" : "";

  return (
    <article className={`stat-card ${toneClass}`.trim()}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{helper}</small>
    </article>
  );
}
