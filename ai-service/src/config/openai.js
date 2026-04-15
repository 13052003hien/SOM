import OpenAI from "openai";

const apiKey = process.env.OPENAI_API_KEY;

export const hasOpenAI = Boolean(apiKey);

export const openaiClient = hasOpenAI
  ? new OpenAI({ apiKey })
  : null;
