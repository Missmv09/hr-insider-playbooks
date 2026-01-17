import { getStateRule } from "./stateRules.js";

function toDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return Number.isNaN(d.getTime()) ? null : d;
}

function toISODate(d) {
  return d ? d.toISOString().slice(0, 10) : null;
}

function addDays(d, days) {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function daysBetween(later, earlier) {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.floor((later - earlier) / msPerDay);
}

/**
 * Educational estimator (not legal advice):
 * - Computes due date from state rule
 * - Computes days late
 * - Applies waiting time penalty only where defined (CA v1), capped
 */
export function estimateFinalPay(input) {
  const {
    stateCode,
    separationType, // "involuntary" | "voluntary"
    separationDate, // "YYYY-MM-DD"
    finalPayReceivedDate, // "YYYY-MM-DD"
    nextPaydayDate, // optional "YYYY-MM-DD"
    dailyWage, // number (required for CA penalty)
  } = input;

  const rule = getStateRule(stateCode);

  const sepDate = toDate(separationDate);
  const paidDate = toDate(finalPayReceivedDate);
  const paydayDate = toDate(nextPaydayDate);

  if (!sepDate) {
    return {
      state: rule.state,
      dueDate: null,
      daysLate: 0,
      penaltyAmount: null,
      capApplied: false,
      sources: rule.sources || [],
      errors: ["Invalid separationDate"],
    };
  }

  // 1) Determine due date
  let dueDate = null;

  if (rule.rule_type === "immediate_or_72_hours") {
    if (separationType === "involuntary") {
      dueDate = sepDate;
    } else {
      // v1 assumes no notice -> 72 hours (~3 days)
      dueDate = addDays(sepDate, 3);
    }
  } else if (rule.rule_type === "hard_deadline") {
    const termRule = rule.termination?.[separationType];
    if (typeof termRule?.due_days === "number") {
      dueDate = addDays(sepDate, termRule.due_days);
    } else if (termRule?.due === "next_payday") {
      dueDate = paydayDate;
    }
  } else if (rule.rule_type === "next_payday_fallback") {
    dueDate = paydayDate;
  }

  // 2) Days late
  let daysLate = 0;
  if (dueDate && paidDate && paidDate > dueDate) {
    daysLate = daysBetween(paidDate, dueDate);
  }

  // 3) Penalty (CA waiting time v1)
  let penaltyAmount = null;
  let capApplied = false;

  if (rule.penalties?.type === "waiting_time" && daysLate > 0) {
    if (typeof dailyWage === "number") {
      const capDays =
        typeof rule.penalties.cap_days === "number" ? rule.penalties.cap_days : 30;
      const cappedDays = Math.min(daysLate, capDays);
      penaltyAmount = cappedDays * dailyWage;
      capApplied = daysLate > capDays;
    } else {
      penaltyAmount = null;
    }
  }

  return {
    state: rule.state,
    dueDate: toISODate(dueDate),
    daysLate,
    penaltyAmount,
    capApplied,
    sources: rule.sources || [],
    rule_type: rule.rule_type,
  };
}
