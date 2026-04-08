import { formatCurrency } from '../utils/formatters';

export default function ReportAbove55({ inputs }) {
  if (!inputs) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>No client data available. Please complete the input form first.</p>
      </div>
    );
  }

  const oaBalance = inputs.oaBalance || 0;
  const saBalance = inputs.saBalance || 0;
  const maBalance = inputs.maBalance || 0;
  const raBalance = inputs.raBalance || 0;
  const cpfLifePayout = inputs.cpfLifePayout || 0;
  const excessForWithdrawal = oaBalance + saBalance;

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
        <div className="bg-gradient-to-r from-indigo-700 to-indigo-900 text-white px-8 py-6 rounded-t-lg print:rounded-none">
          <h1 className="text-xl font-bold tracking-wide text-center">
            Your Basic Retirement Plan via CPF Report
          </h1>
          <p className="text-indigo-200 text-sm text-center mt-2">
            Specially Prepared for{' '}
            <span className="text-white font-semibold">{inputs.name || 'Client'}</span>
          </p>
        </div>

        <div className="px-8 py-6 space-y-6">
          {/* Section 1: Current CPF Balances */}
          <div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Current CPF Account Balances
            </h2>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b border-gray-100 bg-blue-50/50">
                    <td className="px-5 py-3 font-medium text-gray-700">Ordinary Account (OA)</td>
                    <td className="px-5 py-3 text-right font-semibold text-gray-900">
                      {formatCurrency(oaBalance)}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="px-5 py-3 font-medium text-gray-700">Special Account (SA)</td>
                    <td className="px-5 py-3 text-right font-semibold text-gray-900">
                      {formatCurrency(saBalance)}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-100 bg-blue-50/50">
                    <td className="px-5 py-3 font-medium text-gray-700">MediSave Account (MA)</td>
                    <td className="px-5 py-3 text-right font-semibold text-gray-900">
                      {formatCurrency(maBalance)}
                    </td>
                  </tr>
                  <tr className="bg-indigo-50">
                    <td className="px-5 py-3 font-medium text-indigo-700">Retirement Account (RA)</td>
                    <td className="px-5 py-3 text-right font-bold text-indigo-700 text-lg">
                      {formatCurrency(raBalance)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Divider */}
          <hr className="border-gray-200" />

          {/* Section 2: CPF Life Payout */}
          <div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Your Projected CPF Life Payout
            </h2>

            {/* Current RA Amount */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg px-5 py-4 mb-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-600">Current Retirement Account (RA) Amount</p>
                <p className="text-lg font-bold text-indigo-700">{formatCurrency(raBalance)}</p>
              </div>
            </div>

            {/* Monthly Payout */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg px-5 py-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">Monthly CPF Life Income</p>
                  <p className="text-xs text-gray-500 mt-1">per month wef age 65 for the rest of your life</p>
                </div>
                <div className="text-right">
                  {cpfLifePayout > 0 ? (
                    <div className="flex items-center gap-2">
                      <svg className="w-6 h-6 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <p className="text-2xl font-bold text-green-700">
                        {formatCurrency(cpfLifePayout)}
                        <span className="text-sm font-normal text-gray-500"> /month</span>
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <svg className="w-6 h-6 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <p className="text-lg font-semibold text-gray-400">Not available</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <p className="text-xs text-gray-400 mt-2 italic">
              * CPF Life payout amount is based on current plan details. Actual payouts may vary
              depending on the CPF Life plan selected and prevailing rates.
            </p>
          </div>

          {/* Divider */}
          <hr className="border-gray-200" />

          {/* Section 3: Excess for Withdrawal */}
          <div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Your Excess CPF Money for Withdrawal
            </h2>
            <div className={`flex items-center gap-3 px-5 py-4 rounded-lg border ${
              excessForWithdrawal > 0
                ? 'bg-green-50 border-green-200'
                : 'bg-gray-50 border-gray-200'
            }`}>
              {excessForWithdrawal > 0 ? (
                <svg className="w-8 h-8 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-8 h-8 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
              <div className="flex-1">
                <p className={`text-lg font-bold ${excessForWithdrawal > 0 ? 'text-green-700' : 'text-gray-500'}`}>
                  {excessForWithdrawal > 0
                    ? formatCurrency(excessForWithdrawal)
                    : 'No excess available'}
                </p>
                <p className="text-sm text-gray-600">
                  OA ({formatCurrency(oaBalance)}) + SA ({formatCurrency(saBalance)}) balance available for withdrawal
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-8 py-4 rounded-b-lg border-t border-gray-200 print:rounded-none">
          <p className="text-xs text-gray-400 text-center">
            This report is for illustrative purposes only. CPF Life payouts are estimates based on
            current plan details. Please consult CPF Board or a qualified financial adviser for
            personalised advice.
          </p>
          <p className="text-xs text-gray-300 text-center mt-1">
            Generated on {new Date().toLocaleDateString('en-SG', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>
    </div>
  );
}
