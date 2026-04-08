import { useState, useMemo } from 'react';
import { getAnnualSummary, getBalancesAtAge } from '../engine/cpfProjection';
import { formatCurrency } from '../utils/formatters';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts';

const COLORS = {
  oa: '#3B82F6',   // blue
  sa: '#10B981',   // green
  ma: '#F59E0B',   // orange
  ra: '#8B5CF6',   // purple
};

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
      <p className="font-semibold text-gray-700 mb-1">Age {label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} style={{ color: entry.color }}>
          {entry.name}: {formatCurrency(entry.value)}
        </p>
      ))}
      <p className="font-semibold text-gray-900 border-t border-gray-100 mt-1 pt-1">
        Total: {formatCurrency(payload.reduce((sum, e) => sum + (e.value || 0), 0))}
      </p>
    </div>
  );
}

function MilestoneCard({ label, value, subtext, status }) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-xl font-bold text-gray-900 mt-1">{value}</p>
      {subtext && <p className="text-xs text-gray-500 mt-1">{subtext}</p>}
      {status !== undefined && (
        <div className="flex items-center mt-2">
          <span
            className={`inline-block w-2.5 h-2.5 rounded-full mr-2 ${
              status ? 'bg-green-500' : 'bg-red-500'
            }`}
          />
          <span className={`text-xs font-medium ${status ? 'text-green-700' : 'text-red-700'}`}>
            {status ? 'Yes - Can meet FRS' : 'No - Cannot meet FRS'}
          </span>
        </div>
      )}
    </div>
  );
}

export default function CPFProjection({ projectionData, inputs }) {
  const [viewMode, setViewMode] = useState('annual');

  // Derive milestones
  const milestones = useMemo(() => {
    if (!projectionData || projectionData.length === 0) return null;

    const current = projectionData[0];
    const at55 = getBalancesAtAge(projectionData, 55);
    const frsAt55 = at55.frs || 0;
    const oaSaAt55 = (at55.oaBalance || 0) + (at55.saBalance || 0);
    const canMeetFRS = oaSaAt55 >= frsAt55;
    const excess = Math.max(0, oaSaAt55 - frsAt55);

    return {
      currentTotal: current.totalBalance,
      totalAt55: at55.totalBalance,
      frsAt55,
      oaSaAt55,
      canMeetFRS,
      excess,
      currentAge: current.age,
    };
  }, [projectionData]);

  // Chart data (annual)
  const chartData = useMemo(() => {
    if (!projectionData || projectionData.length === 0) return [];
    const annual = getAnnualSummary(projectionData);
    return annual.map((row) => ({
      age: row.age,
      OA: row.oaBalance,
      SA: row.saBalance,
      MA: row.maBalance,
      RA: row.raBalance,
      frs: row.frs,
    }));
  }, [projectionData]);

  // Table data
  const tableData = useMemo(() => {
    if (!projectionData || projectionData.length === 0) return [];
    if (viewMode === 'annual') return getAnnualSummary(projectionData);
    return projectionData;
  }, [projectionData, viewMode]);

  // FRS reference line value (use mid-projection value)
  const frsRefValue = useMemo(() => {
    if (!chartData.length) return 0;
    const mid = chartData.find((d) => d.age === 55);
    return mid ? mid.frs : chartData[chartData.length - 1].frs;
  }, [chartData]);

  if (!projectionData || projectionData.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>No projection data available. Please fill in your details and run the projection.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Milestones */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Key Milestones</h2>
        {milestones && (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <MilestoneCard
              label="Current CPF Total"
              value={formatCurrency(milestones.currentTotal)}
              subtext={`Age ${milestones.currentAge}`}
            />
            <MilestoneCard
              label="Projected Total at 55"
              value={formatCurrency(milestones.totalAt55)}
            />
            <MilestoneCard
              label="FRS at Age 55"
              value={formatCurrency(milestones.frsAt55)}
              subtext={`OA+SA: ${formatCurrency(milestones.oaSaAt55)}`}
            />
            <MilestoneCard
              label="Can Meet FRS?"
              value={milestones.canMeetFRS ? 'Yes' : 'No'}
              status={milestones.canMeetFRS}
            />
            <MilestoneCard
              label="Excess at 55"
              value={formatCurrency(milestones.excess)}
              subtext="Available for withdrawal"
            />
          </div>
        )}
      </div>

      {/* CPF Growth Chart */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">CPF Growth Chart</h2>
          <p className="text-sm text-gray-500 mt-0.5">Projected balance by account over time</p>
        </div>
        <div className="p-4">
          <ResponsiveContainer width="100%" height={380}>
            <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis
                dataKey="age"
                tick={{ fontSize: 12, fill: '#6B7280' }}
                label={{ value: 'Age', position: 'insideBottom', offset: -2, fontSize: 12, fill: '#9CA3AF' }}
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#6B7280' }}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                label={{ value: 'Balance ($)', angle: -90, position: 'insideLeft', offset: 5, fontSize: 12, fill: '#9CA3AF' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                height={36}
                iconType="rect"
                wrapperStyle={{ fontSize: 12 }}
              />
              <ReferenceLine
                y={frsRefValue}
                stroke="#EF4444"
                strokeDasharray="6 4"
                label={{ value: `FRS ${formatCurrency(frsRefValue)}`, position: 'right', fontSize: 11, fill: '#EF4444' }}
              />
              <Area
                type="monotone" dataKey="OA" name="Ordinary (OA)"
                stackId="1" stroke={COLORS.oa} fill={COLORS.oa} fillOpacity={0.6}
              />
              <Area
                type="monotone" dataKey="SA" name="Special (SA)"
                stackId="1" stroke={COLORS.sa} fill={COLORS.sa} fillOpacity={0.6}
              />
              <Area
                type="monotone" dataKey="MA" name="Medisave (MA)"
                stackId="1" stroke={COLORS.ma} fill={COLORS.ma} fillOpacity={0.6}
              />
              <Area
                type="monotone" dataKey="RA" name="Retirement (RA)"
                stackId="1" stroke={COLORS.ra} fill={COLORS.ra} fillOpacity={0.6}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* View Toggle + Data Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Projection Details</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {viewMode === 'annual' ? 'Year-end balances' : 'Monthly breakdown'}
            </p>
          </div>
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('annual')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'annual'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Annual
            </button>
            <button
              onClick={() => setViewMode('monthly')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'monthly'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Monthly
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
                <th className="px-4 py-3 text-left font-medium">Year</th>
                {viewMode === 'monthly' && (
                  <th className="px-4 py-3 text-left font-medium">Month</th>
                )}
                <th className="px-4 py-3 text-left font-medium">Age</th>
                {viewMode === 'monthly' && (
                  <>
                    <th className="px-4 py-3 text-right font-medium">OA Contrib</th>
                    <th className="px-4 py-3 text-right font-medium">SA Contrib</th>
                    <th className="px-4 py-3 text-right font-medium">MA Contrib</th>
                  </>
                )}
                <th className="px-4 py-3 text-right font-medium">OA Balance</th>
                <th className="px-4 py-3 text-right font-medium">SA Balance</th>
                <th className="px-4 py-3 text-right font-medium">MA Balance</th>
                <th className="px-4 py-3 text-right font-medium">RA Balance</th>
                <th className="px-4 py-3 text-right font-medium">Total</th>
                <th className="px-4 py-3 text-right font-medium">FRS</th>
                <th className="px-4 py-3 text-right font-medium">BHS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tableData.map((row, idx) => {
                const isAge55 = row.age === 55;
                const isEven = idx % 2 === 0;
                return (
                  <tr
                    key={`${row.year}-${row.month || idx}`}
                    className={`
                      ${isAge55 ? 'bg-amber-50 font-semibold border-l-4 border-l-amber-400' : ''}
                      ${!isAge55 && isEven ? 'bg-white' : ''}
                      ${!isAge55 && !isEven ? 'bg-gray-50/50' : ''}
                      hover:bg-blue-50/50 transition-colors
                    `}
                  >
                    <td className="px-4 py-2.5 text-gray-700">{row.year}</td>
                    {viewMode === 'monthly' && (
                      <td className="px-4 py-2.5 text-gray-700">{row.month}</td>
                    )}
                    <td className="px-4 py-2.5 text-gray-700">{row.age}</td>
                    {viewMode === 'monthly' && (
                      <>
                        <td className="px-4 py-2.5 text-right text-blue-600">
                          {formatCurrency(row.oaContrib)}
                        </td>
                        <td className="px-4 py-2.5 text-right text-green-600">
                          {formatCurrency(row.saContrib)}
                        </td>
                        <td className="px-4 py-2.5 text-right text-orange-600">
                          {formatCurrency(row.maContrib)}
                        </td>
                      </>
                    )}
                    <td className="px-4 py-2.5 text-right text-gray-800">
                      {formatCurrency(row.oaBalance)}
                    </td>
                    <td className="px-4 py-2.5 text-right text-gray-800">
                      {formatCurrency(row.saBalance)}
                    </td>
                    <td className="px-4 py-2.5 text-right text-gray-800">
                      {formatCurrency(row.maBalance)}
                    </td>
                    <td className="px-4 py-2.5 text-right text-gray-800">
                      {formatCurrency(row.raBalance)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-semibold text-gray-900">
                      {formatCurrency(row.totalBalance)}
                    </td>
                    <td className="px-4 py-2.5 text-right text-red-500">
                      {formatCurrency(row.frs)}
                    </td>
                    <td className="px-4 py-2.5 text-right text-gray-500">
                      {formatCurrency(row.bhs)}
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
