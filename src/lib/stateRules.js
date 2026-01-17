import rules from "../rules/state_rules.json" with { type: "json" };

export function getStateRule(stateCode) {
  return rules[stateCode] || rules.GENERIC_NEXT_PAYDAY;
}
