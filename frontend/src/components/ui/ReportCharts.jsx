import { useMemo, useState } from "react";
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
  const [trendRange, setTrendRange] = useState("7d");

  const totalIncome = toNumber(monthly?.totalIncome);
  const totalExpense = toNumber(monthly?.totalExpense);
  const totalFlow = totalIncome + totalExpense;
  const monthlyNet = toNumber(monthly?.net);

  const categoryTypeByName = useMemo(() => {
    const map = new Map();
    (category?.breakdown || []).forEach((item) => {
      const name = String(item.category_name || "").toLowerCase().trim();
      if (name) map.set(name, item.type || "expense");
    });
    return map;
  }, [category]);

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
      color: PIE_COLORS[index % PIE_COLORS.length],
      type: item.type || categoryTypeByName.get(String(item.label || item.category_name || "").toLowerCase().trim()) || "expense"
    }))
    .filter((item) => item.value > 0);

  const pieTotal = pieItems.reduce((sum, item) => sum + item.value, 0);
  const normalizedPie = pieItems.map((item) => ({
    ...item,
    percentage: pieTotal ? toPercent(item.value, pieTotal) : item.percentage,
    semantic: item.type === "income" ? "positive" : "negative"
  }));

  const trendSource = Array.isArray(monthly?.charts?.bar) ? monthly.charts.bar : [];
  const filteredTrendSource = trendRange === "7d" ? trendSource.slice(-7) : trendSource;
  const trendItems = filteredTrendSource.map((item) => ({
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
                <li key={item.label} className={`legend-${item.semantic}`}>
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
          <div className="report-trend-head-meta">
            <small>Net cashflow</small>
            <div className="report-range-switch" role="group" aria-label="Chọn khoảng thời gian biểu đồ">
              <button
                type="button"
                className={trendRange === "7d" ? "active" : ""}
                onClick={() => setTrendRange("7d")}
                aria-pressed={trendRange === "7d"}
              >
                7 ngày
              </button>
              <button
                type="button"
                className={trendRange === "month" ? "active" : ""}
                onClick={() => setTrendRange("month")}
                aria-pressed={trendRange === "month"}
              >
                Cả tháng
              </button>
            </div>
          </div>
        </header>

        {trendItems.length ? (
          <div className="report-trend-bars">
            {trendItems.map((item) => {
              const height = (Math.abs(item.net) / maxAbsNet) * 100;
              const trendSemantic = item.net >= 0 ? "positive" : "negative";
              const trendArrow = item.net > 0 ? "▲" : item.net < 0 ? "▼" : "•";
              return (
                <div key={item.label} className="report-trend-item">
                  <div className="report-trend-bar-wrap" tabIndex={0}>
                    <div
                      className={`report-trend-bar ${trendSemantic}`}
                      style={{ height: `${Math.max(height, 8)}%` }}
                      title={`Ngày ${item.label}: ${formatVND(item.net)}`}
                    />
                    <div className="report-trend-tooltip" role="tooltip">
                      <strong>Ngày {item.label}</strong>
                      <p>Thu nhập: {formatVND(item.income)}</p>
                      <p>Chi tiêu: {formatVND(item.expense)}</p>
                      <p className={`report-trend-net-row ${trendSemantic}`}>
                        <span className="report-trend-arrow" aria-hidden="true">{trendArrow}</span>
                        <span>Net: {formatVND(item.net)}</span>
                      </p>
                    </div>
                  </div>
                  <span className={`report-trend-axis ${trendSemantic}`}>{item.label}</span>
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
