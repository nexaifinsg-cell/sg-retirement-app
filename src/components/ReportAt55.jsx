import { useMemo } from 'react';
import { getBalancesAtAge } from '../engine/cpfProjection';
import { getFRS, getBRS, getERS } from '../engine/frsData';
import { getCPFLifeEstimate } from '../engine/retirementCashflow';
import { formatCurrency, getYearAt55 } from '../utils/formatters';

export default function ReportAt55({ projectionData, inputs, cashflowData }) {
  const report = useMemo(() => {
    if (!projectionData || projectionData.length === 0 || !inputs) return null;

    const yearAt55 = getYearAt55(inputs.dob);
    const at55 = getBalancesAtAge(projectionData, 55);

    const projectedOA = at55.oaBalance || 0;
    const projectedSA = at55.saBalance || 0;
    const projectedMA = at55.maBalance || 0;

    const frs = getFRS(yearAt55);
    const brs = getBRS(yearAt55);
    const ers = getERS(yearAt55);

    // Determine how much can be set aside in RA (SA first, then OA)
    const saTransfer = Math.min(projectedSA, frs);
    const oaTransfer = Math.min(projectedOA, Math.max(0, frs - saTransfer));
    const retirementSumSetAside = saTransfer + oaTransfer;
    const canMeetFRS = retirementSumSetAside >= frs;

    // Excess after setting aside FRS
    const excessOA = projectedOA - oaTransfer;
    const excessSA = projectedSA - saTransfer;
    const excessForWithdrawal = Math.max(0, excessOA + excessSA);

    // Estimated CPF Life monthly payout
    const cpfLifeMonthly = getCPFLifeEstimate(retirementSumSetAside, 'FRS', yearAt55);

    return {
      yearAt55,
      projectedOA,
      projectedSA,
      projectedMA,
      frs,
      brs,
      ers,
      retirementSumSetAside,
      canMeetFRS,
      excessForWithdrawal,
      cpfLifeMonthly,
    };
  }, [projectionData, inputs, cashflowData]);

  if (!report) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>No projection data available. Please complete the input form first.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Print Button */}
      <div className="flex justify-end mb-4 print:hidden">
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Print Report
        </button>
      </div>

      {/* Report Container */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm print:shadow-none print:border-none">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 to-blue-900 text-white px-8 py-6 rounded-t-lg print:rounded-none">
          <h1 className="text-xl font-bold tracking-wide text-center">
            Projection of CPF Accounts Balances at 55 Report
          </h1>
          <p className="text-blue-200 text-sm text-center mt-2">
            Specially Prepared for{' '}
            <span className="text-white font-semibold">{inputs.name || 'Client'}</span>
          </p>
          <p className="text-blue-300 text-xs text-center mt-1">
            Based on projections to year {report.yearAt55}
          </p>
        </div>

        <div className="px-8 py-6 space-y-6">
          {/* Section 1: Projected CPF Balances at 55 */}
          <div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Projected CPF Balances at Age 55
            </h2>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b border-gray-100 bg-blue-50/50">
                    <td className="px-5 py-3 font-medium text-gray-700">Ordinary Account (OA)</td>
                    <td className="px-5 py-3 text-right font-semibold text-gray-900">
                      {formatCurrency(report.projectedOA)}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="px-5 py-3 font-medium text-gray-700">Special Account (SA)</td>
                    <td className="px-5 py-3 text-right font-semibold text-gray-900">
                      {formatCurrency(report.projectedSA)}
                    </td>
                  </tr>
                  <tr className="bg-blue-50/50">
                    <td className="px-5 py-3 font-medium text-gray-700">MediSave Account (MA)</td>
                    <td className="px-5 py-3 text-right font-semibold text-gray-900">
                      {formatCurrency(report.projectedMA)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Divider */}
          <hr className="border-gray-200" />

          {/* Section 2: Choice of Retirement Sum */}
          <div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Choice of Retirement Sum (Year {report.yearAt55})
            </h2>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <td className="px-5 py-3 font-medium text-gray-700">Basic Retirement Sum (BRS)</td>
                    <td className="px-5 py-3 text-right font-semibold text-gray-900">
                      {formatCurrency(report.brs)}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="px-5 py-3 font-medium text-gray-700">Full Retirement Sum (FRS)</td>
                    <td className="px-5 py-3 text-right font-semibold text-blue-700">
                      {formatCurrency(report.frs)}
                    </td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="px-5 py-3 font-medium text-gray-700">Enhanced Retirement Sum (ERS)</td>
                    <td className="px-5 py-3 text-right font-semibold text-gray-900">
                      {formatCurrency(report.ers)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Divider */}
          <hr className="border-gray-200" />

          {/* Section 3: Can you meet your Retirement Sum? */}
          <div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Are you able to meet your Choice of Retirement Sum?
            </h2>
            <div className={`flex items-center gap-3 px-5 py-4 rounded-lg border ${
              report.canMeetFRS
                ? 'bg-green-50 border-green-200'
                : 'bg-red-50 border-red-200'
            }`}>
              {report.canMeetFRS ? (
                <svg className="w-8 h-8 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-8 h-8 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
              <div>
                <p className={`text-lg font-bold ${report.canMeetFRS ? 'text-green-700' : 'text-red-700'}`}>
                  {report.canMeetFRS ? 'Yes' : 'No'}
                </p>
                <p className="text-sm text-gray-600">
                  {report.canMeetFRS
                    ? 'You are projected to meet the Full Retirement Sum.'
                    : 'You may not have enough to meet the Full Retirement Sum.'}
                </p>
              </div>
            </div>
          </div>

          {/* Section 4: Retirement Sum Set Aside */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <tbody>
                <tr className="bg-blue-50 border-b border-gray-200">
                  <td className="px-5 py-3 font-medium text-gray-700">Retirement Sum Set Aside in RA</td>
                  <td className="px-5 py-3 text-right font-bold text-blue-700 text-lg">
                    {formatCurrency(report.retirementSumSetAside)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Divider */}
          <hr className="border-gray-200" />

          {/* Section 5: CPF Life Monthly Income */}
          <div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Projected Monthly CPF Life Income
            </h2>
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg px-5 py-4">
              <div className="flex items-baseline justify-between">
                <div>
                  <p className="text-sm text-gray-600">Estimated monthly payout from age 65</p>
                  <p className="text-xs text-gray-400 mt-1">for the rest of your life</p>
                </div>
                <p className="text-2xl font-bold text-green-700">
                  {formatCurrency(report.cpfLifeMonthly)}
                  <span className="text-sm font-normal text-gray-500"> /month</span>
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2 italic">
              * This is an estimate based on current CPF Life payout rates. Actual payouts may vary.
            </p>
          </div>

          {/* Divider */}
          <hr className="border-gray-200" />

          {/* Section 6: Excess for Withdrawal */}
          <div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Will you have excess CPF money for withdrawal?
            </h2>
            <div className={`flex items-center gap-3 px-5 py-4 rounded-lg border ${
              report.excessForWithdrawal > 0
                ? 'bg-green-50 border-green-200'
                : 'bg-gray-50 border-gray-200'
            }`}>
              {report.excessForWithdrawal > 0 ? (
                <svg className="w-8 h-8 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-8 h-8 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
              <div>
                <p className={`text-lg font-bold ${report.excessForWithdrawal > 0 ? 'text-green-700' : 'text-gray-500'}`}>
                  {report.excessForWithdrawal > 0
                    ? formatCurrency(report.excessForWithdrawal)
                    : 'No excess available'}
                </p>
                <p className="text-sm text-gray-600">
                  {report.excessForWithdrawal > 0
                    ? 'Available for withdrawal at age 55 (OA + SA balance after setting aside Retirement Sum)'
                    : 'All CPF balances will be used toward your Retirement Sum.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-8 py-4 rounded-b-lg border-t border-gray-200 print:rounded-none">
          <p className="text-xs text-gray-400 text-center">
            This report is for illustrative purposes only. Projections are based on current CPF contribution rates,
            interest rates, and assumptions provided. Actual outcomes may differ. Please consult a qualified
            financial adviser for personalised advice.
          </p>
          <p className="text-xs text-gray-300 text-center mt-1">
            Generated on {new Date().toLocaleDateString('en-SG', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>
    </div>
  );
}
