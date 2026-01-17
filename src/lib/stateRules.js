import fs from "fs";
import path from "path";

export function getStateRule(stateCode) {
  const rulesPath = path.join(process.cwd(), "src", "rules", "state_rules.json");
  const rules = JSON.parse(fs.readFileSync(rulesPath, "utf8"));
  return rules[stateCode] || rules.GENERIC_NEXT_PAYDAY;
}
