// CPF Contribution and Allocation Rates
// Two models: Pre-1975 (25V1 wef Jan 2025) and Post-1975 (25V1A wef Jan 2030)
// Rates extracted directly from the Excel workbooks

// Salary ceilings - use year/month to avoid timezone issues with Date objects
export const SALARY_CEILINGS = [
  { year: 2016, month: 1,  owCeiling: 6000, awCeiling: 102000 },
  { year: 2023, month: 9,  owCeiling: 6300, awCeiling: 102000 },
  { year: 2024, month: 1,  owCeiling: 6800, awCeiling: 102000 },
  { year: 2025, month: 1,  owCeiling: 7400, awCeiling: 102000 },
  { year: 2026, month: 1,  owCeiling: 8000, awCeiling: 102000 },
];

export function getOWCeiling(date) {
  const y = date.getFullYear();
  const m = date.getMonth() + 1; // 1-based
  let ceiling = 6000;
  for (const c of SALARY_CEILINGS) {
    if (y > c.year || (y === c.year && m >= c.month)) ceiling = c.owCeiling;
  }
  return ceiling;
}

export function getAWCeiling(date) {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  let ceiling = 102000;
  for (const c of SALARY_CEILINGS) {
    if (y > c.year || (y === c.year && m >= c.month)) ceiling = c.awCeiling;
  }
  return ceiling;
}

// CPF interest rates (floor rates)
export const OA_INTEREST = 0.025; // 2.5% p.a.
export const SA_INTEREST = 0.04;  // 4.0% p.a.
export const MA_INTEREST = 0.04;  // 4.0% p.a.
export const RA_INTEREST = 0.04;  // 4.0% p.a.

// ─── PRE-1975 (25V1, wef Jan 2025) ───
// Contribution: Employer%, Employee%, Total%
// Allocation: OA%, SA(or RA after 55)%, MA% — these are ABSOLUTE rates on capped salary
const CONTRIBUTION_TABLE_PRE1975 = [
  { minAge: 0,  maxAge: 55, employer: 0.17,  employee: 0.20,  total: 0.37  },
  { minAge: 55, maxAge: 60, employer: 0.155, employee: 0.17,  total: 0.325 },
  { minAge: 60, maxAge: 65, employer: 0.12,  employee: 0.115, total: 0.235 },
  { minAge: 65, maxAge: 70, employer: 0.09,  employee: 0.075, total: 0.165 },
];

const ALLOCATION_TABLE_PRE1975 = [
  // OA, SA/RA, MA are absolute % of capped salary (not proportions of total)
  { minAge: 0,  maxAge: 35, oa: 0.23,  sa: 0.06,  ma: 0.08  },
  { minAge: 35, maxAge: 45, oa: 0.21,  sa: 0.07,  ma: 0.09  },
  { minAge: 45, maxAge: 50, oa: 0.19,  sa: 0.08,  ma: 0.10  },
  { minAge: 50, maxAge: 55, oa: 0.15,  sa: 0.115, ma: 0.105 },
  { minAge: 55, maxAge: 60, oa: 0.12,  sa: 0.10,  ma: 0.105 },
  { minAge: 60, maxAge: 65, oa: 0.035, sa: 0.095, ma: 0.105 },
  { minAge: 65, maxAge: 70, oa: 0.01,  sa: 0.05,  ma: 0.105 },
];

// ─── POST-1975 (25V1A, wef Jan 2030) ───
const CONTRIBUTION_TABLE_POST1975 = [
  { minAge: 0,  maxAge: 55, employer: 0.17,  employee: 0.20,  total: 0.37  },
  { minAge: 55, maxAge: 60, employer: null,   employee: null,  total: 0.37  }, // H9/I9 blank in Excel, J9=0.37
  { minAge: 60, maxAge: 65, employer: null,   employee: null,  total: 0.26  }, // H10/I10 blank, J10=0.26
  { minAge: 65, maxAge: 70, employer: 0.09,  employee: 0.075, total: 0.165 },
];

const ALLOCATION_TABLE_POST1975 = [
  { minAge: 0,  maxAge: 35, oa: 0.23,  sa: 0.06,  ma: 0.08  },
  { minAge: 35, maxAge: 45, oa: 0.21,  sa: 0.07,  ma: 0.09  },
  { minAge: 45, maxAge: 50, oa: 0.19,  sa: 0.08,  ma: 0.10  },
  { minAge: 50, maxAge: 55, oa: 0.15,  sa: 0.115, ma: 0.105 },
  { minAge: 55, maxAge: 60, oa: 0.12,  sa: 0.145, ma: 0.105 }, // Higher SA/RA for post-1975
  { minAge: 60, maxAge: 65, oa: 0.035, sa: 0.12,  ma: 0.105 }, // Higher SA/RA for post-1975
  { minAge: 65, maxAge: 70, oa: 0.01,  sa: 0.05,  ma: 0.105 },
];

function findRate(table, age) {
  for (const row of table) {
    if (age >= row.minAge && age < row.maxAge) return row;
  }
  return table[table.length - 1];
}

export function getContributionRate(age, bornBefore1975) {
  const table = bornBefore1975 ? CONTRIBUTION_TABLE_PRE1975 : CONTRIBUTION_TABLE_POST1975;
  return findRate(table, age);
}

export function getAllocationRate(age, bornBefore1975) {
  const table = bornBefore1975 ? ALLOCATION_TABLE_PRE1975 : ALLOCATION_TABLE_POST1975;
  return findRate(table, age);
}
