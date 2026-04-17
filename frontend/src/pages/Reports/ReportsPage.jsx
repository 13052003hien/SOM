import { useEffect, useMemo, useState } from "react";
import { ViDateInput } from "../../components/common/ViDateInput";
import { PageSection } from "../../components/common/PageSection";
import { ReportCharts } from "../../components/ui/ReportCharts";
import { StatCard } from "../../components/ui/StatCard";
import { getCategoryReport, getCurrentMonth, getMonthlyReport } from "../../services/report.service";
import { useToast } from "../../store/toast/toast.store";
import { formatVND } from "../../utils/formatters";

function getSignedDelta(value) {
  const numeric = Number(value || 0);
  if (numeric > 0) return `+${formatVND(numeric)}`;
  return formatVND(numeric);
}

function getDeltaTone(value, higherIsBetter = true) {
  const numeric = Number(value || 0);
  if (!Number.isFinite(numeric) || numeric === 0) return "neutral";

  const isPositiveDirection = numeric > 0;
  if (higherIsBetter) {
    return isPositiveDirection ? "positive" : "negative";
  }

  return isPositiveDirection ? "negative" : "positive";
}

export function ReportsPage() {
  const toast = useToast();
  const [monthly, setMonthly] = useState(null);
  const [category, setCategory] = useState(null);
  const [month, setMonth] = useState(getCurrentMonth());
  const [error, setError] = useState("");

  const monthlyCards = useMemo(() => {
    if (!monthly) return [];

    return [
      { label: "Thu nhập", value: formatVND(monthly.totalIncome || 0), helper: `Kỳ ${monthly.month}` },
      { label: "Chi tiêu", value: formatVND(monthly.totalExpense || 0), helper: `Kỳ ${monthly.month}` },
      { label: "Cân đối", value: formatVND(monthly.net || 0), helper: monthly.net >= 0 ? "Dương ngân sách" : "Âm ngân sách" },
      { label: "Tháng trước", value: monthly.previousMonth?.month || "Không có", helper: "Kỳ so sánh" },
      {
        label: "Biến động thu nhập",
        value: getSignedDelta(monthly.comparison?.incomeDelta),
        helper: "So với tháng trước",
        tone: getDeltaTone(monthly.comparison?.incomeDelta, true)
      },
      {
        label: "Biến động chi tiêu",
        value: getSignedDelta(monthly.comparison?.expenseDelta),
        helper: "So với tháng trước",
        tone: getDeltaTone(monthly.comparison?.expenseDelta, false)
      },
      {
        label: "Biến động cân đối",
        value: getSignedDelta(monthly.comparison?.netDelta),
        helper: "So với tháng trước",
        tone: getDeltaTone(monthly.comparison?.netDelta, true)
      }
    ];
  }, [monthly]);

  const budgetCards = useMemo(() => {
    if (!monthly?.budget) return [];

    const cards = [
      {
        label: "Ngân sách vượt mức",
        value: String(monthly.budget.exceededBudgets || 0),
        helper: `Trên tổng ${monthly.budget.totalBudgets || 0} ngân sách`
      }
    ];

    const alertCards = (monthly.budget.alerts || []).map((alert) => ({
      label: alert.category_name,
      value: formatVND(alert.exceeded_by || 0),
      helper: `Đã chi ${formatVND(alert.spent_amount || 0)} / Giới hạn ${formatVND(alert.limit_amount || 0)}`
    }));

    return [...cards, ...alertCards];
  }, [monthly]);

  const categoryCards = useMemo(() => {
    return (category?.breakdown || []).map((item) => ({
      label: item.category_name,
      value: formatVND(item.total || 0),
      helper: item.type === "income" ? "Danh mục thu nhập" : "Danh mục chi tiêu"
    }));
  }, [category]);

  const pieCards = useMemo(() => {
    return (monthly?.charts?.pie || []).map((item) => ({
      label: item.label,
      value: formatVND(item.value || 0),
      helper: `${item.percentage || 0}% tổng chi tiêu`
    }));
  }, [monthly]);

  const barCards = useMemo(() => {
    return (monthly?.charts?.bar || []).map((item) => ({
      label: `Ngày ${item.label}`,
      value: formatVND(item.net || 0),
      helper: `Thu ${formatVND(item.income || 0)} | Chi ${formatVND(item.expense || 0)}`
    }));
  }, [monthly]);

  useEffect(() => {
    Promise.all([getMonthlyReport(month), getCategoryReport(month, "expense")])
      .then(([monthlyData, categoryData]) => {
        setMonthly(monthlyData);
        setCategory(categoryData);
        setError("");
      })
      .catch((err) => {
        setMonthly(null);
        setCategory(null);
        const errorMsg = err.message || "Tải báo cáo thất bại";
        setError(errorMsg);
        toast.error(errorMsg);
      });
  }, [month]);

  return (
    <>
      <PageSection title="Bộ lọc báo cáo" subtitle="Chọn tháng để xem so sánh và dữ liệu biểu đồ">
        <form className="crud-form" onSubmit={(event) => event.preventDefault()}>
          <ViDateInput mode="month" value={month} onChange={setMonth} placeholder="Chọn tháng" />
        </form>
        {error ? <p className="auth-error">{error}</p> : null}
      </PageSection>

      <PageSection title="Báo cáo theo tháng" subtitle="Tổng hợp thu chi theo tháng">
        {monthlyCards.length ? (
          <div className="stats-grid">
            {monthlyCards.map((item) => (
              <StatCard key={item.label} label={item.label} value={item.value} helper={item.helper} tone={item.tone} />
            ))}
          </div>
        ) : (
          <p>Không có dữ liệu báo cáo.</p>
        )}
      </PageSection>

      <PageSection title="Biểu đồ trực quan" subtitle="Tổng hợp nhanh để nhìn xu hướng dễ hơn">
        <ReportCharts monthly={monthly} category={category} />
      </PageSection>

      <PageSection title="Cảnh báo ngân sách" subtitle="Cảnh báo vượt ngân sách theo tháng">
        {budgetCards.length ? (
          <div className="stats-grid">
            {budgetCards.map((item) => (
              <StatCard key={`${item.label}-${item.helper}`} label={item.label} value={item.value} helper={item.helper} />
            ))}
          </div>
        ) : (
          <p>Không có cảnh báo vượt ngân sách trong tháng này.</p>
        )}
      </PageSection>

      <PageSection title="Thống kê theo danh mục" subtitle="Phân bố chi tiêu theo danh mục">
        {categoryCards.length ? (
          <div className="stats-grid">
            {categoryCards.map((item) => (
              <StatCard key={`${item.label}-${item.helper}`} label={item.label} value={item.value} helper={item.helper} />
            ))}
          </div>
        ) : (
          <p>Không có dữ liệu danh mục trong tháng này.</p>
        )}
      </PageSection>

      <PageSection title="Dữ liệu biểu đồ tròn" subtitle="Cấu trúc dữ liệu chuẩn cho Pie chart">
        {pieCards.length ? (
          <div className="stats-grid">
            {pieCards.map((item) => (
              <StatCard key={`${item.label}-${item.helper}`} label={item.label} value={item.value} helper={item.helper} />
            ))}
          </div>
        ) : (
          <p>Không có dữ liệu biểu đồ tròn trong tháng này.</p>
        )}
      </PageSection>

      <PageSection title="Dữ liệu biểu đồ cột" subtitle="Cấu trúc dữ liệu chuẩn cho Bar chart theo ngày">
        {barCards.length ? (
          <div className="stats-grid">
            {barCards.map((item) => (
              <StatCard key={`${item.label}-${item.value}`} label={item.label} value={item.value} helper={item.helper} />
            ))}
          </div>
        ) : (
          <p>Không có dữ liệu biểu đồ cột trong tháng này.</p>
        )}
      </PageSection>
    </>
  );
}
