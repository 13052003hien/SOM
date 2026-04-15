import { useState } from "react";
import { PageSection } from "../../components/common/PageSection";
import { askAIAssistant } from "../../services/ai-assistant.service";
import { useToast } from "../../store/toast/toast.store";
import { StatCard } from "../../components/ui/StatCard";
import { formatVND } from "../../utils/formatters";

function formatISODateVN(value) {
  if (!value) return "Không rõ";
  const [year, month, day] = String(value).slice(0, 10).split("-");
  if (!year || !month || !day) return String(value);
  return `${day}/${month}/${year}`;
}

function prettifyLabel(value) {
  const normalized = String(value || "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();

  const map = new Map([
    ["quan cafe", "quán cafe"],
    ["ca phe", "cà phê"],
    ["cafe", "cafe"],
    ["sinh hoat", "sinh hoạt"],
    ["di lam", "đi làm"],
    ["xang xe", "xăng xe"],
    ["xang", "xăng"],
    ["tien mat", "tiền mặt"],
    ["ngan hang", "ngân hàng"],
    ["thu nhap", "thu nhập"],
    ["chi tieu", "chi tiêu"],
    ["an trua", "ăn trưa"],
    ["an sang", "ăn sáng"],
    ["an toi", "ăn tối"],
    ["an uong", "ăn uống"]
  ]);

  return map.get(normalized) || String(value || "");
}

function getTransactionCards(response) {
  const context = response?.context;
  if (!context) return [];

  return [
    { label: "Loại giao dịch", value: context.transactionType === "income" ? "Thu nhập" : "Chi tiêu" },
    { label: "Ví", value: prettifyLabel(context.walletName) || "Không rõ" },
    { label: "Danh mục", value: prettifyLabel(context.categoryName) || "Không rõ" },
    { label: "Ngày", value: formatISODateVN(context.transactionDate) },
    { label: "Số tiền", value: formatVND(context.amount) }
  ];
}

function getInsightCards(response) {
  const skill = response?.meta?.skill;
  const data = response?.data || {};

  if (skill === "getReport") {
    if (data?.totalIncome !== undefined || data?.totalExpense !== undefined) {
      const topCategory = Array.isArray(data?.charts?.pie) && data.charts.pie.length ? data.charts.pie[0] : null;

      return [
        { label: "Thu nhập", value: formatVND(data.totalIncome || 0), helper: `Kỳ ${data.month || "hiện tại"}` },
        { label: "Chi tiêu", value: formatVND(data.totalExpense || 0), helper: `Kỳ ${data.month || "hiện tại"}` },
        { label: "Cân đối", value: formatVND(data.net || 0), helper: data.net >= 0 ? "Dư ngân sách" : "Âm ngân sách" },
        { label: "Cảnh báo", value: String(data?.budget?.exceededBudgets || 0), helper: `Tổng ${data?.budget?.totalBudgets || 0} ngân sách` },
        { label: "Danh mục nổi bật", value: topCategory?.label || "Chưa có", helper: topCategory ? `${topCategory.percentage}% chi tiêu` : "Chưa có dữ liệu" }
      ];
    }

    if (Array.isArray(data?.breakdown)) {
      const top = data.breakdown[0];

      return [
        { label: "Số danh mục", value: String(data.breakdown.length), helper: `Kỳ ${data.month || "hiện tại"}` },
        { label: "Loại báo cáo", value: data.type === "income" ? "Thu nhập" : data.type === "expense" ? "Chi tiêu" : "Tất cả", helper: "Theo danh mục" },
        { label: "Danh mục nổi bật", value: top?.category_name || "Chưa có", helper: top ? formatVND(top.total || 0) : "Chưa có dữ liệu" }
      ];
    }
  }

  if (skill === "analyzeSpending") {
    const current = data?.current || {};
    const comparison = data?.comparison || {};

    return [
      { label: "Thu nhập tháng này", value: formatVND(current.totalIncome || 0), helper: current.month || "Hiện tại" },
      { label: "Chi tiêu tháng này", value: formatVND(current.totalExpense || 0), helper: current.month || "Hiện tại" },
      { label: "Tăng/Giảm thu nhập", value: formatVND(comparison.incomeDelta || 0), helper: comparison.previousMonth ? `${comparison.previousMonth} → ${comparison.month}` : "So sánh kỳ trước" },
      { label: "Tăng/Giảm chi tiêu", value: formatVND(comparison.expenseDelta || 0), helper: comparison.previousMonth ? `${comparison.previousMonth} → ${comparison.month}` : "So sánh kỳ trước" }
    ];
  }

  return [];
}

export function SettingsPage() {
  const toast = useToast();
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);

  const quickPrompts = [
    "Hôm nay ăn trưa 50k",
    "Tháng này tôi chi bao nhiêu cho ăn uống?",
    "Phân tích chi tiêu tháng này so với tháng trước"
  ];

  async function handleAskAI(event) {
    event.preventDefault();
    if (!prompt.trim()) {
      toast.warning("Vui lòng nhập nội dung cần AI hỗ trợ.");
      return;
    }

    setLoading(true);
    try {
      const result = await askAIAssistant(prompt.trim());
      setResponse(result);
      toast.success("AI đã xử lý yêu cầu thành công.");
    } catch (error) {
      setResponse(null);
      toast.error(error.message || "Không thể kết nối AI service");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <PageSection title="Cài đặt" subtitle="Cấu hình hệ thống và tài khoản">
        <p>Từ đây bạn có thể mở rộng dark mode, hồ sơ và thông báo ngân sách.</p>
        <button type="button" className="secondary-button" onClick={() => toast.success("Cài đặt đã sẵn sàng.")}>Kiểm tra nhanh</button>
      </PageSection>

      <PageSection title="AI Assistant" subtitle="Nhập chi tiêu tự nhiên, hỏi báo cáo và phân tích xu hướng">
        <form className="ai-assistant-form" onSubmit={handleAskAI}>
          <textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="Ví dụ: Hôm nay ăn trưa 50k"
            rows={4}
          />

          <div className="ai-assistant-actions">
            <button type="submit" disabled={loading}>
              {loading ? "Đang xử lý..." : "Gửi AI"}
            </button>
            <button type="button" className="secondary-button" onClick={() => setPrompt(quickPrompts[0])}>
              Điền mẫu nhanh
            </button>
          </div>

          <div className="ai-quick-prompts">
            {quickPrompts.map((item) => (
              <button key={item} type="button" className="ai-chip" onClick={() => setPrompt(item)}>
                {item}
              </button>
            ))}
          </div>
        </form>

        {response?.data ? (
          <div className="ai-result-card">
            <p className="ai-result-skill">
              Skill: {response?.meta?.skill || "unknown"} | Engine: {response?.meta?.provider || "heuristic"}
            </p>

            {getTransactionCards(response).length ? (
              <div className="ai-context-grid">
                {getTransactionCards(response).map((item) => (
                  <div key={item.label} className="ai-context-card">
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                  </div>
                ))}
              </div>
            ) : null}

            {getInsightCards(response).length ? (
              <div className="stats-grid ai-insight-kpi-grid">
                {getInsightCards(response).map((item) => (
                  <StatCard key={item.label} label={item.label} value={item.value} helper={item.helper} />
                ))}
              </div>
            ) : null}

            {response?.assistant ? (
              <div className="ai-insight-panel">
                <h3>{response.assistant.title || "Phan tich AI"}</h3>
                <p className="ai-insight-summary">{response.assistant.summary}</p>

                {Array.isArray(response.assistant.highlights) && response.assistant.highlights.length > 0 ? (
                  <ul className="ai-insight-list">
                    {response.assistant.highlights.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : null}

                {Array.isArray(response.assistant.suggestions) && response.assistant.suggestions.length > 0 ? (
                  <div className="ai-insight-actions">
                    {response.assistant.suggestions.map((item) => (
                      <span key={item} className="ai-tip-chip">{item}</span>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}

            <details className="ai-raw-details">
              <summary>Du lieu chi tiet</summary>
              <pre>{JSON.stringify(response.data, null, 2)}</pre>
            </details>
          </div>
        ) : null}
      </PageSection>
    </>
  );
}
