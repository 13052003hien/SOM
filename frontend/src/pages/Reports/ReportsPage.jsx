import { useEffect, useState } from "react";
import { PageSection } from "../../components/common/PageSection";
import { getCategoryReport, getCurrentMonth, getMonthlyReport } from "../../services/report.service";
import { useToast } from "../../store/toast/toast.store";
import { formatVND } from "../../utils/formatters";

function getTypeLabel(type) {
  return type === "income" ? "Thu nhập" : "Chi tiêu";
}

export function ReportsPage() {
  const toast = useToast();
  const [monthly, setMonthly] = useState(null);
  const [category, setCategory] = useState(null);
  const [month, setMonth] = useState(getCurrentMonth());
  const [error, setError] = useState("");

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
          <input type="month" value={month} onChange={(event) => setMonth(event.target.value)} />
        </form>
        {error ? <p className="auth-error">{error}</p> : null}
      </PageSection>

      <PageSection title="Báo cáo theo tháng" subtitle="Tổng hợp thu chi theo tháng">
        {monthly ? (
          <ul className="report-summary">
            <li><strong>Tháng:</strong> {monthly.month}</li>
            <li><strong>Thu nhập:</strong> {formatVND(monthly.totalIncome)}</li>
            <li><strong>Chi tiêu:</strong> {formatVND(monthly.totalExpense)}</li>
            <li><strong>Cân đối:</strong> {formatVND(monthly.net)}</li>
            <li><strong>Tháng trước:</strong> {monthly.previousMonth?.month}</li>
            <li><strong>Biến động thu nhập:</strong> {formatVND(monthly.comparison?.incomeDelta)}</li>
            <li><strong>Biến động chi tiêu:</strong> {formatVND(monthly.comparison?.expenseDelta)}</li>
            <li><strong>Biến động cân đối:</strong> {formatVND(monthly.comparison?.netDelta)}</li>
          </ul>
        ) : (
          <p>Không có dữ liệu báo cáo.</p>
        )}
      </PageSection>

      <PageSection title="Cảnh báo ngân sách" subtitle="Cảnh báo vượt ngân sách theo tháng">
        {monthly?.budget?.alerts?.length ? (
          <div className="crud-list">
            {monthly.budget.alerts.map((alert) => (
              <article key={alert.id} className="crud-item">
                <div>
                  <strong>{alert.category_name}</strong>
                  <p>
                    Đã chi {formatVND(alert.spent_amount)} / Giới hạn {formatVND(alert.limit_amount)} (Vượt {formatVND(alert.exceeded_by)})
                  </p>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p>Không có cảnh báo vượt ngân sách trong tháng này.</p>
        )}
      </PageSection>

      <PageSection title="Thống kê theo danh mục" subtitle="Phân bố chi tiêu theo danh mục">
        {category?.breakdown?.length ? (
          <div className="report-data-wrap">
            <div className="table-wrap desktop-report-table">
              <table className="simple-table">
                <thead>
                  <tr>
                    <th>Danh mục</th>
                    <th>Loại</th>
                    <th>Tổng</th>
                  </tr>
                </thead>
                <tbody>
                  {category.breakdown.map((item) => (
                    <tr key={item.category_id}>
                      <td>{item.category_name}</td>
                      <td>{getTypeLabel(item.type)}</td>
                      <td>{formatVND(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mobile-report-list">
              {category.breakdown.map((item) => (
                <article key={`category-${item.category_id}`} className="mobile-report-card">
                  <header>
                    <strong>{item.category_name}</strong>
                    <span className={`type-badge ${item.type === "income" ? "type-badge-income" : "type-badge-expense"}`}>
                      {getTypeLabel(item.type)}
                    </span>
                  </header>
                  <p>
                    <span>Tổng</span>
                    <strong>{formatVND(item.total)}</strong>
                  </p>
                </article>
              ))}
            </div>
          </div>
        ) : (
          <p>Không có dữ liệu danh mục trong tháng này.</p>
        )}
      </PageSection>

      <PageSection title="Dữ liệu biểu đồ tròn" subtitle="Cấu trúc dữ liệu chuẩn cho Pie chart">
        {monthly?.charts?.pie?.length ? (
          <div className="report-data-wrap">
            <div className="table-wrap desktop-report-table">
              <table className="simple-table">
                <thead>
                  <tr>
                    <th>Nhãn</th>
                    <th>Giá trị</th>
                    <th>Tỷ lệ</th>
                  </tr>
                </thead>
                <tbody>
                  {monthly.charts.pie.map((item) => (
                    <tr key={item.id}>
                      <td>{item.label}</td>
                      <td>{formatVND(item.value)}</td>
                      <td>{item.percentage}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mobile-report-list">
              {monthly.charts.pie.map((item) => (
                <article key={`pie-${item.id}`} className="mobile-report-card">
                  <header>
                    <strong>{item.label}</strong>
                    <span>{item.percentage}%</span>
                  </header>
                  <p>
                    <span>Giá trị</span>
                    <strong>{formatVND(item.value)}</strong>
                  </p>
                </article>
              ))}
            </div>
          </div>
        ) : (
          <p>Không có dữ liệu biểu đồ tròn trong tháng này.</p>
        )}
      </PageSection>

      <PageSection title="Dữ liệu biểu đồ cột" subtitle="Cấu trúc dữ liệu chuẩn cho Bar chart theo ngày">
        {monthly?.charts?.bar?.length ? (
          <div className="report-data-wrap">
            <div className="table-wrap desktop-report-table">
              <table className="simple-table">
                <thead>
                  <tr>
                    <th>Ngày</th>
                    <th>Thu nhập</th>
                    <th>Chi tiêu</th>
                    <th>Cân đối</th>
                  </tr>
                </thead>
                <tbody>
                  {monthly.charts.bar.map((item) => (
                    <tr key={item.label}>
                      <td>{item.label}</td>
                      <td>{formatVND(item.income)}</td>
                      <td>{formatVND(item.expense)}</td>
                      <td>{formatVND(item.net)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mobile-report-list">
              {monthly.charts.bar.map((item) => (
                <article key={`bar-${item.label}`} className="mobile-report-card">
                  <header>
                    <strong>{item.label}</strong>
                    <span>{formatVND(item.net)}</span>
                  </header>
                  <div className="mobile-report-grid">
                    <p>
                      <span>Thu nhập</span>
                      <strong>{formatVND(item.income)}</strong>
                    </p>
                    <p>
                      <span>Chi tiêu</span>
                      <strong>{formatVND(item.expense)}</strong>
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        ) : (
          <p>Không có dữ liệu biểu đồ cột trong tháng này.</p>
        )}
      </PageSection>
    </>
  );
}
