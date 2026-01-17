export const testcases = [
  {
    name: "CA fired - 10 days late",
    input: {
      stateCode: "CA",
      separationType: "involuntary",
      separationDate: "2026-01-01",
      finalPayReceivedDate: "2026-01-11",
      dailyWage: 200,
    },
    expect: {
      dueDate: "2026-01-01",
      daysLate: 10,
      penaltyAmount: 2000,
      capApplied: false,
    },
  },
  {
    name: "CA quit no notice - due in 72 hours, paid late",
    input: {
      stateCode: "CA",
      separationType: "voluntary",
      separationDate: "2026-01-01",
      finalPayReceivedDate: "2026-01-20",
      dailyWage: 240,
    },
    // Assumes your rule uses 72 hours = 3 days for no-notice quit
    expect: {
      dueDate: "2026-01-04",
      daysLate: 16,
      penaltyAmount: 3840,
      capApplied: false,
    },
  },
  {
    name: "TX fired - due in 6 days, paid day 7",
    input: {
      stateCode: "TX",
      separationType: "involuntary",
      separationDate: "2026-01-01",
      finalPayReceivedDate: "2026-01-08",
      dailyWage: 220,
    },
    expect: {
      dueDate: "2026-01-07",
      daysLate: 1,
      // penaltyAmount likely null or 0 depending on your v1 design
    },
  },
  {
    name: "Generic next payday - on time",
    input: {
      stateCode: "ZZ",
      separationType: "involuntary",
      separationDate: "2026-01-10",
      nextPaydayDate: "2026-01-15",
      finalPayReceivedDate: "2026-01-15",
      dailyWage: 200,
    },
    expect: {
      dueDate: "2026-01-15",
      daysLate: 0,
    },
  },
];
