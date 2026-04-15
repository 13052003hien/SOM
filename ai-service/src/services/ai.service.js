import { inferSkillFromPrompt } from "../agents/copilot.agent.js";
import {
  activeAIProvider,
  generateWithGoogleAI,
  generateWithOpenAI,
  hasGoogleAI,
  hasOpenAI
} from "../config/openai.js";
import { analyzeSpendingSkill } from "../skills/analyzeSpending.js";
import { createTransactionSkill } from "../skills/createTransaction.js";
import { getReportSkill } from "../skills/getReport.js";

const skillMap = new Map([
  [createTransactionSkill.name, createTransactionSkill],
  [getReportSkill.name, getReportSkill],
  [analyzeSpendingSkill.name, analyzeSpendingSkill]
]);

const APP_TIME_ZONE = process.env.APP_TIME_ZONE || "Asia/Ho_Chi_Minh";

function formatVND(amount) {
  const numericAmount = Number(amount || 0);
  return `${new Intl.NumberFormat("vi-VN").format(Math.round(numericAmount))} đ`;
}

function toNumber(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
}

function formatDateVN(dateString) {
  if (!dateString) return "";
  const [year, month, day] = String(dateString).slice(0, 10).split("-").map(Number);
  if (!year || !month || !day) return String(dateString);
  return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`;
}

function getTodayVN() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());
}

function describeDate(dateString) {
  if (!dateString) return "hôm nay";
  const today = getTodayVN();
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(yesterdayDate);

  const normalized = String(dateString).slice(0, 10);
  if (normalized === today) return "hôm nay";
  if (normalized === yesterday) return "hôm qua";
  return formatDateVN(normalized);
}

function prettifyVietnameseLabel(value) {
  const normalized = String(value || "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();

  const labelMap = new Map([
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

  return labelMap.get(normalized) || String(value || "");
}

function formatDeltaLabel(delta) {
  const numericDelta = toNumber(delta);
  if (numericDelta === 0) return "không thay đổi";
  if (numericDelta > 0) return `tăng ${formatVND(numericDelta)}`;
  return `giảm ${formatVND(Math.abs(numericDelta))}`;
}

function pickTopItem(items = [], labelKeys = ["category_name", "label", "name"], valueKeys = ["total", "value", "amount"]) {
  if (!Array.isArray(items) || !items.length) return null;

  return items.reduce((best, item) => {
    const currentValue = valueKeys.reduce((sum, key) => sum || toNumber(item?.[key]), 0);
    const bestValue = best ? valueKeys.reduce((sum, key) => sum || toNumber(best?.[key]), 0) : -1;
    return currentValue > bestValue ? item : best;
  }, null);
}

function safeJsonParse(rawText) {
  try {
    return JSON.parse(rawText);
  } catch {
    const firstBrace = rawText.indexOf("{");
    const lastBrace = rawText.lastIndexOf("}");
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      return JSON.parse(rawText.slice(firstBrace, lastBrace + 1));
    }
    throw new Error("ASSISTANT_JSON_PARSE_FAILED");
  }
}

function fallbackAssistantView({ skill, data }) {
  if (skill === "createTransaction") {
    return {
      title: "Da ghi nhan giao dich",
      summary: `Đã ghi nhận ${data?.type === "income" ? "thu nhập" : "chi tiêu"} ${formatVND(data?.amount)} vào hệ thống.`,
      highlights: [
        `Ngày: ${describeDate(data?.date)}`,
        `Loại: ${data?.type === "income" ? "thu nhập" : "chi tiêu"}`
      ],
      suggestions: [
        "Bạn có thể nhập tiếp giao dịch theo cách nói tự nhiên.",
        "Mở trang Báo cáo để xem tác động đến ngân sách."
      ]
    };
  }

  if (skill === "getReport") {
    return {
      title: "Báo cáo đã sẵn sàng",
      summary: "Đã tổng hợp báo cáo theo yêu cầu.",
      highlights: ["Xem bảng số liệu bên dưới để đối chiếu chi tiết."],
      suggestions: ["Hỏi AI: phân tích xu hướng tháng này so với tháng trước."]
    };
  }

  return {
    title: "Phân tích đã hoàn tất",
    summary: "Đã phân tích dữ liệu chi tiêu của bạn.",
    highlights: ["Kiểm tra phần kết quả để xem biến động thu chi."],
    suggestions: ["Yêu cầu AI gợi ý tối ưu ngân sách cho tháng tới."]
  };
}

async function buildNaturalTransactionAssistant({ data, context }) {
  const amountText = formatVND(context?.amount ?? data?.amount);
  const transactionLabel = context?.transactionType === "income" ? "thu nhập" : "chi tiêu";
  const dateLabel = describeDate(context?.transactionDate || data?.date);
  const categoryName = prettifyVietnameseLabel(context?.categoryName || "giao dịch");
  const walletName = prettifyVietnameseLabel(context?.walletName || "ví");
  const categoryPhrase = categoryName.toLowerCase();

  return {
    title: "Đã ghi nhận giao dịch",
    summary:
      context?.transactionType === "income"
        ? `Đã ghi nhận thu nhập ${amountText} từ ${categoryPhrase} ${dateLabel}.`
        : `Đã ghi nhận chi tiêu ${amountText} cho ${categoryPhrase} ${dateLabel}.`,
    highlights: [
      `Ví: ${walletName}`,
      `Danh mục: ${categoryName}`,
      `Số tiền: ${amountText}`,
      `Ngày: ${dateLabel}`
    ],
    suggestions: [
      `Bạn có thể nhập tiếp giao dịch ${transactionLabel} khác ngay bằng ngôn ngữ tự nhiên.`,
      "Mở trang Báo cáo để xem ảnh hưởng tới ngân sách."
    ]
  };
}

function buildMonthlyReportAssistant(data) {
  const monthLabel = data?.month ? `tháng ${String(data.month).slice(5, 7)}/${String(data.month).slice(0, 4)}` : "tháng này";
  const income = toNumber(data?.totalIncome);
  const expense = toNumber(data?.totalExpense);
  const net = toNumber(data?.net);
  const topExpense = pickTopItem(data?.charts?.pie || [], ["label"], ["value"]);
  const budgetAlerts = Array.isArray(data?.budget?.alerts) ? data.budget.alerts.length : 0;

  return {
    title: `Báo cáo ${monthLabel}`,
    summary:
      income || expense
        ? `Trong ${monthLabel}, bạn thu ${formatVND(income)} và chi ${formatVND(expense)}, cân đối ${net >= 0 ? "dư" : "âm"} ${formatVND(Math.abs(net))}.`
        : `Đã tổng hợp báo cáo chi tiêu cho ${monthLabel}.`,
    highlights: [
      `Thu nhập: ${formatVND(income)}`,
      `Chi tiêu: ${formatVND(expense)}`,
      `Cân đối: ${net >= 0 ? "dư" : "âm"} ${formatVND(Math.abs(net))}`,
      topExpense?.label ? `Danh mục nổi bật: ${prettifyVietnameseLabel(topExpense.label)} (${formatVND(topExpense.value)})` : "Danh mục nổi bật: chưa có dữ liệu"
    ],
    suggestions: [
      budgetAlerts
        ? `Bạn đang có ${budgetAlerts} cảnh báo ngân sách, hãy xem phần cảnh báo để tối ưu chi tiêu.`
        : "Chưa có cảnh báo ngân sách trong tháng này.",
      "Hỏi AI: phân tích chi tiêu tháng này so với tháng trước.",
      "Mở báo cáo theo danh mục để xem nhóm chi nhiều nhất."
    ]
  };
}

function buildCategoryReportAssistant(data) {
  const breakdown = Array.isArray(data?.breakdown) ? data.breakdown : [];
  const typeLabel = data?.type === "income" ? "thu nhập" : data?.type === "expense" ? "chi tiêu" : "giao dịch";
  const topCategory = pickTopItem(breakdown, ["category_name", "name", "label"], ["total", "value", "amount"]);

  return {
    title: `Báo cáo danh mục ${typeLabel}`,
    summary: breakdown.length
      ? `Đã tổng hợp ${breakdown.length} danh mục ${typeLabel}.`
      : `Chưa có dữ liệu danh mục ${typeLabel}.`,
    highlights: [
      `Tổng số danh mục: ${breakdown.length}`,
      topCategory?.category_name || topCategory?.name ? `Danh mục cao nhất: ${prettifyVietnameseLabel(topCategory.category_name || topCategory.name)}` : "Danh mục cao nhất: chưa có dữ liệu",
      topCategory?.total != null ? `Giá trị lớn nhất: ${formatVND(topCategory.total)}` : "Giá trị lớn nhất: chưa có dữ liệu"
    ],
    suggestions: [
      "Hỏi AI: phân tích danh mục nào đang chiếm tỷ trọng lớn nhất.",
      "Mở báo cáo tháng để xem xu hướng theo thời gian."
    ]
  };
}

function buildAnalysisAssistant(data) {
  const current = data?.current || {};
  const comparison = data?.comparison || {};
  const currentIncome = toNumber(current.totalIncome);
  const currentExpense = toNumber(current.totalExpense);
  const incomeDelta = toNumber(comparison.incomeDelta);
  const expenseDelta = toNumber(comparison.expenseDelta);
  const netDelta = incomeDelta - expenseDelta;

  return {
    title: "Phân tích chi tiêu",
    summary:
      comparison?.previousMonth
        ? `So với tháng trước, chi tiêu ${expenseDelta === 0 ? "không đổi" : expenseDelta > 0 ? `tăng ${formatVND(expenseDelta)}` : `giảm ${formatVND(Math.abs(expenseDelta))}`}.`
        : "Đã phân tích xu hướng chi tiêu của tháng hiện tại.",
    highlights: [
      `Thu nhập tháng này: ${formatVND(currentIncome)}`,
      `Chi tiêu tháng này: ${formatVND(currentExpense)}`,
      `Biến động thu nhập: ${formatDeltaLabel(incomeDelta)}`,
      `Biến động chi tiêu: ${formatDeltaLabel(expenseDelta)}`
    ],
    suggestions: [
      "Xem báo cáo theo danh mục để biết nhóm chi nhiều nhất.",
      `Cân đối tháng này thay đổi ${formatDeltaLabel(netDelta)} so với kỳ trước.`,
      "Thử hỏi AI: gợi ý cắt giảm chi phí tháng tới."
    ]
  };
}

async function buildAssistantView({ prompt, skill, data, context }) {
  if (skill === "createTransaction") {
    return buildNaturalTransactionAssistant({ data, context });
  }

  if (skill === "getReport") {
    if (data?.breakdown) {
      return buildCategoryReportAssistant(data);
    }

    if (data?.totalIncome !== undefined || data?.totalExpense !== undefined) {
      return buildMonthlyReportAssistant(data);
    }
  }

  if (skill === "analyzeSpending") {
    return buildAnalysisAssistant(data);
  }

  const systemPrompt = [
    "You are a Vietnamese financial assistant for a personal expense app.",
    "Return strict JSON only with keys: title, summary, highlights, suggestions.",
    "title: short Vietnamese title.",
    "summary: concise Vietnamese summary (1-2 sentences).",
    "highlights: array of 2-4 bullet strings in Vietnamese.",
    "suggestions: array of 1-3 actionable next-step strings in Vietnamese.",
    "Do not include markdown."
  ].join(" ");

  const userPrompt = JSON.stringify({ prompt, skill, result: data });

  try {
    let text = "";
    if (hasGoogleAI) {
      text = await generateWithGoogleAI({ systemPrompt, userPrompt });
    } else if (hasOpenAI) {
      text = await generateWithOpenAI({ systemPrompt, userPrompt });
    } else {
      return fallbackAssistantView({ skill, data });
    }

    const parsed = safeJsonParse(text);
    return {
      title: parsed?.title || "Phan tich AI",
      summary: parsed?.summary || "Da xu ly yeu cau cua ban.",
      highlights: Array.isArray(parsed?.highlights) ? parsed.highlights.slice(0, 4) : [],
      suggestions: Array.isArray(parsed?.suggestions) ? parsed.suggestions.slice(0, 3) : []
    };
  } catch {
    return fallbackAssistantView({ skill, data });
  }
}

export async function processPrompt({ prompt, token }) {
  const decision = await inferSkillFromPrompt(prompt);
  const skill = skillMap.get(decision.skill);

  if (!skill) {
    throw new Error("Unknown skill requested by agent");
  }

  const skillResult = await skill.execute({ args: decision.args || {}, token });
  const assistant = await buildAssistantView({
    prompt,
    skill: skillResult?.meta?.skill || decision.skill,
    data: skillResult?.data,
    context: skillResult?.context
  });

  return {
    ...skillResult,
    assistant,
    meta: {
      ...(skillResult.meta || {}),
      provider: activeAIProvider
    }
  };
}
