import { useState, useMemo } from 'react';

// ---------------------------------------------------------------------------
// Default row factories
// ---------------------------------------------------------------------------
const newSavingsPlan = () => ({
  maturityAge: '',
  maturityValue: '',
  company: '',
  policyNo: '',
  policyType: '',
  annualPremium: '',
  remarks: '',
});

const newInvestmentPlan = () => ({
  surrenderAge: '',
  projectedFV: '',
  currentAmount: '',
  assumedReturn: '',
  name: '',
  originalAmount: '',
  investedSince: '',
});

const newRentalIncome = () => ({
  propertyName: '',
  monthlyRental: '',
  inflationRate: '',
  loanOffset: '',
  loanExpiredAge: '',
});

const newPayoutPlan = () => ({
  name: '',
  startAge: 55,
  endAge: 100,
  annualAmount: '',
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const num = (v) => {
  const n = parseFloat(v);
  return isNaN(n) ? 0 : n;
};

const fmt = (v) =>
  v === 0
    ? ''
    : v.toLocaleString('en-SG', { maximumFractionDigits: 0 });

// ---------------------------------------------------------------------------
// Shared sub-components
// ---------------------------------------------------------------------------
function SectionCard({ title, children }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-t-lg px-4 py-3">
        <h3 className="text-white font-semibold text-sm tracking-wide">
          {title}
        </h3>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function AddRowButton({ onClick, disabled, label = 'Add Row' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 transition disabled:opacity-40 disabled:cursor-not-allowed"
    >
      <svg
        className="h-3.5 w-3.5"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
      </svg>
      {label}
    </button>
  );
}

function RemoveButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-red-400 hover:text-red-600 transition p-0.5"
      title="Remove row"
    >
      <svg
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
        />
      </svg>
    </button>
  );
}

function CellInput({ value, onChange, type = 'text', placeholder = '', className = '', min, max, step }) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      min={min}
      max={max}
      step={step}
      className={`w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none ${className}`}
    />
  );
}

const thClass = 'px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap bg-gray-50 border-b border-gray-200';
const tdClass = 'px-3 py-2 align-top';

// ---------------------------------------------------------------------------
// Table 1 -- Savings / Insurance Plans
// ---------------------------------------------------------------------------
function SavingsPlansTable({ rows, onChange, onAdd, onRemove, maxRows = 12 }) {
  const columns = [
    { key: 'maturityAge', label: 'Maturity Age', type: 'number', w: 'w-24', placeholder: 'e.g. 65' },
    { key: 'maturityValue', label: 'Maturity / Surrender Value', type: 'number', w: 'w-36', placeholder: '$' },
    { key: 'company', label: 'Company', type: 'text', w: 'w-32', placeholder: '' },
    { key: 'policyNo', label: 'Policy No', type: 'text', w: 'w-28', placeholder: '' },
    { key: 'policyType', label: 'Policy Type', type: 'text', w: 'w-28', placeholder: '' },
    { key: 'annualPremium', label: 'Annual Premium', type: 'number', w: 'w-32', placeholder: '$' },
    { key: 'remarks', label: 'Remarks', type: 'text', w: 'w-36', placeholder: '' },
  ];

  return (
    <SectionCard title="Table 1 -- Savings / Insurance Plans (Single Output)">
      <div className="overflow-x-auto -mx-4 px-4">
        <table className="min-w-full text-sm">
          <thead>
            <tr>
              <th className={`${thClass} w-8`}>#</th>
              {columns.map((c) => (
                <th key={c.key} className={`${thClass} ${c.w}`}>{c.label}</th>
              ))}
              <th className={`${thClass} w-10`} />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((row, i) => (
              <tr key={i} className="hover:bg-gray-50/60">
                <td className={`${tdClass} text-xs text-gray-400 font-mono`}>{i + 1}</td>
                {columns.map((c) => (
                  <td key={c.key} className={tdClass}>
                    <CellInput
                      type={c.type}
                      value={row[c.key]}
                      placeholder={c.placeholder}
                      onChange={(e) => onChange(i, c.key, e.target.value)}
                    />
                  </td>
                ))}
                <td className={tdClass}>
                  <RemoveButton onClick={() => onRemove(i)} />
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={columns.length + 2} className="px-3 py-6 text-center text-gray-400 text-sm">
                  No savings plans added yet. Click "Add Row" to begin.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <AddRowButton onClick={onAdd} disabled={rows.length >= maxRows} />
      {rows.length > 0 && (
        <span className="ml-3 text-xs text-gray-400">{rows.length} / {maxRows} rows</span>
      )}
    </SectionCard>
  );
}

// ---------------------------------------------------------------------------
// Table 2 -- Investment Plans
// ---------------------------------------------------------------------------
function InvestmentPlansTable({ rows, onChange, onAdd, onRemove, maxRows = 10 }) {
  const columns = [
    { key: 'surrenderAge', label: 'Surrender Age', type: 'number', w: 'w-24', placeholder: 'e.g. 65' },
    { key: 'projectedFV', label: 'Projected FV', type: 'number', w: 'w-32', placeholder: '$' },
    { key: 'currentAmount', label: 'Current Amount', type: 'number', w: 'w-32', placeholder: '$' },
    { key: 'assumedReturn', label: 'Assumed Return %', type: 'number', w: 'w-28', placeholder: '%', step: '0.1' },
    { key: 'name', label: 'Name', type: 'text', w: 'w-32', placeholder: '' },
    { key: 'originalAmount', label: 'Original Amount', type: 'number', w: 'w-32', placeholder: '$' },
    { key: 'investedSince', label: 'Invested Since', type: 'text', w: 'w-28', placeholder: 'e.g. 2020' },
  ];

  return (
    <SectionCard title="Table 2 -- Investment Plans (Single Output)">
      <div className="overflow-x-auto -mx-4 px-4">
        <table className="min-w-full text-sm">
          <thead>
            <tr>
              <th className={`${thClass} w-8`}>#</th>
              {columns.map((c) => (
                <th key={c.key} className={`${thClass} ${c.w}`}>{c.label}</th>
              ))}
              <th className={`${thClass} w-10`} />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((row, i) => (
              <tr key={i} className="hover:bg-gray-50/60">
                <td className={`${tdClass} text-xs text-gray-400 font-mono`}>{i + 1}</td>
                {columns.map((c) => (
                  <td key={c.key} className={tdClass}>
                    <CellInput
                      type={c.type}
                      value={row[c.key]}
                      placeholder={c.placeholder}
                      step={c.step}
                      onChange={(e) => onChange(i, c.key, e.target.value)}
                    />
                  </td>
                ))}
                <td className={tdClass}>
                  <RemoveButton onClick={() => onRemove(i)} />
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={columns.length + 2} className="px-3 py-6 text-center text-gray-400 text-sm">
                  No investment plans added yet. Click "Add Row" to begin.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <AddRowButton onClick={onAdd} disabled={rows.length >= maxRows} />
      {rows.length > 0 && (
        <span className="ml-3 text-xs text-gray-400">{rows.length} / {maxRows} rows</span>
      )}
    </SectionCard>
  );
}

// ---------------------------------------------------------------------------
// Table 3 -- Rental / Business Income
// ---------------------------------------------------------------------------
function RentalIncomeTable({ rows, onChange, onAdd, onRemove, maxRows = 5 }) {
  const columns = [
    { key: 'propertyName', label: 'Property Name', type: 'text', w: 'w-36', placeholder: '' },
    { key: 'monthlyRental', label: 'Monthly Rental', type: 'number', w: 'w-32', placeholder: '$' },
    { key: 'inflationRate', label: 'Inflation %', type: 'number', w: 'w-24', placeholder: '%', step: '0.1' },
    { key: 'loanOffset', label: 'Loan Offset', type: 'number', w: 'w-32', placeholder: '$' },
    { key: 'loanExpiredAge', label: 'Loan Expired Age', type: 'number', w: 'w-28', placeholder: 'e.g. 65' },
  ];

  return (
    <SectionCard title="Table 3 -- Rental / Business Income">
      <div className="overflow-x-auto -mx-4 px-4">
        <table className="min-w-full text-sm">
          <thead>
            <tr>
              <th className={`${thClass} w-8`}>#</th>
              {columns.map((c) => (
                <th key={c.key} className={`${thClass} ${c.w}`}>{c.label}</th>
              ))}
              <th className={`${thClass} w-10`} />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((row, i) => (
              <tr key={i} className="hover:bg-gray-50/60">
                <td className={`${tdClass} text-xs text-gray-400 font-mono`}>{i + 1}</td>
                {columns.map((c) => (
                  <td key={c.key} className={tdClass}>
                    <CellInput
                      type={c.type}
                      value={row[c.key]}
                      placeholder={c.placeholder}
                      step={c.step}
                      onChange={(e) => onChange(i, c.key, e.target.value)}
                    />
                  </td>
                ))}
                <td className={tdClass}>
                  <RemoveButton onClick={() => onRemove(i)} />
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={columns.length + 2} className="px-3 py-6 text-center text-gray-400 text-sm">
                  No rental income added yet. Click "Add Row" to begin.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <AddRowButton onClick={onAdd} disabled={rows.length >= maxRows} />
      {rows.length > 0 && (
        <span className="ml-3 text-xs text-gray-400">{rows.length} / {maxRows} rows</span>
      )}
    </SectionCard>
  );
}

// ---------------------------------------------------------------------------
// Table 4 -- Regular Payout Plans
// ---------------------------------------------------------------------------
const AGES = Array.from({ length: 46 }, (_, i) => 55 + i); // 55..100

function RegularPayoutPlans({ plans, setPlans }) {
  const [draft, setDraft] = useState(newPayoutPlan());

  // Compute totals by age across all plans
  const totalsByAge = useMemo(() => {
    const totals = {};
    AGES.forEach((age) => {
      totals[age] = 0;
    });
    plans.forEach((p) => {
      const amt = num(p.annualAmount);
      for (let age = p.startAge; age <= p.endAge; age++) {
        if (totals[age] !== undefined) {
          totals[age] += amt;
        }
      }
    });
    return totals;
  }, [plans]);

  const handleAddPlan = () => {
    if (!draft.name || !draft.annualAmount) return;
    setPlans([...plans, { ...draft }]);
    setDraft(newPayoutPlan());
  };

  const handleRemovePlan = (idx) => {
    setPlans(plans.filter((_, i) => i !== idx));
  };

  return (
    <SectionCard title="Table 4 -- Regular Payout Plans (Annual Payouts by Age)">
      {/* Plan entry form */}
      <div className="mb-4">
        <p className="text-xs text-gray-500 mb-2">
          Add named payout plans with a start age, end age, and annual amount. The summary table below auto-calculates totals.
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Plan Name</label>
            <input
              type="text"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder="e.g. CPF LIFE"
              className="border border-gray-300 rounded px-2 py-1.5 text-sm w-36 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Start Age</label>
            <input
              type="number"
              value={draft.startAge}
              min={55}
              max={100}
              onChange={(e) => setDraft({ ...draft, startAge: parseInt(e.target.value) || 55 })}
              className="border border-gray-300 rounded px-2 py-1.5 text-sm w-20 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">End Age</label>
            <input
              type="number"
              value={draft.endAge}
              min={55}
              max={100}
              onChange={(e) => setDraft({ ...draft, endAge: parseInt(e.target.value) || 100 })}
              className="border border-gray-300 rounded px-2 py-1.5 text-sm w-20 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Annual Amount</label>
            <input
              type="number"
              value={draft.annualAmount}
              onChange={(e) => setDraft({ ...draft, annualAmount: e.target.value })}
              placeholder="$"
              className="border border-gray-300 rounded px-2 py-1.5 text-sm w-32 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          <button
            type="button"
            onClick={handleAddPlan}
            disabled={!draft.name || !draft.annualAmount}
            className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Plan
          </button>
        </div>
      </div>

      {/* Active plans list */}
      {plans.length > 0 && (
        <div className="mb-4">
          <table className="min-w-full text-sm mb-2">
            <thead>
              <tr>
                <th className={thClass}>Plan Name</th>
                <th className={thClass}>Start Age</th>
                <th className={thClass}>End Age</th>
                <th className={thClass}>Annual Amount</th>
                <th className={`${thClass} w-10`} />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {plans.map((p, i) => (
                <tr key={i} className="hover:bg-gray-50/60">
                  <td className={tdClass}>{p.name}</td>
                  <td className={tdClass}>{p.startAge}</td>
                  <td className={tdClass}>{p.endAge}</td>
                  <td className={`${tdClass} font-mono`}>
                    ${fmt(num(p.annualAmount))}
                  </td>
                  <td className={tdClass}>
                    <RemoveButton onClick={() => handleRemovePlan(i)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Age-based summary grid */}
      {plans.length > 0 && (
        <div className="overflow-x-auto -mx-4 px-4">
          <p className="text-xs font-medium text-gray-600 mb-2">Total Annual Payout by Age</p>
          <table className="min-w-full text-xs border border-gray-200 rounded">
            <thead>
              <tr>
                <th className="px-2 py-1.5 bg-gray-50 border-b border-r border-gray-200 text-left font-semibold text-gray-600 sticky left-0 bg-gray-50 z-10">
                  Age
                </th>
                {AGES.map((age) => (
                  <th
                    key={age}
                    className="px-2 py-1.5 bg-gray-50 border-b border-gray-200 text-center font-medium text-gray-500 min-w-[52px]"
                  >
                    {age}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Per-plan rows */}
              {plans.map((p, i) => (
                <tr key={i}>
                  <td className="px-2 py-1 border-r border-gray-200 font-medium text-gray-600 whitespace-nowrap sticky left-0 bg-white z-10">
                    {p.name}
                  </td>
                  {AGES.map((age) => {
                    const active = age >= p.startAge && age <= p.endAge;
                    return (
                      <td
                        key={age}
                        className={`px-2 py-1 text-center font-mono ${
                          active ? 'text-gray-700' : 'text-gray-300'
                        }`}
                      >
                        {active ? fmt(num(p.annualAmount)) : '-'}
                      </td>
                    );
                  })}
                </tr>
              ))}
              {/* Totals row */}
              <tr className="border-t-2 border-blue-200 bg-blue-50/50">
                <td className="px-2 py-1.5 border-r border-gray-200 font-semibold text-blue-700 sticky left-0 bg-blue-50 z-10">
                  Total
                </td>
                {AGES.map((age) => (
                  <td
                    key={age}
                    className={`px-2 py-1.5 text-center font-mono font-semibold ${
                      totalsByAge[age] > 0 ? 'text-blue-700' : 'text-gray-300'
                    }`}
                  >
                    {totalsByAge[age] > 0 ? fmt(totalsByAge[age]) : '-'}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {plans.length === 0 && (
        <p className="text-center text-gray-400 text-sm py-4">
          No payout plans added yet. Use the form above to add a plan.
        </p>
      )}
    </SectionCard>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function PortfolioInput({ inputs, setInputs }) {
  // Generic array field helpers
  const updateRow = (field) => (idx, key, value) => {
    setInputs((prev) => {
      const updated = [...prev[field]];
      updated[idx] = { ...updated[idx], [key]: value };
      return { ...prev, [field]: updated };
    });
  };

  const addRow = (field, factory, maxRows) => () => {
    setInputs((prev) => {
      if (prev[field].length >= maxRows) return prev;
      return { ...prev, [field]: [...prev[field], factory()] };
    });
  };

  const removeRow = (field) => (idx) => {
    setInputs((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== idx),
    }));
  };

  const setRegularPayouts = (plans) => {
    setInputs((prev) => ({ ...prev, regularPayouts: plans }));
  };

  return (
    <div className="space-y-2">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-gray-800">Current Portfolio</h2>
        <p className="text-sm text-gray-500">
          Enter your existing savings, investments, rental income, and regular payout plans.
        </p>
      </div>

      <SavingsPlansTable
        rows={inputs.savingsPlans}
        onChange={updateRow('savingsPlans')}
        onAdd={addRow('savingsPlans', newSavingsPlan, 12)}
        onRemove={removeRow('savingsPlans')}
        maxRows={12}
      />

      <InvestmentPlansTable
        rows={inputs.investmentPlans}
        onChange={updateRow('investmentPlans')}
        onAdd={addRow('investmentPlans', newInvestmentPlan, 10)}
        onRemove={removeRow('investmentPlans')}
        maxRows={10}
      />

      <RentalIncomeTable
        rows={inputs.rentalIncome}
        onChange={updateRow('rentalIncome')}
        onAdd={addRow('rentalIncome', newRentalIncome, 5)}
        onRemove={removeRow('rentalIncome')}
        maxRows={5}
      />

      <RegularPayoutPlans
        plans={inputs.regularPayouts}
        setPlans={setRegularPayouts}
      />
    </div>
  );
}
