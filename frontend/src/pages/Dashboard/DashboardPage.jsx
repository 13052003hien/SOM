import { useEffect, useMemo, useState } from "react";
import { PageSection } from "../../components/common/PageSection";
import { StatCard } from "../../components/ui/StatCard";
import { getMonthlyReport } from "../../services/report.service";
import { useToast } from "../../store/toast/toast.store";
import { formatVND } from "../../utils/formatters";

export function DashboardPage() {
  const toast = useToast();
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    getMonthlyReport()
      .then(setReport)
      .catch((err) => {
        const errorMsg = err.message || "Tải tổng quan thất bại";
        setError(errorMsg);
        toast.error(errorMsg);
      });
  }, []);

  const stats = useMemo(() => {
    if (!report) {
      return [
        { label: "Thu nhập", value: "...", helper: "Tháng hiện tại" },
        { label: "Chi tiêu", value: "...", helper: "Tháng hiện tại" },
        { label: "Cân đối", value: "...", helper: "Thu nhập - Chi tiêu" }
      ];
    }

    return [
      { label: "Thu nhập", value: formatVND(report.totalIncome), helper: `Tháng ${report.month}` },
      { label: "Chi tiêu", value: formatVND(report.totalExpense), helper: `Tháng ${report.month}` },
      { label: "Cân đối", value: formatVND(report.net), helper: "Thu nhập - Chi tiêu" }
    ];
  }, [report]);

  return (
    <>
      <section className="dashboard-hero">
        <div className="dashboard-hero-glow" aria-hidden="true" />
        <div className="dashboard-topbar">
          <span className="dashboard-topbar-pill">Night mode</span>
          <span className="dashboard-topbar-sep" aria-hidden="true" />
          <span className="dashboard-topbar-text">Giao diện tối tương phản cao, tối ưu cho theo dõi dòng tiền.</span>
        </div>
        <div className="dashboard-hero-content">
          <div>
            <p className="dashboard-hero-kicker">WELCOME BACK</p>
            <h1>Tổng quan tài chính</h1>
            <p>
              Theo dõi thu nhập, chi tiêu và cảnh báo ngân sách trong một không gian tối phong cách club.
            </p>
          </div>
          <div className="dashboard-hero-meta">
            <span>{report ? `Kỳ báo cáo ${report.month}` : "Đang tải kỳ báo cáo"}</span>
            <strong>{report ? formatVND(report.net) : "..."}</strong>
          </div>
        </div>
      </section>

      <PageSection title="Tổng quan tài chính" subtitle="Theo dõi dòng tiền hiện tại và xu hướng theo tháng.">
        <div className="stats-grid">
          {stats.map((item) => (
            <StatCard key={item.label} label={item.label} value={item.value} helper={item.helper} />
          ))}
        </div>
      </PageSection>

      <PageSection title="Trạng thái hệ thống" subtitle="Thông tin kết nối nhanh">
        {error ? <p>{error}</p> : <p>Backend đã kết nối.</p>}
        {!error && report?.budget ? (
          <p>
            Cảnh báo ngân sách: {report.budget.exceededBudgets} / {report.budget.totalBudgets}
          </p>
        ) : null}
      </PageSection>
    </>
  );
}
