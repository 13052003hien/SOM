import { formatVND } from "../../utils/formatters";

const PIE_COLORS = ["#f97316", "#06b6d4", "#f43f5e", "#22c55e", "#eab308", "#a855f7"];

function toNumber(value) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toPercent(value, total) {
  if (!total) return 0;
  return Math.max(0, Math.min(100, (value / total) * 100));
}

function buildDonutBackground(items) {
  if (!items.length) {
    return "conic-gradient(#1f2937 0turn 1turn)";
  }

  let acc = 0;
  const slices = items.map((item) => {
    const start = acc;
    const end = acc + item.percentage;
    acc = end;
    return `${item.color} ${start}% ${Math.min(100, end)}%`;
  });

  return `conic-gradient(${slices.join(", ")})`;
}

export function ReportCharts({ monthly, category }) {
  const totalIncome = toNumber(monthly?.totalIncome);
  const totalExpense = toNumber(monthly?.totalExpense);
  const totalFlow = totalIncome + totalExpense;
  const monthlyNet = toNumber(monthly?.net);

  const compareBars = [
    {
      label: "Thu nhập",
      value: totalIncome,
      percent: toPercent(totalIncome, totalFlow),
      className: "income"
    },
    {
      label: "Chi tiêu",
      value: totalExpense,
      percent: toPercent(totalExpense, totalFlow),
      className: "expense"
    }
  ];

  const pieSource = Array.isArray(monthly?.charts?.pie) && monthly.charts.pie.length
    ? monthly.charts.pie
    : Array.isArray(category?.breakdown)
      ? category.breakdown
      : [];

  const pieItems = pieSource
    .slice(0, 6)
    .map((item, index) => ({
      label: item.label || item.category_name || `Mục ${index + 1}`,
      value: toNumber(item.value ?? item.total),
      percentage: toNumber(item.percentage),
      color: PIE_COLORS[index % PIE_COLORS.length]
    }))
    .filter((item) => item.value > 0);

  const pieTotal = pieItems.reduce((sum, item) => sum + item.value, 0);
  const normalizedPie = pieItems.map((item) => ({
    ...item,
    percentage: pieTotal ? toPercent(item.value, pieTotal) : item.percentage
  }));

  const trendSource = Array.isArray(monthly?.charts?.bar) ? monthly.charts.bar : [];
  const trendItems = trendSource.slice(-10).map((item) => ({
    label: item.label,
    net: toNumber(item.net),
    income: toNumber(item.income),
    expense: toNumber(item.expense)
  }));
  const maxAbsNet = trendItems.reduce((max, item) => Math.max(max, Math.abs(item.net)), 0) || 1;

  return (
    <div className="report-chart-grid">
      <article className="report-chart-card">
        <header>
          <h3>So sánh thu chi</h3>
          <small>{monthly?.month || "Kỳ hiện tại"}</small>
        </header>

        <div className="report-compare-bars">
          {compareBars.map((item) => (
            <div key={item.label} className="report-compare-row">
              <div className="report-compare-meta">
                <span>{item.label}</span>
                <strong>{formatVND(item.value)}</strong>
              </div>
              <div className="report-compare-track">
                <div
                  className={`report-compare-fill ${item.className}`}
                  style={{ width: `${Math.max(item.percent, 6)}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <p className={`report-chart-note ${monthlyNet >= 0 ? "positive" : "negative"}`}>
          Cân đối hiện tại: {formatVND(monthlyNet)}
        </p>
      </article>

      <article className="report-chart-card">
        <header>
          <h3>Cơ cấu chi tiêu</h3>
          <small>Top danh mục</small>
        </header>

        {normalizedPie.length ? (
          <>
            <div className="report-donut-wrap">
              <div className="report-donut" style={{ background: buildDonutBackground(normalizedPie) }}>
                <div className="report-donut-core">
                  <strong>{normalizedPie.length}</strong>
                  <span>danh mục</span>
                </div>
              </div>
            </div>

            <ul className="report-donut-legend">
              {normalizedPie.map((item) => (
                <li key={item.label}>
                  <span className="dot" style={{ background: item.color }} />
                  <span className="legend-label">{item.label}</span>
                  <strong>{item.percentage.toFixed(1)}%</strong>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="report-chart-empty">Chưa có dữ liệu danh mục để vẽ biểu đồ.</p>
        )}
      </article>

      <article className="report-chart-card report-trend-card">
        <header>
          <h3>Xu hướng theo ngày</h3>
          <small>Net cashflow</small>
        </header>

        {trendItems.length ? (
          <div className="report-trend-bars">
            {trendItems.map((item) => {
              const height = (Math.abs(item.net) / maxAbsNet) * 100;
              return (
                <div key={item.label} className="report-trend-item">
                  <div className="report-trend-bar-wrap">
                    <div
                      className={`report-trend-bar ${item.net >= 0 ? "positive" : "negative"}`}
                      style={{ height: `${Math.max(height, 8)}%` }}
                      title={`Ngày ${item.label}: ${formatVND(item.net)}`}
                    />
                  </div>
                  <span>{item.label}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="report-chart-empty">Chưa có dữ liệu theo ngày.</p>
        )}
      </article>
    </div>
  );
}
