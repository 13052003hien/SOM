import { useState } from "react";
import { PageSection } from "../../components/common/PageSection";
import { askAIAssistant } from "../../services/ai-assistant.service";
import { useToast } from "../../store/toast/toast.store";

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
