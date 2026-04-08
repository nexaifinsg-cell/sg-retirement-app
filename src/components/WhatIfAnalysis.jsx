import { useState, useMemo } from 'react';
import { formatCurrency } from '../utils/formatters';
import { formatAge, getYearAt55 } from '../utils/formatters';
import { getFRS } from '../engine/frsData';
import { runCPFProjection, getBalancesAtAge } from '../engine/cpfProjection';
import { runRetirementCashflow, getCPFLifeEstimate } from '../engine/retirementCashflow';

function SliderControl({ label, value, min, max, step, onChange, format }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-gray-600">{label}</label>
        <span className="text-sm font-bold text-gray-900">{format(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
      />
      <div className="flex justify-between text-xs text-gray-400">
        <span>{format(min)}</span>
        <span>{format(max)}</span>
      </div>
    </div>
  );
}

function DiffCell({ current, scenario, isCurrency = true, suffix = '' }) {
  const diff = scenario - current;
  const isPositive = diff > 0;
  const isNegative = diff < 0;
  const fmt = isCurrency ? formatCurrency : (v) => `${v}`;

  return (
    <td className="px-4 py-3 text-sm text-right">
      <span
        className={`font-semibold ${
          isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-gray-500'
        }`}
      >
        {isPositive ? '+' : ''}{fmt(diff)}{suffix}
      </span>
    </td>
  );
}

export default function WhatIfAnalysis({ inputs, projectionData, cashflowData, projectionDerived }) {
  const currentAge = formatAge(inputs?.dob);
  const yearAt55 = getYearAt55(inputs?.dob);

  // Scenario state initialized from current inputs
  const [scenarioSalary, setScenarioSalary] = useState(inputs?.monthlySalary || 5000);
  const [scenarioIncrement, setScenarioIncrement] = useState((inputs?.salaryIncrement || 0.03) * 100);
  const [scenarioReturn, setScenarioReturn] = useState((inputs?.investmentReturn || 0.025) * 100);
  const [scenarioIncome, setScenarioIncome] = useState(inputs?.desiredMonthlyIncome || 3000);

  const salaryMin = Math.round((inputs?.monthlySalary || 5000) * 0.5);
  const salaryMax = Math.round((inputs?.monthlySalary || 5000) * 2);

  const resetToCurrents = () => {
    setScenarioSalary(inputs?.monthlySalary || 5000);
    setScenarioIncrement((inputs?.salaryIncrement || 0.03) * 100);
    setScenarioReturn((inputs?.investmentReturn || 0.025) * 100);
    setScenarioIncome(inputs?.desiredMonthlyIncome || 3000);
  };

  // Current values from existing projection
  const currentMetrics = useMemo(() => {
    if (!projectionData || projectionData.length === 0) return null;

    const at55 = getBalancesAtAge(projectionData, 55);
    const frs = getFRS(yearAt55);
    const raAt55 = projectionDerived?.raBalance ?? at55.raBalance ?? 0;
    const oaSaAt55 = (at55.oaBalance ?? 0) + (at55.saBalance ?? 0);
    const totalAt55 = at55.totalBalance ?? 0;
    const canMeetFRS = raAt55 >= frs;
    const cpfLifeMonthly = getCPFLifeEstimate(raAt55, 'FRS', yearAt55);
    const excessCPF = projectionDerived?.excessCPF ?? 0;

    // Fund lasts
    let fundYears = 0;
    if (cashflowData && cashflowData.length > 0) {
      const deficitIdx = cashflowData.findIndex((r) => r.endBalance < 0);
      fundYears = deficitIdx === -1 ? 35 : deficitIdx;
    }

    // Retirement fund at 55 (excess above RA)
    const retirementFund = excessCPF;

    return {
      totalAt55,
      oaSaAt55,
      raAt55,
      canMeetFRS,
      cpfLifeMonthly,
      fundYears,
      retirementFund,
      frs,
    };
  }, [projectionData, projectionDerived, cashflowData, yearAt55]);

  // Scenario projection
  const scenarioMetrics = useMemo(() => {
    if (!inputs) return null;

    try {
      const modifiedInputs = {
        ...inputs,
        monthlySalary: scenarioSalary,
        salaryIncrement: scenarioIncrement / 100,
      };

      const scenarioProjection = runCPFProjection(modifiedInputs);
      if (!scenarioProjection || scenarioProjection.length === 0) return null;

      const at55 = getBalancesAtAge(scenarioProjection, 55);
      const frs = getFRS(yearAt55);

      // Compute RA at 55
      const raAt55 = at55.raBalance ?? 0;
      const oaSaAt55 = (at55.oaBalance ?? 0) + (at55.saBalance ?? 0);
      const totalAt55 = at55.totalBalance ?? 0;
      const canMeetFRS = raAt55 >= frs;
      const cpfLifeMonthly = getCPFLifeEstimate(raAt55, 'FRS', yearAt55);

      // Compute excess CPF (OA + SA after FRS is set aside)
      const excessCPF = Math.max(0, oaSaAt55);

      // Run cashflow with modified params
      const scenarioCashflow = runRetirementCashflow({
        dob: inputs.dob,
        projectionData: scenarioProjection,
        desiredMonthlyIncome: scenarioIncome,
        cpfLifePayout: cpfLifeMonthly,
        cpfLifeStartAge: 65,
        investmentReturn: scenarioReturn / 100,
        inflationRate: inputs.inflationRate || 0.03,
        savingsPlans: inputs.savingsPlans || [],
        investmentPlans: inputs.investmentPlans || [],
        rentalIncome: inputs.rentalIncome || [],
        regularPayouts: inputs.regularPayouts || [],
        excessCPF,
        raBalance: raAt55,
        bornBefore1975: inputs.bornBefore1975 || false,
      });

      let fundYears = 0;
      if (scenarioCashflow && scenarioCashflow.length > 0) {
        const deficitIdx = scenarioCashflow.findIndex((r) => r.endBalance < 0);
        fundYears = deficitIdx === -1 ? 35 : deficitIdx;
      }

      return {
        totalAt55,
        oaSaAt55,
        raAt55,
        canMeetFRS,
        cpfLifeMonthly,
        fundYears,
        retirementFund: excessCPF,
        frs,
      };
    } catch {
      return null;
    }
  }, [inputs, scenarioSalary, scenarioIncrement, scenarioReturn, scenarioIncome, yearAt55]);

  if (!currentMetrics) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 text-center text-gray-500">
        Run the CPF projection first to use the What-If analysis.
      </div>
    );
  }

  const metrics = scenarioMetrics || currentMetrics;

  const rows = [
    {
      label: 'Total CPF at 55',
      current: currentMetrics.totalAt55,
      scenario: metrics.totalAt55,
      isCurrency: true,
    },
    {
      label: 'OA+SA at 55',
      current: currentMetrics.oaSaAt55,
      scenario: metrics.oaSaAt55,
      isCurrency: true,
    },
    {
      label: 'RA at 55',
      current: currentMetrics.raAt55,
      scenario: metrics.raAt55,
      isCurrency: true,
    },
    {
      label: 'Can Meet FRS?',
      current: currentMetrics.canMeetFRS,
      scenario: metrics.canMeetFRS,
      isBool: true,
    },
    {
      label: 'CPF Life Monthly',
      current: currentMetrics.cpfLifeMonthly,
      scenario: metrics.cpfLifeMonthly,
      isCurrency: true,
    },
    {
      label: 'Fund Lasts (years)',
      current: currentMetrics.fundYears,
      scenario: metrics.fundYears,
      isCurrency: false,
      suffix: ' yrs',
    },
    {
      label: 'Retirement Fund at 55',
      current: currentMetrics.retirementFund,
      scenario: metrics.retirementFund,
      isCurrency: true,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Scenario Controls */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-gray-800">What-If Analysis</h3>
          <button
            onClick={resetToCurrents}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium px-3 py-1.5 rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors"
          >
            Reset to Current
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SliderControl
            label="Monthly Salary"
            value={scenarioSalary}
            min={salaryMin}
            max={salaryMax}
            step={500}
            onChange={setScenarioSalary}
            format={(v) => formatCurrency(v)}
          />
          <SliderControl
            label="Salary Increment"
            value={scenarioIncrement}
            min={0}
            max={8}
            step={0.5}
            onChange={setScenarioIncrement}
            format={(v) => `${v.toFixed(1)}%`}
          />
          <SliderControl
            label="Investment Return"
            value={scenarioReturn}
            min={0}
            max={8}
            step={0.5}
            onChange={setScenarioReturn}
            format={(v) => `${v.toFixed(1)}%`}
          />
          <SliderControl
            label="Desired Monthly Income"
            value={scenarioIncome}
            min={1000}
            max={10000}
            step={500}
            onChange={setScenarioIncome}
            format={(v) => formatCurrency(v)}
          />
        </div>
      </div>

      {/* Comparison Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Side-by-Side Comparison
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Metric
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Current
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-blue-600 uppercase tracking-wide">
                  Scenario
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Difference
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((row, i) => (
                <tr key={i} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-gray-700">{row.label}</td>
                  <td className="px-4 py-3 text-sm text-right text-gray-900">
                    {row.isBool
                      ? (
                        <span className={row.current ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                          {row.current ? 'Yes' : 'No'}
                        </span>
                      )
                      : row.isCurrency
                        ? formatCurrency(row.current)
                        : `${row.current}${row.suffix || ''}`}
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-semibold text-blue-700">
                    {row.isBool
                      ? (
                        <span className={row.scenario ? 'text-green-600' : 'text-red-600'}>
                          {row.scenario ? 'Yes' : 'No'}
                        </span>
                      )
                      : row.isCurrency
                        ? formatCurrency(row.scenario)
                        : `${row.scenario}${row.suffix || ''}`}
                  </td>
                  {row.isBool ? (
                    <td className="px-4 py-3 text-sm text-right text-gray-400">-</td>
                  ) : (
                    <DiffCell
                      current={row.current}
                      scenario={row.scenario}
                      isCurrency={row.isCurrency}
                      suffix={row.suffix || ''}
                    />
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Insight Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-5 border border-blue-200">
          <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">CPF Life Change</p>
          <p className={`text-2xl font-bold mt-1 ${
            metrics.cpfLifeMonthly >= currentMetrics.cpfLifeMonthly ? 'text-green-700' : 'text-red-700'
          }`}>
            {metrics.cpfLifeMonthly >= currentMetrics.cpfLifeMonthly ? '+' : ''}
            {formatCurrency(metrics.cpfLifeMonthly - currentMetrics.cpfLifeMonthly)}/mo
          </p>
          <p className="text-xs text-blue-600 mt-1">
            From {formatCurrency(currentMetrics.cpfLifeMonthly)} to {formatCurrency(metrics.cpfLifeMonthly)}
          </p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-5 border border-green-200">
          <p className="text-xs font-medium text-green-600 uppercase tracking-wide">Fund Longevity</p>
          <p className={`text-2xl font-bold mt-1 ${
            metrics.fundYears >= currentMetrics.fundYears ? 'text-green-700' : 'text-red-700'
          }`}>
            {metrics.fundYears >= 35 ? '35+' : metrics.fundYears} years
          </p>
          <p className="text-xs text-green-600 mt-1">
            {metrics.fundYears >= currentMetrics.fundYears
              ? `${metrics.fundYears - currentMetrics.fundYears} more years than current`
              : `${currentMetrics.fundYears - metrics.fundYears} fewer years than current`}
          </p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-5 border border-purple-200">
          <p className="text-xs font-medium text-purple-600 uppercase tracking-wide">FRS Status</p>
          <p className={`text-2xl font-bold mt-1 ${metrics.canMeetFRS ? 'text-green-700' : 'text-red-700'}`}>
            {metrics.canMeetFRS ? 'Can Meet FRS' : 'Below FRS'}
          </p>
          <p className="text-xs text-purple-600 mt-1">
            {metrics.canMeetFRS
              ? `Surplus of ${formatCurrency(metrics.raAt55 - metrics.frs)}`
              : `Shortfall of ${formatCurrency(metrics.frs - metrics.raAt55)}`}
          </p>
        </div>
      </div>
    </div>
  );
}
