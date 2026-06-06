import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

export function isRiskyAction(action) {
  return action?.requiresApproval === true || action?.risk === "high";
}

export async function requestApproval(action, { autoApprove = false } = {}) {
  if (!isRiskyAction(action)) return true;
  if (autoApprove || process.env.LOOPS_AUTO_APPROVE === "1") return true;

  const rl = createInterface({ input, output });
  try {
    const label = action.description ?? action.reason ?? action.type;
    const answer = await rl.question(`Approve action '${label}'? Type yes to continue: `);
    return answer.trim().toLowerCase() === "yes";
  } finally {
    rl.close();
  }
}
