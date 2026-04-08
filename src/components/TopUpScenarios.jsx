import { useState, useMemo } from 'react';
import { formatCurrency } from '../utils/formatters';
import { formatAge, getYearAt55 } from '../utils/formatters';
import { getFRS, getBRS, getERS } from '../engine/frsData';
import { getCPFLifeEstimate } from '../engine/retirementCashflow';
import { getBalancesAtAge } from '../engine/cpfProjection';

const SA_RATE = 0.04; // 4% SA/RA interest

function SummaryCard({ label, value, subtext, color }) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
      <p className={`text-xl font-bold mt-1 ${color || 'text-gray-900'}`}>{value}</p>
      {subtext && <p className="text-xs text-gray-500 mt-1">{subtext}</p>}
    </div>
  );
}

function ImpactCard({ title, items, borderColor }) {
  return (
    <div className={`bg-white rounded-lg shadow-sm p-5 border-t-4 ${borderColor}`}>
      <h4 className="text-sm font-semibold text-gray-700 mb-3">{title}</h4>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex justify-between items-center">
            <span className="text-sm text-gray-500">{item.label}</span>
            <span className={`text-sm font-semibold ${item.color || 'text-gray-900'}`}>{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function TopUpScenarios({ inputs, projectionData, projectionDerived }) {
  const currentAge = formatAge(inputs?.dob);
  const yearAt55 = getYearAt55(inputs?.dob);

  // Local state for top-up calculator inputs
  const [annualTopUp, setAnnualTopUp] = useState(8000);
  const [topUpYears, setTopUpYears] = useState(Math.max(1, 55 - currentAge));
  const [startAge, setStartAge] = useState(currentAge);

  // Current status
  const currentStatus = useMemo(() => {
    if (!projectionData || projectionData.length === 0) return null;

    const raAt55 = projectionDerived?.raBalance ?? 0;
    const frs = getFRS(yearAt55);
    const brs = getBRS(yearAt55);
    const ers = getERS(yearAt55);
    const shortfall = frs - raAt55;

    return {
      currentAge,
      yearAt55,
      raAt55,
      frs,
      brs,
      ers,
      shortfall,
      meetsFRS: raAt55 >= frs,
    };
  }, [projectionData, projectionDerived, currentAge, yearAt55]);

  // Compute top-up impact
  const topUpResult = useMemo(() => {
    if (!currentStatus) return null;

    const { raAt55, frs } = currentStatus;

    // Calculate total top-up with compound interest at SA rate (4%)
    // Each annual top-up grows from start age until 55
    let totalTopUpWithInterest = 0;
    let totalTopUpCash = 0;

    for (let i = 0; i < topUpYears; i++) {
      const topUpAge = startAge + i;
      if (topUpAge >= 55) {
        // After 55, top-up goes to RA at 4% interest
        const yearsToCompound = 0; // Already in RA, no compounding for projection at 55
        totalTopUpWithInterest += annualTopUp;
      } else {
        const yearsToGrow = 55 - topUpAge;
        totalTopUpWithInterest += annualTopUp * Math.pow(1 + SA_RATE, yearsToGrow);
      }
      totalTopUpCash += annualTopUp;
    }

    totalTopUpWithInterest = Math.round(totalTopUpWithInterest);

    const newRA = raAt55 + totalTopUpWithInterest;
    const currentMonthly = getCPFLifeEstimate(raAt55, 'FRS', yearAt55);
    const newMonthly = getCPFLifeEstimate(newRA, 'FRS', yearAt55);
    const monthlyIncrease = newMonthly - currentMonthly;

    // Tax relief: max $8,000/year for self, additional $8,000 for family member
    const selfRelief = Math.min(annualTopUp, 8000);
    const familyRelief = 8000; // Separate cap for family member
    const totalAnnualTaxRelief = selfRelief;
    const totalTaxRelief = totalAnnualTaxRelief * topUpYears;

    return {
      totalTopUpCash,
      totalTopUpWithInterest,
      newRA,
      currentMonthly,
      newMonthly,
      monthlyIncrease,
      selfRelief,
      familyRelief,
      totalAnnualTaxRelief,
      totalTaxRelief,
    };
  }, [currentStatus, annualTopUp, topUpYears, startAge]);

  // Quick button calculations
  const quickTargets = useMemo(() => {
    if (!currentStatus) return {};

    const { raAt55, brs, frs, ers } = currentStatus;
    const maxYears = Math.max(1, 55 - currentAge);

    const calcAnnualForTarget = (target) => {
      const gap = target - raAt55;
      if (gap <= 0) return 0;
      // Solve: sum of annualTopUp * (1.04)^(55 - startAge - i) for i=0..years-1 = gap
      // Geometric series: annualTopUp * sum((1.04)^(years-1-i)) = gap
      let fvFactor = 0;
      for (let i = 0; i < maxYears; i++) {
        fvFactor += Math.pow(1 + SA_RATE, maxYears - 1 - i);
      }
      return fvFactor > 0 ? Math.ceil(gap / fvFactor) : gap;
    };

    return {
      brs: { target: brs, annual: calcAnnualForTarget(brs), years: maxYears },
      frs: { target: frs, annual: calcAnnualForTarget(frs), years: maxYears },
      ers: { target: ers, annual: calcAnnualForTarget(ers), years: maxYears },
    };
  }, [currentStatus, currentAge]);

  const applyQuickTarget = (key) => {
    const t = quickTargets[key];
    if (!t) return;
    setAnnualTopUp(t.annual);
    setTopUpYears(t.years);
    setStartAge(currentAge);
  };

  if (!currentStatus || !topUpResult) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 text-center text-gray-500">
        Run the CPF projection first to see top-up scenarios.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Section 1: Current Status Summary */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          CPF Retirement Sum Topping-Up (RSTU)
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <SummaryCard
            label="Current Age"
            value={currentAge}
            subtext={`Year at 55: ${yearAt55}`}
          />
          <SummaryCard
            label="Projected RA at 55"
            value={formatCurrency(currentStatus.raAt55)}
            subtext="Based on current projection"
          />
          <SummaryCard
            label={`FRS (${yearAt55})`}
            value={formatCurrency(currentStatus.frs)}
            subtext={`BRS: ${formatCurrency(currentStatus.brs)}`}
          />
          <SummaryCard
            label={currentStatus.meetsFRS ? 'Surplus to FRS' : 'Shortfall to FRS'}
            value={formatCurrency(Math.abs(currentStatus.shortfall))}
            color={currentStatus.meetsFRS ? 'text-green-600' : 'text-red-600'}
            subtext={currentStatus.meetsFRS ? 'Exceeds FRS' : 'Below FRS'}
          />
        </div>
      </div>

      {/* Section 2: Cash Top-Up Calculator */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Cash Top-Up Calculator</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Annual Top-Up Amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
              <input
                type="number"
                value={annualTopUp}
                onChange={(e) => setAnnualTopUp(Math.max(0, Number(e.target.value)))}
                className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min={0}
                step={500}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {currentAge < 55 ? 'To Special Account (before 55)' : 'To Retirement Account (after 55)'}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Number of Years
            </label>
            <input
              type="number"
              value={topUpYears}
              onChange={(e) => setTopUpYears(Math.max(1, Math.min(40, Number(e.target.value))))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              min={1}
              max={40}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Start Age
            </label>
            <input
              type="number"
              value={startAge}
              onChange={(e) => setStartAge(Math.max(currentAge, Math.min(70, Number(e.target.value))))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              min={currentAge}
              max={70}
            />
          </div>
        </div>

        {/* Computed Results */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-500">Total Cash Top-Up</p>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(topUpResult.totalTopUpCash)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Value at 55 (with 4% interest)</p>
              <p className="text-lg font-bold text-blue-600">{formatCurrency(topUpResult.totalTopUpWithInterest)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">New RA at 55</p>
              <p className="text-lg font-bold text-green-600">{formatCurrency(topUpResult.newRA)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">New CPF Life Monthly</p>
              <p className="text-lg font-bold text-green-600">{formatCurrency(topUpResult.newMonthly)}/mo</p>
            </div>
          </div>
          <div className="border-t border-gray-200 pt-3 flex flex-wrap gap-6">
            <div>
              <p className="text-xs text-gray-500">Monthly Payout Increase</p>
              <p className="text-sm font-semibold text-green-600">+{formatCurrency(topUpResult.monthlyIncrease)}/mo</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Tax Relief (Self, per year)</p>
              <p className="text-sm font-semibold text-blue-600">{formatCurrency(topUpResult.selfRelief)}/yr</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Additional Relief (Family Member)</p>
              <p className="text-sm font-semibold text-blue-600">Up to {formatCurrency(topUpResult.familyRelief)}/yr</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Tax Relief ({topUpYears} yrs, self)</p>
              <p className="text-sm font-semibold text-blue-600">{formatCurrency(topUpResult.totalTaxRelief)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Impact Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ImpactCard
          title="Without Top-Up"
          borderColor="border-gray-300"
          items={[
            { label: 'RA at 55', value: formatCurrency(currentStatus.raAt55) },
            { label: 'CPF Life Monthly', value: formatCurrency(topUpResult.currentMonthly) },
            { label: 'Meets FRS?', value: currentStatus.meetsFRS ? 'Yes' : 'No', color: currentStatus.meetsFRS ? 'text-green-600' : 'text-red-600' },
          ]}
        />
        <ImpactCard
          title="With Top-Up"
          borderColor="border-blue-500"
          items={[
            { label: 'RA at 55', value: formatCurrency(topUpResult.newRA), color: 'text-blue-600' },
            { label: 'CPF Life Monthly', value: formatCurrency(topUpResult.newMonthly), color: 'text-blue-600' },
            { label: 'Meets FRS?', value: topUpResult.newRA >= currentStatus.frs ? 'Yes' : 'No', color: topUpResult.newRA >= currentStatus.frs ? 'text-green-600' : 'text-red-600' },
          ]}
        />
        <ImpactCard
          title="Difference"
          borderColor="border-green-500"
          items={[
            { label: 'Extra Monthly Income', value: `+${formatCurrency(topUpResult.monthlyIncrease)}`, color: 'text-green-600' },
            { label: 'Total Top-Up Cost', value: formatCurrency(topUpResult.totalTopUpCash) },
            { label: 'Tax Savings (Self)', value: formatCurrency(topUpResult.totalTaxRelief), color: 'text-green-600' },
          ]}
        />
      </div>

      {/* Section 4: Quick Target Buttons */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Quick Top-Up Targets</h3>
        <p className="text-sm text-gray-500 mb-4">
          Calculate the annual top-up needed to reach each retirement sum target by age 55.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* BRS */}
          <button
            onClick={() => applyQuickTarget('brs')}
            disabled={quickTargets.brs?.annual === 0}
            className={`text-left p-4 rounded-lg border-2 transition-colors ${
              quickTargets.brs?.annual === 0
                ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                : 'border-blue-200 bg-blue-50 hover:bg-blue-100 hover:border-blue-400 cursor-pointer'
            }`}
          >
            <p className="text-sm font-semibold">Top up to BRS</p>
            <p className="text-xs text-gray-500 mt-1">Target: {formatCurrency(currentStatus.brs)}</p>
            <p className="text-lg font-bold text-blue-600 mt-2">
              {quickTargets.brs?.annual === 0
                ? 'Already met'
                : `${formatCurrency(quickTargets.brs?.annual)}/yr`}
            </p>
            {quickTargets.brs?.annual > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                for {quickTargets.brs?.years} years from age {currentAge}
              </p>
            )}
          </button>

          {/* FRS */}
          <button
            onClick={() => applyQuickTarget('frs')}
            disabled={quickTargets.frs?.annual === 0}
            className={`text-left p-4 rounded-lg border-2 transition-colors ${
              quickTargets.frs?.annual === 0
                ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                : 'border-green-200 bg-green-50 hover:bg-green-100 hover:border-green-400 cursor-pointer'
            }`}
          >
            <p className="text-sm font-semibold">Top up to FRS</p>
            <p className="text-xs text-gray-500 mt-1">Target: {formatCurrency(currentStatus.frs)}</p>
            <p className="text-lg font-bold text-green-600 mt-2">
              {quickTargets.frs?.annual === 0
                ? 'Already met'
                : `${formatCurrency(quickTargets.frs?.annual)}/yr`}
            </p>
            {quickTargets.frs?.annual > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                for {quickTargets.frs?.years} years from age {currentAge}
              </p>
            )}
          </button>

          {/* ERS */}
          <button
            onClick={() => applyQuickTarget('ers')}
            disabled={quickTargets.ers?.annual === 0}
            className={`text-left p-4 rounded-lg border-2 transition-colors ${
              quickTargets.ers?.annual === 0
                ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                : 'border-purple-200 bg-purple-50 hover:bg-purple-100 hover:border-purple-400 cursor-pointer'
            }`}
          >
            <p className="text-sm font-semibold">Top up to ERS</p>
            <p className="text-xs text-gray-500 mt-1">Target: {formatCurrency(currentStatus.ers)}</p>
            <p className="text-lg font-bold text-purple-600 mt-2">
              {quickTargets.ers?.annual === 0
                ? 'Already met'
                : `${formatCurrency(quickTargets.ers?.annual)}/yr`}
            </p>
            {quickTargets.ers?.annual > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                for {quickTargets.ers?.years} years from age {currentAge}
              </p>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
