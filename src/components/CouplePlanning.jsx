import { useState, useMemo } from 'react';
import { runCPFProjection, getBalancesAtAge } from '../engine/cpfProjection';
import { runRetirementCashflow, getCPFLifeEstimate } from '../engine/retirementCashflow';
import { getFRS } from '../engine/frsData';
import { formatCurrency, formatAge, getYearAt55 } from '../utils/formatters';

// ---------------------------------------------------------------------------
// Default spouse inputs
// ---------------------------------------------------------------------------
const DEFAULT_SPOUSE = {
  name: '',
  dob: '',
  gender: 'Female',
  monthlySalary: 0,
  annualBonus: 1,
  salaryIncrement: 0.03,
  statementDate: '',
  oaBalance: 0,
  saBalance: 0,
  maBalance: 0,
  raBalance: 0,
  housingLoan: 0,
  housingTillAge: 0,
  shieldIP: false,
  metFRS: false,
  cpfLifePayout: 0,
  desiredMonthlyIncome: 0,
  investmentReturn: 0.025,
  savingsPlans: [],
  investmentPlans: [],
  rentalIncome: [],
  regularPayouts: [],
};

// ---------------------------------------------------------------------------
// Reusable UI helpers
// ---------------------------------------------------------------------------
function Section({ title, children, color = 'blue' }) {
  const borderColor = color === 'pink' ? 'border-purple-200' : 'border-blue-200';
  const titleColor = color === 'pink' ? 'text-purple-700' : 'text-blue-700';
  const borderBot = color === 'pink' ? 'border-purple-100' : 'border-blue-100';
  return (
    <div className={`bg-white rounded-lg shadow-sm border ${borderColor} p-5 mb-5`}>
      <h3 className={`${titleColor} font-semibold text-base mb-4 pb-2 border-b ${borderBot}`}>
        {title}
      </h3>
      {children}
    </div>
  );
}

function FieldLabel({ children, hint }) {
  return (
    <div className="mb-1">
      <label className="block text-sm font-medium text-gray-700">{children}</label>
      {hint && <p className="text-xs text-gray-400 mt-0.5">{hint}</p>}
    </div>
  );
}

function FieldInput({ type = 'text', value, onChange, prefix, step, min, placeholder }) {
  return (
    <div className="relative">
      {prefix && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">
          {prefix}
        </span>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        step={step}
        min={min}
        placeholder={placeholder}
        className={`w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm
          focus:border-[#1a1a2e] focus:ring-1 focus:ring-[#1a1a2e] focus:outline-none
          ${prefix ? 'pl-7' : ''}`}
      />
    </div>
  );
}

function SummaryCard({ label, value, subtext, color }) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
      <p className={`text-xl font-bold mt-1 ${color || 'text-gray-900'}`}>{value}</p>
      {subtext && <p className="text-xs text-gray-500 mt-1">{subtext}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function CouplePlanning({ inputs, projectionData, cashflowData, projectionDerived }) {
  const [spouse, setSpouse] = useState(DEFAULT_SPOUSE);
  const [jointDesiredIncome, setJointDesiredIncome] = useState(0);

  const handleSpouse = (field) => (e) => {
    const val =
      e.target.type === 'checkbox'
        ? e.target.checked
        : e.target.type === 'number'
        ? parseFloat(e.target.value) || 0
        : e.target.value;
    setSpouse((prev) => ({ ...prev, [field]: val }));
  };

  // -----------------------------------------------------------------------
  // Client 1 derived data (from props)
  // -----------------------------------------------------------------------
  const client1Name = inputs.name || 'Client 1';
  const client1Age = inputs.dob ? formatAge(inputs.dob) : null;
  const client1At55 = useMemo(() => {
    if (!projectionData || projectionData.length === 0) return null;
    return getBalancesAtAge(projectionData, 55);
  }, [projectionData]);

  const client1YearAt55 = getYearAt55(inputs.dob);
  const client1FRS = getFRS(client1YearAt55);
  const client1Excess = projectionDerived?.excessCPF || 0;
  const client1CPFLife = projectionDerived?.estimatedCPFLife || 0;

  // -----------------------------------------------------------------------
  // Spouse projection
  // -----------------------------------------------------------------------
  const canProjectSpouse = Boolean(spouse.dob && spouse.statementDate);
  const spouseName = spouse.name || 'Spouse';

  const spouseProjection = useMemo(() => {
    if (!canProjectSpouse) return null;
    try {
      return runCPFProjection(spouse);
    } catch {
      return null;
    }
  }, [spouse, canProjectSpouse]);

  const spouseDerived = useMemo(() => {
    if (!spouseProjection || spouseProjection.length === 0) {
      return { excessCPF: 0, estimatedCPFLife: 0, raBalance: 0 };
    }
    const at55 = getBalancesAtAge(spouseProjection, 55);
    const yearAt55 = getYearAt55(spouse.dob);
    const oaSa = at55.oaBalance + at55.saBalance;
    const excessCPF = Math.max(0, oaSa);
    const estimatedCPFLife =
      spouse.cpfLifePayout > 0
        ? spouse.cpfLifePayout
        : getCPFLifeEstimate(at55.raBalance, 'FRS', yearAt55);
    return { excessCPF, estimatedCPFLife, raBalance: at55.raBalance };
  }, [spouseProjection, spouse.dob, spouse.cpfLifePayout]);

  const spouseAt55 = useMemo(() => {
    if (!spouseProjection || spouseProjection.length === 0) return null;
    return getBalancesAtAge(spouseProjection, 55);
  }, [spouseProjection]);

  // -----------------------------------------------------------------------
  // Combined cashflow
  // -----------------------------------------------------------------------
  const combinedCashflow = useMemo(() => {
    if (!projectionData || !spouseProjection) return null;
    const combinedExcess = client1Excess + spouseDerived.excessCPF;
    const combinedCPFLife = client1CPFLife + spouseDerived.estimatedCPFLife;
    try {
      return runRetirementCashflow({
        dob: inputs.dob, // use client 1's timeline
        projectionData,
        desiredMonthlyIncome: jointDesiredIncome || inputs.desiredMonthlyIncome || 0,
        cpfLifePayout: combinedCPFLife,
        cpfLifeStartAge: 65,
        investmentReturn: inputs.investmentReturn || 0.025,
        inflationRate: 0.03,
        savingsPlans: [...(inputs.savingsPlans || []), ...(spouse.savingsPlans || [])],
        investmentPlans: [...(inputs.investmentPlans || []), ...(spouse.investmentPlans || [])],
        rentalIncome: [...(inputs.rentalIncome || []), ...(spouse.rentalIncome || [])],
        regularPayouts: [...(inputs.regularPayouts || []), ...(spouse.regularPayouts || [])],
        excessCPF: combinedExcess,
        raBalance: (projectionDerived?.raBalance || 0) + spouseDerived.raBalance,
      });
    } catch {
      return null;
    }
  }, [
    projectionData,
    spouseProjection,
    client1Excess,
    spouseDerived,
    client1CPFLife,
    jointDesiredIncome,
    inputs,
    spouse,
    projectionDerived,
  ]);

  const fundLastsYears = useMemo(() => {
    if (!combinedCashflow) return null;
    const deficit = combinedCashflow.find((r) => r.isDeficit);
    if (!deficit) return 'Beyond age 89';
    return `Until age ${deficit.age}`;
  }, [combinedCashflow]);

  // -----------------------------------------------------------------------
  // Survivor analysis
  // -----------------------------------------------------------------------
  const desiredIncome = jointDesiredIncome || inputs.desiredMonthlyIncome || 0;
  const survivorClient1 = {
    cpfLifeMonthly: client1CPFLife,
    pctCovered: desiredIncome > 0 ? (client1CPFLife / desiredIncome) * 100 : 0,
  };
  const survivorSpouse = {
    cpfLifeMonthly: spouseDerived.estimatedCPFLife,
    pctCovered: desiredIncome > 0 ? (spouseDerived.estimatedCPFLife / desiredIncome) * 100 : 0,
  };

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* ================================================================
          SECTION 1: Spouse Details Input
          ================================================================ */}
      <Section title={`Spouse Details`} color="pink">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <FieldLabel>Spouse Name</FieldLabel>
            <FieldInput value={spouse.name} onChange={handleSpouse('name')} placeholder="Full name" />
          </div>
          <div>
            <FieldLabel hint="Used for CPF milestones">Date of Birth</FieldLabel>
            <FieldInput type="date" value={spouse.dob} onChange={handleSpouse('dob')} />
            {spouse.dob && (
              <p className="text-xs text-gray-500 mt-1">Age: {formatAge(spouse.dob)} years old</p>
            )}
          </div>
          <div>
            <FieldLabel>Gender</FieldLabel>
            <select
              value={spouse.gender}
              onChange={handleSpouse('gender')}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-[#1a1a2e] focus:ring-1 focus:ring-[#1a1a2e] focus:outline-none"
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div>
            <FieldLabel>Monthly Salary</FieldLabel>
            <FieldInput
              type="number"
              value={spouse.monthlySalary}
              onChange={handleSpouse('monthlySalary')}
              prefix="$"
              min={0}
            />
          </div>
          <div>
            <FieldLabel hint="Number of months (e.g. 1 = 1 month)">Annual Bonus</FieldLabel>
            <FieldInput
              type="number"
              value={spouse.annualBonus}
              onChange={handleSpouse('annualBonus')}
              step={0.5}
              min={0}
            />
          </div>
          <div>
            <FieldLabel hint="e.g. 0.03 = 3%">Salary Increment</FieldLabel>
            <FieldInput
              type="number"
              value={spouse.salaryIncrement}
              onChange={handleSpouse('salaryIncrement')}
              step={0.01}
              min={0}
            />
          </div>
        </div>

        <h4 className="text-sm font-semibold text-purple-600 mt-6 mb-3">CPF Balances</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <FieldLabel>CPF Statement Date</FieldLabel>
            <FieldInput type="date" value={spouse.statementDate} onChange={handleSpouse('statementDate')} />
          </div>
          <div>
            <FieldLabel>OA Balance</FieldLabel>
            <FieldInput type="number" value={spouse.oaBalance} onChange={handleSpouse('oaBalance')} prefix="$" min={0} />
          </div>
          <div>
            <FieldLabel>SA Balance</FieldLabel>
            <FieldInput type="number" value={spouse.saBalance} onChange={handleSpouse('saBalance')} prefix="$" min={0} />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div>
            <FieldLabel>MA Balance</FieldLabel>
            <FieldInput type="number" value={spouse.maBalance} onChange={handleSpouse('maBalance')} prefix="$" min={0} />
          </div>
          <div>
            <FieldLabel>RA Balance</FieldLabel>
            <FieldInput type="number" value={spouse.raBalance} onChange={handleSpouse('raBalance')} prefix="$" min={0} />
          </div>
        </div>

        <h4 className="text-sm font-semibold text-purple-600 mt-6 mb-3">Additional Details</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <FieldLabel>Housing Loan (monthly from OA)</FieldLabel>
            <FieldInput
              type="number"
              value={spouse.housingLoan}
              onChange={handleSpouse('housingLoan')}
              prefix="$"
              min={0}
            />
          </div>
          <div>
            <FieldLabel>Housing Loan Till Age</FieldLabel>
            <FieldInput
              type="number"
              value={spouse.housingTillAge}
              onChange={handleSpouse('housingTillAge')}
              min={0}
            />
          </div>
          <div className="flex items-end pb-2">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={spouse.shieldIP}
                onChange={handleSpouse('shieldIP')}
                className="rounded border-gray-300 text-[#1a1a2e] focus:ring-[#1a1a2e]"
              />
              MediShield Life / Shield IP
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <FieldLabel hint="Joint desired monthly income for both of you">
              Joint Monthly Retirement Income
            </FieldLabel>
            <FieldInput
              type="number"
              value={jointDesiredIncome}
              onChange={(e) => setJointDesiredIncome(parseFloat(e.target.value) || 0)}
              prefix="$"
              min={0}
            />
          </div>
        </div>
      </Section>

      {/* ================================================================
          SECTION 2: Combined Projection Summary
          ================================================================ */}
      {projectionData && spouseProjection && (
        <Section title="Combined Projection at Age 55" color="blue">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 pr-4 text-gray-500 font-medium"></th>
                  <th className="text-right py-2 px-4 font-semibold text-blue-700">
                    {client1Name}
                  </th>
                  <th className="text-right py-2 px-4 font-semibold text-purple-700">
                    {spouseName}
                  </th>
                  <th className="text-right py-2 pl-4 font-semibold text-[#1a1a2e]">Combined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="py-2 pr-4 text-gray-600">Total CPF at 55</td>
                  <td className="py-2 px-4 text-right font-medium text-blue-600">
                    {client1At55 ? formatCurrency(client1At55.totalBalance) : '-'}
                  </td>
                  <td className="py-2 px-4 text-right font-medium text-purple-600">
                    {spouseAt55 ? formatCurrency(spouseAt55.totalBalance) : '-'}
                  </td>
                  <td className="py-2 pl-4 text-right font-bold text-[#1a1a2e]">
                    {client1At55 && spouseAt55
                      ? formatCurrency(client1At55.totalBalance + spouseAt55.totalBalance)
                      : '-'}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 text-gray-600">RA at 55</td>
                  <td className="py-2 px-4 text-right font-medium text-blue-600">
                    {client1At55 ? formatCurrency(client1At55.raBalance) : '-'}
                  </td>
                  <td className="py-2 px-4 text-right font-medium text-purple-600">
                    {spouseAt55 ? formatCurrency(spouseAt55.raBalance) : '-'}
                  </td>
                  <td className="py-2 pl-4 text-right font-bold text-[#1a1a2e]">
                    {client1At55 && spouseAt55
                      ? formatCurrency(client1At55.raBalance + spouseAt55.raBalance)
                      : '-'}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 text-gray-600">CPF Life Monthly (est.)</td>
                  <td className="py-2 px-4 text-right font-medium text-blue-600">
                    {formatCurrency(client1CPFLife)}
                  </td>
                  <td className="py-2 px-4 text-right font-medium text-purple-600">
                    {formatCurrency(spouseDerived.estimatedCPFLife)}
                  </td>
                  <td className="py-2 pl-4 text-right font-bold text-[#1a1a2e]">
                    {formatCurrency(client1CPFLife + spouseDerived.estimatedCPFLife)}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 text-gray-600">Excess OA+SA at 55</td>
                  <td className="py-2 px-4 text-right font-medium text-blue-600">
                    {formatCurrency(client1Excess)}
                  </td>
                  <td className="py-2 px-4 text-right font-medium text-purple-600">
                    {formatCurrency(spouseDerived.excessCPF)}
                  </td>
                  <td className="py-2 pl-4 text-right font-bold text-[#1a1a2e]">
                    {formatCurrency(client1Excess + spouseDerived.excessCPF)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {/* No data prompt */}
      {(!projectionData || !spouseProjection) && (
        <div className="text-center py-12 text-gray-400">
          <svg className="mx-auto h-12 w-12 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className="text-sm">
            {!projectionData
              ? 'Complete the Client Details (DOB + Statement Date) to see projections.'
              : 'Enter spouse DOB and CPF Statement Date above to run a combined projection.'}
          </p>
        </div>
      )}

      {/* ================================================================
          SECTION 3: Combined Cashflow
          ================================================================ */}
      {combinedCashflow && (
        <Section title="Combined Retirement Cashflow" color="blue">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <SummaryCard
              label="Combined Fund at 55"
              value={formatCurrency(client1Excess + spouseDerived.excessCPF)}
              color="text-[#1a1a2e]"
            />
            <SummaryCard
              label="Combined CPF Life/month"
              value={formatCurrency(client1CPFLife + spouseDerived.estimatedCPFLife)}
              color="text-green-600"
            />
            <SummaryCard
              label="Joint Desired Income/month"
              value={formatCurrency(desiredIncome)}
              color="text-gray-900"
            />
            <SummaryCard
              label="Combined Fund Lasts"
              value={fundLastsYears || '-'}
              color={
                fundLastsYears === 'Beyond age 89' ? 'text-green-600' : 'text-amber-600'
              }
            />
          </div>

          {/* Compact cashflow table */}
          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-gray-50">
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-2">Age</th>
                  <th className="text-right py-2 px-2">Expenses</th>
                  <th className="text-right py-2 px-2">CPF Life</th>
                  <th className="text-right py-2 px-2">Other Income</th>
                  <th className="text-right py-2 px-2">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {combinedCashflow.map((row) => (
                  <tr
                    key={row.age}
                    className={row.isDeficit ? 'bg-red-50' : ''}
                  >
                    <td className="py-1.5 px-2 font-medium">{row.age}</td>
                    <td className="py-1.5 px-2 text-right text-red-600">
                      {formatCurrency(row.annualExpenses)}
                    </td>
                    <td className="py-1.5 px-2 text-right text-blue-600">
                      {formatCurrency(row.cpfLife)}
                    </td>
                    <td className="py-1.5 px-2 text-right text-green-600">
                      {formatCurrency(row.rentalIncome + row.currentPFIncome + row.lumpSum)}
                    </td>
                    <td
                      className={`py-1.5 px-2 text-right font-medium ${
                        row.endBalance >= 0 ? 'text-green-700' : 'text-red-700'
                      }`}
                    >
                      {formatCurrency(row.endBalance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {/* ================================================================
          SECTION 4: Survivor Analysis
          ================================================================ */}
      {projectionData && spouseProjection && (
        <Section title="Survivor Analysis" color="blue">
          <p className="text-sm text-gray-500 mb-4">
            What happens if one spouse passes first? Shows standalone CPF Life income and coverage.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* If Client 1 passes first */}
            <div className="border border-purple-200 rounded-lg p-5 bg-purple-50/50">
              <h4 className="font-semibold text-purple-700 mb-3">
                If {client1Name} passes first
              </h4>
              <p className="text-sm text-gray-600 mb-1">
                {spouseName}'s standalone CPF Life payout:
              </p>
              <p className="text-2xl font-bold text-purple-700 mb-2">
                {formatCurrency(survivorSpouse.cpfLifeMonthly)}/month
              </p>
              <p className="text-sm text-gray-600 mb-1">Remaining combined fund available</p>
              <p className="text-lg font-semibold text-gray-800 mb-3">
                {formatCurrency(client1Excess + spouseDerived.excessCPF)}
              </p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-purple-600 h-2.5 rounded-full transition-all"
                    style={{ width: `${Math.min(100, survivorSpouse.pctCovered)}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-purple-700">
                  {survivorSpouse.pctCovered.toFixed(0)}%
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">of desired income covered by CPF Life alone</p>
            </div>

            {/* If Spouse passes first */}
            <div className="border border-blue-200 rounded-lg p-5 bg-blue-50/50">
              <h4 className="font-semibold text-blue-700 mb-3">
                If {spouseName} passes first
              </h4>
              <p className="text-sm text-gray-600 mb-1">
                {client1Name}'s standalone CPF Life payout:
              </p>
              <p className="text-2xl font-bold text-blue-700 mb-2">
                {formatCurrency(survivorClient1.cpfLifeMonthly)}/month
              </p>
              <p className="text-sm text-gray-600 mb-1">Remaining combined fund available</p>
              <p className="text-lg font-semibold text-gray-800 mb-3">
                {formatCurrency(client1Excess + spouseDerived.excessCPF)}
              </p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full transition-all"
                    style={{ width: `${Math.min(100, survivorClient1.pctCovered)}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-blue-700">
                  {survivorClient1.pctCovered.toFixed(0)}%
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">of desired income covered by CPF Life alone</p>
            </div>
          </div>
        </Section>
      )}
    </div>
  );
}
