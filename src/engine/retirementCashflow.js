import { getFRS } from './frsData';

export function runRetirementCashflow(inputs) {
  const {
    dob,
    projectionData, // from CPF projection
    desiredMonthlyIncome = 0,
    cpfLifePayout = 0,
    cpfLifeStartAge = 65,
    investmentReturn = 0.025,
    inflationRate = 0.03,
    // Portfolio inputs
    savingsPlans = [],    // Table 1: {maturityAge, maturityValue}
    investmentPlans = [],  // Table 2: {surrenderAge, projectedFV}
    rentalIncome = [],     // Table 3: {monthlyRental, inflationRate, loanOffset, loanExpiredAge}
    regularPayouts = [],   // Table 4: {age, amount} pairs
    // From CPF projection
    excessCPF = 0,        // OA+SA excess after FRS at 55
    raBalance = 0,
    bornBefore1975 = false,
  } = inputs;

  const birthYear = new Date(dob).getFullYear();
  const rows = [];
  let balance = excessCPF;
  const startAge = 55;
  const endAge = 89;

  for (let age = startAge; age <= endAge; age++) {
    const year = birthYear + age;
    const yearNum = age - startAge + 1;

    // Expected retirement expenses (desired income * 12, adjusted for inflation)
    const yearsFromStart = age - startAge;
    const inflatedIncome = desiredMonthlyIncome * 12 * Math.pow(1 + inflationRate, yearsFromStart);
    const annualExpenses = -Math.round(inflatedIncome);

    // CPF Life income
    const cpfLife = age >= cpfLifeStartAge ? Math.round(cpfLifePayout * 12) : 0;

    // Rental income (with inflation)
    let rentalTotal = 0;
    for (const r of rentalIncome) {
      if (r.monthlyRental > 0) {
        let netRental = r.monthlyRental;
        if (r.loanOffset > 0 && age <= (r.loanExpiredAge || 999)) {
          netRental -= r.loanOffset;
        }
        rentalTotal += Math.max(0, netRental) * 12 * Math.pow(1 + (r.inflationRate || 0), yearsFromStart);
      }
    }
    rentalTotal = Math.round(rentalTotal);

    // Regular payouts from plans (Table 4)
    let regularPayoutTotal = 0;
    for (const rp of regularPayouts) {
      if (rp.age === age) {
        regularPayoutTotal += rp.amount || 0;
      }
    }

    // Lump sum from savings/insurance plans (Table 1)
    let lumpSumSavings = 0;
    for (const sp of savingsPlans) {
      if (sp.maturityAge === age) {
        lumpSumSavings += sp.maturityValue || 0;
      }
    }

    // Lump sum from investment plans (Table 2)
    let lumpSumInvestment = 0;
    for (const ip of investmentPlans) {
      if (ip.surrenderAge === age) {
        lumpSumInvestment += ip.projectedFV || 0;
      }
    }

    const totalLumpSum = Math.round(lumpSumSavings + lumpSumInvestment);
    const currentPFIncome = Math.round(regularPayoutTotal);

    // Cashflow for the year
    const cashflowIncome = cpfLife + rentalTotal + currentPFIncome + totalLumpSum;
    const netCashflow = annualExpenses + cashflowIncome;

    // Investment return on balance
    const investReturn = Math.round(balance * investmentReturn);

    // New balance
    balance = balance + netCashflow + investReturn;

    rows.push({
      age,
      year,
      yearNum,
      startBalance: Math.round(balance - netCashflow - investReturn),
      annualExpenses,
      cpfLife,
      rentalIncome: rentalTotal,
      currentPFIncome,
      lumpSum: totalLumpSum,
      netCashflow,
      investReturn,
      endBalance: Math.round(balance),
      isDeficit: balance < 0,
    });
  }

  return rows;
}

export function getCPFLifeEstimate(raAtAge55, retirementSum = 'FRS', yearAt55) {
  if (!raAtAge55 || raAtAge55 <= 0) return 0;

  // CPF Life Standard Plan approximate monthly payout at age 65
  // Based on interpolation of official CPF Life payout tables
  // Payout rate per $1000 varies: ~$8 for lower amounts, ~$7 for higher
  const payout_table = [
    { ra: 50000,  monthly: 390 },
    { ra: 100000, monthly: 800 },
    { ra: 150000, monthly: 1050 },
    { ra: 200000, monthly: 1510 },
    { ra: 250000, monthly: 1900 },
    { ra: 300000, monthly: 2270 },
    { ra: 350000, monthly: 2630 },
    { ra: 400000, monthly: 2990 },
    { ra: 450000, monthly: 3340 },
    { ra: 500000, monthly: 3680 },
  ];

  // Linear interpolation
  if (raAtAge55 <= payout_table[0].ra) {
    return Math.round(raAtAge55 / payout_table[0].ra * payout_table[0].monthly);
  }
  if (raAtAge55 >= payout_table[payout_table.length - 1].ra) {
    const last = payout_table[payout_table.length - 1];
    const secondLast = payout_table[payout_table.length - 2];
    const rate = (last.monthly - secondLast.monthly) / (last.ra - secondLast.ra);
    return Math.round(last.monthly + (raAtAge55 - last.ra) * rate);
  }

  for (let i = 0; i < payout_table.length - 1; i++) {
    if (raAtAge55 >= payout_table[i].ra && raAtAge55 < payout_table[i + 1].ra) {
      const ratio = (raAtAge55 - payout_table[i].ra) / (payout_table[i + 1].ra - payout_table[i].ra);
      return Math.round(payout_table[i].monthly + ratio * (payout_table[i + 1].monthly - payout_table[i].monthly));
    }
  }

  return Math.round(raAtAge55 * 0.0075); // fallback
}
