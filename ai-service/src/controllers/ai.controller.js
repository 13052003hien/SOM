import { z } from "zod";
import { processPrompt } from "../services/ai.service.js";
import { normalizeAIError } from "../utils/ai-error.js";

const promptSchema = z.object({
  prompt: z.string().min(1)
});

function extractBearerToken(authHeader) {
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  return authHeader.slice(7);
}

export async function runCopilotController(req, res) {
  try {
    const { prompt } = promptSchema.parse(req.body);
    const token = extractBearerToken(req.headers.authorization);
    const result = await processPrompt({ prompt, token });

    return res.json({
      success: true,
      data: result.data,
      context: result.context || null,
      assistant: result.assistant,
      meta: {
        skill: result.meta?.skill || "unknown",
        provider: result.meta?.provider || "heuristic"
      }
    });
  } catch (error) {
    const normalized = normalizeAIError(error);
    return res.status(400).json({
      success: false,
      error: normalized
    });
  }
}
