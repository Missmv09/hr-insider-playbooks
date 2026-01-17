import { getStateRule } from "./stateRules";

/**
 * Estimate final pay timing + penalties (educational estimator, not legal advice)
 */
export function estimateFinalPay(input) {
  const {
    stateCode,
    separationType,
    separationDate,
    finalPayReceivedDate,
    nextPaydayDate,
    dailyWage
  } = input;

  const rule = getStateRule(stateCode);

  const sepDate = new Date(separationDate);
  const paidDate = finalPayReceivedDate
    ? new Date(finalPayReceivedDate)
    : null;

  let dueDate = null;

  // -----------------------------
  // 1. Determine due date
  // -----------------------------
  if (rule.rule_type === "immediate_or_72_hours") {
    if (separationType === "involuntary") {
      dueDate = sepDate;
    } else {
      // voluntary
      dueDate = new Date(sepDate);
      dueDate.setDate(dueDate.getDate() + 3);
    }
  }

  else if (rule.rule_type === "hard_deadline") {
    const termRule = rule.termination[separationType];
    if (termRule?.due_days !== undefined) {
      dueDate = new Date(sepDate);
      dueDate.setDate(dueDate.getDate() + termRule.due_days);
    } else if (termRule?.due === "next_payday") {
      dueDate = nextPaydayDate ? new Date(nextPaydayDate) : null;
    }
  }

  else if (rule.rule_type === "next_payday_fallback") {
    dueDate = nextPaydayDate ? new Date(nextPaydayDate) : null;
  }

  // -----------------------------
  // 2. Calculate days late
  // -----------------------------
  let daysLate = 0;
  if (dueDate && paidDate && paidDate > dueDate) {
    const msPerDay = 1000 * 60 * 60 * 24;
    daysLate = Math.floor((paidDate - dueDate) / msPerDay);
  }

  // -----------------------------
  // 3. Calculate penalty (if applicable)
  // -----------------------------
  let penaltyAmount = null;
  let capApplied = false;

  if (
    rule.penalties?.type === "waiting_time" &&
    daysLate > 0 &&
    typeof dailyWage === "number"
  ) {
    const cappedDays = Math.min(daysLate, rule.penalties.cap_days);
    penaltyAmount = cappedDays * dailyWage;
    capApplied = daysLate > rule.penalties.cap_days;
  }

  // -----------------------------
  // 4. Return result
  // -----------------------------
  return {
    state: rule.state,
    dueDate: dueDate ? dueDate.toISOString().slice(0, 10) : null,
    daysLate,
    penaltyAmount,
    capApplied,
    sources: rule.sources || []
  };
}
