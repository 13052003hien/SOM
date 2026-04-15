import { inferSkillFromPrompt } from "../agents/copilot.agent.js";
import { analyzeSpendingSkill } from "../skills/analyzeSpending.js";
import { createTransactionSkill } from "../skills/createTransaction.js";
import { getReportSkill } from "../skills/getReport.js";

const skillMap = new Map([
  [createTransactionSkill.name, createTransactionSkill],
  [getReportSkill.name, getReportSkill],
  [analyzeSpendingSkill.name, analyzeSpendingSkill]
]);

export async function processPrompt({ prompt, token }) {
  const decision = await inferSkillFromPrompt(prompt);
  const skill = skillMap.get(decision.skill);

  if (!skill) {
    throw new Error("Unknown skill requested by agent");
  }

  return skill.execute({ args: decision.args || {}, token });
}
