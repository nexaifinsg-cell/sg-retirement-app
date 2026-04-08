import { getContributionRate, getAllocationRate, getOWCeiling, getAWCeiling, OA_INTEREST, SA_INTEREST, MA_INTEREST, RA_INTEREST } from './cpfRates';
import { getFRS, getBHS } from './frsData';
import { getMSLPremium } from './medishieldRates';

export function runCPFProjection(inputs) {
  const {
    dob, statementDate, monthlySalary, annualBonus = 1, salaryIncrement = 0.03,
    oaBalance = 0, saBalance = 0, maBalance = 0, raBalance = 0,
    housingLoan = 0, housingTillAge = 0, housingStartDate = null,
    cpfisOA = 0, cpfisSA = 0, cpfisOATillAge = 0, cpfisSATillAge = 0,
    shieldIP = false, gender = 'Male',
    metFRS = false, cpfLifePayout = 0,
    bornBefore1975 = false,
  } = inputs;

  const birthDate = new Date(dob);
  const stmtDate = new Date(statementDate || new Date());
  const birthYear = birthDate.getFullYear();
  const birthMonth = birthDate.getMonth();

  // Calculate starting age (fractional)
  const startYear = stmtDate.getFullYear();
  const startMonth = stmtDate.getMonth();

  const rows = [];
  let oa = oaBalance;
  let sa = saBalance;
  let ma = maBalance;
  let ra = raBalance;
  let salary = monthlySalary;
  let cumulativeOA = 0, cumulativeSA = 0, cumulativeMA = 0;
  let oaInterestAccum = 0, saInterestAccum = 0, maInterestAccum = 0, raInterestAccum = 0;
  let yearlyAW = 0;

  // Project from statement date until age 70
  const maxAge = 70;
  const totalMonths = (birthYear + maxAge - startYear) * 12 + (birthMonth - startMonth);

  for (let m = 0; m < Math.max(totalMonths, 1); m++) {
    const currentDate = new Date(startYear, startMonth + m, 1);
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    // Calculate age
    let age = currentYear - birthYear;
    if (currentMonth < birthMonth) age--;
    const ageDecimal = age + (currentMonth - birthMonth + 12) % 12 / 12;

    if (age >= maxAge) break;

    // Salary increment in January each year (except first year)
    if (currentMonth === 0 && m > 0) {
      salary = salary * (1 + salaryIncrement);
    }

    // Reset yearly AW tracker in January
    if (currentMonth === 0) yearlyAW = 0;

    const owCeiling = getOWCeiling(currentDate);
    const awCeiling = getAWCeiling(currentDate);
    const cappedSalary = Math.min(salary, owCeiling);

    // Bonus in December
    const isDecember = currentMonth === 11;
    const bonusAmount = isDecember ? salary * annualBonus : 0;

    // AW calculation for bonus
    let cappedBonus = 0;
    if (bonusAmount > 0) {
      const totalIncome = salary * 12 + bonusAmount;
      const awRemaining = Math.max(0, awCeiling - salary * 12);
      cappedBonus = Math.min(bonusAmount, awRemaining);
    }

    // Get rates
    const contRate = getContributionRate(age, bornBefore1975);
    const allocRate = getAllocationRate(age, bornBefore1975);

    // Monthly contribution (on capped salary)
    // Allocation rates are ABSOLUTE (% of capped salary), not proportions of total
    const totalCapped = cappedSalary + cappedBonus;
    const totalContrib = totalCapped * contRate.total;

    // Allocate to OA/SA/MA using absolute rates on capped salary
    const oaContrib = totalCapped * allocRate.oa;
    const saContrib = totalCapped * allocRate.sa;
    const maContrib = totalCapped * allocRate.ma;

    // Deductions
    let oaDeduction = 0;
    let maDeduction = 0;

    // Housing loan from OA
    if (housingLoan > 0 && age < housingTillAge) {
      oaDeduction += housingLoan;
    }

    // CPFIS deductions
    if (cpfisOA > 0 && age < (cpfisOATillAge || 55)) {
      oaDeduction += cpfisOA;
    }

    // MediShield Life + AWL deduction from MA (annual, deducted monthly)
    if (shieldIP) {
      const mslRate = getMSLPremium(age);
      maDeduction += mslRate.total / 12;
    }

    // Apply contributions
    oa += oaContrib - oaDeduction;
    if (age < 55) {
      sa += saContrib;
      if (cpfisSA > 0 && age < (cpfisSATillAge || 55)) {
        sa -= cpfisSA;
      }
    } else {
      ra += saContrib; // After 55, SA contribution goes to RA
    }
    ma += maContrib - maDeduction;

    // Ensure non-negative
    oa = Math.max(0, oa);
    sa = Math.max(0, sa);
    ma = Math.max(0, ma);
    ra = Math.max(0, ra);

    // Monthly interest accumulation
    oaInterestAccum += oa * (OA_INTEREST / 12);
    saInterestAccum += sa * (SA_INTEREST / 12);
    maInterestAccum += ma * (MA_INTEREST / 12);
    raInterestAccum += ra * (RA_INTEREST / 12);

    // Credit interest in December
    if (isDecember) {
      oa += oaInterestAccum;
      sa += saInterestAccum;
      ma += maInterestAccum;
      ra += raInterestAccum;
      oaInterestAccum = 0;
      saInterestAccum = 0;
      maInterestAccum = 0;
      raInterestAccum = 0;
    }

    // BHS cap on MA - overflow to OA
    const bhs = getBHS(currentYear);
    if (ma > bhs) {
      const overflow = ma - bhs;
      oa += overflow;
      ma = bhs;
    }

    // At age 55 - set aside FRS in RA
    if (age === 55 && currentMonth === birthMonth) {
      const frs = getFRS(currentYear);
      if (!metFRS) {
        // Transfer from SA first, then OA to meet FRS
        let needed = frs;
        const saTransfer = Math.min(sa, needed);
        sa -= saTransfer;
        needed -= saTransfer;
        const oaTransfer = Math.min(oa, needed);
        oa -= oaTransfer;
        needed -= oaTransfer;
        ra = frs - needed; // RA = amount actually set aside
      }
    }

    cumulativeOA += oaContrib;
    cumulativeSA += saContrib;
    cumulativeMA += maContrib;

    rows.push({
      month: currentMonth + 1,
      year: currentYear,
      age,
      ageDecimal: Math.round(ageDecimal * 10) / 10,
      salary: Math.round(salary),
      cappedSalary: Math.round(cappedSalary),
      oaContrib: Math.round(oaContrib),
      saContrib: Math.round(saContrib),
      maContrib: Math.round(maContrib),
      totalContrib: Math.round(totalContrib),
      oaDeduction: Math.round(oaDeduction),
      maDeduction: Math.round(maDeduction),
      oaBalance: Math.round(oa),
      saBalance: Math.round(sa),
      maBalance: Math.round(ma),
      raBalance: Math.round(ra),
      totalBalance: Math.round(oa + sa + ma + ra),
      frs: getFRS(currentYear),
      bhs: getBHS(currentYear),
      bonus: Math.round(bonusAmount),
    });
  }

  return rows;
}

// Get annual summary from monthly projection
export function getAnnualSummary(monthlyRows) {
  const annual = {};
  for (const row of monthlyRows) {
    const key = row.year;
    if (!annual[key]) {
      annual[key] = {
        year: row.year,
        age: row.age,
        oaContrib: 0, saContrib: 0, maContrib: 0,
        oaBalance: 0, saBalance: 0, maBalance: 0, raBalance: 0,
        totalBalance: 0, frs: row.frs, bhs: row.bhs,
      };
    }
    annual[key].oaContrib += row.oaContrib;
    annual[key].saContrib += row.saContrib;
    annual[key].maContrib += row.maContrib;
    // Take year-end balances (last month of each year)
    annual[key].oaBalance = row.oaBalance;
    annual[key].saBalance = row.saBalance;
    annual[key].maBalance = row.maBalance;
    annual[key].raBalance = row.raBalance;
    annual[key].totalBalance = row.totalBalance;
    annual[key].age = row.age;
  }
  return Object.values(annual);
}

// Get balances at specific age (returns last month at that age for year-end view)
export function getBalancesAtAge(monthlyRows, targetAge) {
  const rows = monthlyRows.filter(r => r.age === targetAge);
  if (rows.length === 0) {
    const lastRow = monthlyRows[monthlyRows.length - 1];
    return lastRow || { oaBalance: 0, saBalance: 0, maBalance: 0, raBalance: 0 };
  }
  return rows[rows.length - 1]; // last month at this age
}
