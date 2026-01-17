import { testcases } from "./finalPayEstimator.testcases.js";
import { estimateFinalPay } from "./estimateFinalPay.js";

function assertEqual(label, actual, expected) {
  if (actual !== expected) {
    throw new Error(`${label} FAILED: expected ${expected}, got ${actual}`);
  }
}

for (const t of testcases) {
  const out = estimateFinalPay(t.input);

  console.log(`\n✅ ${t.name}`);
  assertEqual("dueDate", out.dueDate, t.expect.dueDate);
  assertEqual("daysLate", out.daysLate, t.expect.daysLate);

  if (t.expect.penaltyAmount !== undefined) {
    assertEqual("penaltyAmount", out.penaltyAmount, t.expect.penaltyAmount);
  }
  if (t.expect.capApplied !== undefined) {
    assertEqual("capApplied", out.capApplied, t.expect.capApplied);
  }

  console.log("Output:", out);
}

console.log("\nAll testcases passed.");
