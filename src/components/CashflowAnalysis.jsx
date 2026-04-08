import { useMemo } from 'react';
import { formatCurrency } from '../utils/formatters';
import {
  BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts';

/* ── colour palette ── */
const COLORS = {
  cpfLife: '#3B82F6',
  rental: '#10B981',
  pfIncome: '#F59E0B',
  lumpSum: '#8B5CF6',
  expenses: '#EF4444',
  balancePositive: '#10B981',
  balanceNegative: '#EF4444',
};

/* ── summary card ── */
function SummaryCard({ label, value, subtext, color }) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
      <p className={`text-xl font-bold mt-1 ${color || 'text-gray-900'}`}>{value}</p>
      {subtext && <p className="text-xs text-gray-500 mt-1">{subtext}</p>}
    </div>
  );
}

/* ── chart tooltips ── */
function BalanceTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const val = payload[0]?.value ?? 0;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
      <p className="font-semibold text-gray-700 mb-1">Age {label}</p>
      <p className={val >= 0 ? 'text-green-600' : 'text-red-600'}>
        Balance: {formatCurrency(val)}
      </p>
    </div>
  );
}

function IncomeTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm min-w-[180px]">
      <p className="font-semibold text-gray-700 mb-1">Age {label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} style={{ color: entry.color }}>
          {entry.name}: {formatCurrency(entry.value)}
        </p>
      ))}
    </div>
  );
}

/* ── main component ── */
export default function CashflowAnalysis({ cashflowData, inputs }) {
  /* ── derived summary values ── */
  const summary = useMemo(() => {
    if (!cashflowData || cashflowData.length === 0) return null;

    const firstRow = cashflowData[0];
    const startingFund = firstRow.startBalance;

    // Years fund lasts: count years before endBalance goes negative
    const firstDeficitIdx = cashflowData.findIndex((r) => r.endBalance < 0);
    const yearsLasts = firstDeficitIdx === -1 ? '89+' : firstDeficitIdx;

    const cpfLifeMonthly = inputs?.cpfLifePayout || 0;
    const desiredMonthly = inputs?.desiredMonthlyIncome || 0;
    const cpfLifePercent = desiredMonthly > 0 ? (cpfLifeMonthly / desiredMonthly) * 100 : 0;

    return {
      startingFund,
      yearsLasts,
      cpfLifeMonthly,
      desiredMonthly,
      cpfLifePercent,
    };
  }, [cashflowData, inputs]);

  /* ── balance chart data ── */
  const balanceChartData = useMemo(() => {
    if (!cashflowData) return [];
    return cashflowData.map((row) => ({
      age: row.age,
      balance: row.endBalance,
      positiveBalance: row.endBalance >= 0 ? row.endBalance : 0,
      negativeBalance: row.endBalance < 0 ? row.endBalance : 0,
    }));
  }, [cashflowData]);

  /* ── income chart data ── */
  const incomeChartData = useMemo(() => {
    if (!cashflowData) return [];
    return cashflowData.map((row) => ({
      age: row.age,
      'CPF Life': row.cpfLife,
      'Rental': row.rentalIncome,
      'Portfolio Income': row.currentPFIncome,
      'Lump Sum': row.lumpSum,
      'Expenses': Math.abs(row.annualExpenses),
    }));
  }, [cashflowData]);

  if (!cashflowData || cashflowData.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>No cashflow data available. Please complete the inputs and run the projection.</p>
      </div>
    );
  }

  const cpfPercentColor =
    summary.cpfLifePercent >= 70
      ? 'text-green-600'
      : summary.cpfLifePercent >= 40
        ? 'text-amber-600'
        : 'text-red-600';

  const cpfPercentBg =
    summary.cpfLifePercent >= 70
      ? 'bg-green-100'
      : summary.cpfLifePercent >= 40
        ? 'bg-amber-100'
        : 'bg-red-100';

  return (
    <div className="space-y-6">
      {/* ════════ Summary Cards ════════ */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Retirement Cashflow Summary</h2>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <SummaryCard
            label="Retirement Fund at 55"
            value={formatCurrency(summary.startingFund)}
            subtext="Total investable assets"
          />
          <SummaryCard
            label="Fund Lasts"
            value={typeof summary.yearsLasts === 'number' ? `${summary.yearsLasts} years` : summary.yearsLasts}
            subtext={typeof summary.yearsLasts === 'number' ? `Until age ${55 + summary.yearsLasts}` : 'Sufficient through age 89'}
            color={summary.yearsLasts === '89+' || summary.yearsLasts >= 30 ? 'text-green-600' : 'text-red-600'}
          />
          <SummaryCard
            label="CPF Life Monthly"
            value={formatCurrency(summary.cpfLifeMonthly)}
            subtext={`From age ${inputs?.cpfLifeStartAge || 65}`}
          />
          <SummaryCard
            label="Desired vs Actual"
            value={formatCurrency(summary.desiredMonthly)}
            subtext={`Target monthly income`}
          />
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">CPF Life Coverage</p>
            <p className={`text-xl font-bold mt-1 ${cpfPercentColor}`}>
              {summary.cpfLifePercent.toFixed(1)}%
            </p>
            <div className="mt-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${cpfPercentBg.replace('100', '500')}`}
                  style={{ width: `${Math.min(100, summary.cpfLifePercent)}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">of desired income</p>
            </div>
          </div>
        </div>
      </div>

      {/* ════════ Retirement Fund Balance Chart ════════ */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">Retirement Fund Balance</h2>
          <p className="text-sm text-gray-500 mt-0.5">Projected fund balance from age 55 to 89</p>
        </div>
        <div className="p-4">
          <ResponsiveContainer width="100%" height={380}>
            <AreaChart data={balanceChartData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="gradPositive" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.balancePositive} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={COLORS.balancePositive} stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="gradNegative" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.balanceNegative} stopOpacity={0.05} />
                  <stop offset="95%" stopColor={COLORS.balanceNegative} stopOpacity={0.3} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis
                dataKey="age"
                tick={{ fontSize: 12, fill: '#6B7280' }}
                label={{ value: 'Age', position: 'insideBottom', offset: -2, fontSize: 12, fill: '#9CA3AF' }}
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#6B7280' }}
                tickFormatter={(v) => {
                  if (Math.abs(v) >= 1000000) return `$${(v / 1000000).toFixed(1)}M`;
                  return `$${(v / 1000).toFixed(0)}k`;
                }}
                label={{ value: 'Balance ($)', angle: -90, position: 'insideLeft', offset: 5, fontSize: 12, fill: '#9CA3AF' }}
              />
              <Tooltip content={<BalanceTooltip />} />
              <ReferenceLine y={0} stroke="#374151" strokeWidth={2} />
              <Area
                type="monotone"
                dataKey="positiveBalance"
                name="Surplus"
                stroke={COLORS.balancePositive}
                fill="url(#gradPositive)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="negativeBalance"
                name="Deficit"
                stroke={COLORS.balanceNegative}
                fill="url(#gradNegative)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ════════ Income Sources Chart ════════ */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">Income Sources vs Expenses</h2>
          <p className="text-sm text-gray-500 mt-0.5">Annual income breakdown by source compared to expenses</p>
        </div>
        <div className="p-4">
          <ResponsiveContainer width="100%" height={380}>
            <BarChart data={incomeChartData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis
                dataKey="age"
                tick={{ fontSize: 12, fill: '#6B7280' }}
                label={{ value: 'Age', position: 'insideBottom', offset: -2, fontSize: 12, fill: '#9CA3AF' }}
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#6B7280' }}
                tickFormatter={(v) => {
                  if (Math.abs(v) >= 1000000) return `$${(v / 1000000).toFixed(1)}M`;
                  return `$${(v / 1000).toFixed(0)}k`;
                }}
                label={{ value: 'Annual Amount ($)', angle: -90, position: 'insideLeft', offset: 5, fontSize: 12, fill: '#9CA3AF' }}
              />
              <Tooltip content={<IncomeTooltip />} />
              <Legend
                verticalAlign="top"
                height={36}
                iconType="rect"
                wrapperStyle={{ fontSize: 12 }}
              />
              <Bar dataKey="CPF Life" stackId="income" fill={COLORS.cpfLife} />
              <Bar dataKey="Rental" stackId="income" fill={COLORS.rental} />
              <Bar dataKey="Portfolio Income" stackId="income" fill={COLORS.pfIncome} />
              <Bar dataKey="Lump Sum" stackId="income" fill={COLORS.lumpSum} />
              <Bar dataKey="Expenses" fill={COLORS.expenses} fillOpacity={0.25} stroke={COLORS.expenses} strokeWidth={1} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ════════ Detailed Table ════════ */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">Detailed Cashflow Table</h2>
          <p className="text-sm text-gray-500 mt-0.5">Year-by-year retirement cashflow from age 55 to 89</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
                <th className="px-3 py-3 text-left font-medium sticky left-0 bg-gray-50 z-10">Age</th>
                <th className="px-3 py-3 text-left font-medium">Year</th>
                <th className="px-3 py-3 text-right font-medium">Start Balance</th>
                <th className="px-3 py-3 text-right font-medium">Expenses</th>
                <th className="px-3 py-3 text-right font-medium">CPF Life</th>
                <th className="px-3 py-3 text-right font-medium">Rental</th>
                <th className="px-3 py-3 text-right font-medium">PF Income</th>
                <th className="px-3 py-3 text-right font-medium">Lump Sum</th>
                <th className="px-3 py-3 text-right font-medium">Invest Return</th>
                <th className="px-3 py-3 text-right font-medium">End Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {cashflowData.map((row, idx) => {
                const isKeyAge = row.age === 55 || row.age === 65 || row.age === 70;
                const isEven = idx % 2 === 0;
                const isDeficit = row.isDeficit;

                let rowBg = isEven ? 'bg-white' : 'bg-gray-50/50';
                let rowExtra = '';
                if (isDeficit) {
                  rowBg = 'bg-red-50';
                }
                if (isKeyAge) {
                  rowExtra = 'border-l-4 border-l-amber-400 font-semibold';
                  if (!isDeficit) rowBg = 'bg-amber-50';
                }

                const textColor = isDeficit ? 'text-red-700' : 'text-gray-800';
                const balanceColor = row.endBalance < 0 ? 'text-red-600 font-bold' : 'text-gray-900 font-semibold';

                return (
                  <tr
                    key={row.age}
                    className={`${rowBg} ${rowExtra} hover:bg-blue-50/50 transition-colors`}
                  >
                    <td className={`px-3 py-2.5 sticky left-0 z-10 ${isDeficit ? 'bg-red-50' : isKeyAge ? 'bg-amber-50' : isEven ? 'bg-white' : 'bg-gray-50'} ${textColor} font-medium`}>
                      {row.age}
                    </td>
                    <td className={`px-3 py-2.5 ${textColor}`}>{row.year}</td>
                    <td className={`px-3 py-2.5 text-right ${textColor}`}>
                      {formatCurrency(row.startBalance)}
                    </td>
                    <td className="px-3 py-2.5 text-right text-red-600">
                      {formatCurrency(row.annualExpenses)}
                    </td>
                    <td className="px-3 py-2.5 text-right text-blue-600">
                      {row.cpfLife > 0 ? formatCurrency(row.cpfLife) : '-'}
                    </td>
                    <td className="px-3 py-2.5 text-right text-green-600">
                      {row.rentalIncome > 0 ? formatCurrency(row.rentalIncome) : '-'}
                    </td>
                    <td className="px-3 py-2.5 text-right text-orange-600">
                      {row.currentPFIncome > 0 ? formatCurrency(row.currentPFIncome) : '-'}
                    </td>
                    <td className="px-3 py-2.5 text-right text-purple-600">
                      {row.lumpSum > 0 ? formatCurrency(row.lumpSum) : '-'}
                    </td>
                    <td className={`px-3 py-2.5 text-right ${row.investReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(row.investReturn)}
                    </td>
                    <td className={`px-3 py-2.5 text-right ${balanceColor}`}>
                      {formatCurrency(row.endBalance)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
