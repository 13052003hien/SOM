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

async function buildAssistantView({ prompt, skill, data, context }) {
  if (skill === "createTransaction") {
    return buildNaturalTransactionAssistant({ data, context });
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
