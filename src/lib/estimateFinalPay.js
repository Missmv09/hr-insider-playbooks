import { getStateRule } from "./stateRules.js";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function parseDate(value) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(date, days) {
  const copy = new Date(date.getTime());
  copy.setDate(copy.getDate() + days);
  return copy;
}

function requireDate(value, label) {
  const date = parseDate(value);
  if (!date) {
    throw new Error(`Missing or invalid ${label}.`);
  }
  return date;
}

function resolveDueDate(rule, separationType, separationDate, nextPaydayDate) {
  if (rule.rule_type === "immediate_or_72_hours") {
    if (separationType === "involuntary") {
      return separationDate;
    }
    const voluntaryRule = rule.termination?.voluntary?.due;
    if (voluntaryRule === "72_hours_if_no_notice") {
      return addDays(separationDate, 3);
    }
    return separationDate;
  }

  if (rule.rule_type === "hard_deadline") {
    if (separationType === "involuntary") {
      const dueDays = rule.termination?.involuntary?.due_days ?? 0;
      return addDays(separationDate, dueDays);
    }
    if (rule.termination?.voluntary?.due === "next_payday") {
      return requireDate(nextPaydayDate, "nextPaydayDate");
    }
  }

  if (rule.rule_type === "next_payday_fallback") {
    return requireDate(nextPaydayDate, "nextPaydayDate");
  }

  throw new Error(`Unsupported rule type for ${rule.state || "state"}.`);
}

function computePenalty(rule, daysLate, dailyWage) {
  if (rule.penalties?.type !== "waiting_time") {
    return { penaltyAmount: null, capApplied: false };
  }

  if (!Number.isFinite(dailyWage) || dailyWage <= 0) {
    return { penaltyAmount: null, capApplied: false };
  }

  const multiplier = rule.penalties.daily_wage_multiplier ?? 1;
  const capDays = rule.penalties.cap_days ?? daysLate;
  const cappedDays = Math.min(daysLate, capDays);
  const penaltyAmount = dailyWage * multiplier * cappedDays;

  return {
    penaltyAmount,
    capApplied: daysLate > capDays,
  };
}

export function estimateFinalPay(input) {
  const {
    stateCode,
    separationType,
    separationDate,
    finalPayReceivedDate,
    nextPaydayDate,
    dailyWage,
  } = input;

  const rule = getStateRule(stateCode);
  const separation = requireDate(separationDate, "separationDate");
  const paidDate = requireDate(finalPayReceivedDate, "finalPayReceivedDate");

  const dueDate = resolveDueDate(rule, separationType, separation, nextPaydayDate);
  const rawDaysLate = Math.floor((paidDate.getTime() - dueDate.getTime()) / MS_PER_DAY);
  const daysLate = Math.max(0, rawDaysLate);

  const { penaltyAmount, capApplied } = computePenalty(rule, daysLate, dailyWage);

  return {
    dueDate: formatDate(dueDate),
    daysLate,
    penaltyAmount,
    capApplied,
    sources: rule.sources ?? [],
  };
}
