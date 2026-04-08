import { useRef, useMemo } from 'react';
import { formatCurrency, formatAge, getYearAt55 } from '../utils/formatters';
import { getBalancesAtAge } from '../engine/cpfProjection';
import { getFRS, getBRS, getERS } from '../engine/frsData';
import { getCPFLifeEstimate } from '../engine/retirementCashflow';
import html2pdf from 'html2pdf.js';

export default function PrintableReport({ inputs, projectionData, cashflowData }) {
  const reportRef = useRef(null);

  const report = useMemo(() => {
    if (!projectionData || projectionData.length === 0 || !inputs) return null;

    const age = formatAge(inputs.dob);
    const yearAt55 = getYearAt55(inputs.dob);
    const at55 = getBalancesAtAge(projectionData, 55);

    const projectedOA = at55.oaBalance || 0;
    const projectedSA = at55.saBalance || 0;
    const projectedMA = at55.maBalance || 0;

    const frs = getFRS(yearAt55);
    const brs = getBRS(yearAt55);
    const ers = getERS(yearAt55);

    const saTransfer = Math.min(projectedSA, frs);
    const oaTransfer = Math.min(projectedOA, Math.max(0, frs - saTransfer));
    const retirementSumSetAside = saTransfer + oaTransfer;
    const canMeetFRS = retirementSumSetAside >= frs;

    const excessOA = projectedOA - oaTransfer;
    const excessSA = projectedSA - saTransfer;
    const excessForWithdrawal = Math.max(0, excessOA + excessSA);

    const cpfLifeMonthly = inputs.cpfLifePayout > 0
      ? inputs.cpfLifePayout
      : getCPFLifeEstimate(retirementSumSetAside, 'FRS', yearAt55);

    // Cashflow summary
    let fundAt55 = 0;
    let yearsLasts = 0;
    let coveragePercent = 0;
    if (cashflowData && cashflowData.length > 0) {
      fundAt55 = cashflowData[0].startBalance || 0;
      const lastPositive = cashflowData.filter(r => r.endBalance > 0);
      yearsLasts = lastPositive.length;
      if (inputs.desiredMonthlyIncome > 0) {
        const totalAnnualIncome = cashflowData.reduce((sum, r) => sum + (r.totalIncome || 0), 0);
        const totalAnnualExpenses = cashflowData.reduce((sum, r) => sum + (r.totalExpenses || 0), 0);
        coveragePercent = totalAnnualExpenses > 0 ? Math.min(1, totalAnnualIncome / totalAnnualExpenses) : 0;
      }
    }

    return {
      age,
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
      fundAt55,
      yearsLasts,
      coveragePercent,
    };
  }, [projectionData, inputs, cashflowData]);

  const exportPDF = () => {
    const element = reportRef.current;
    const opt = {
      margin: [10, 10, 10, 10],
      filename: `CPF_Retirement_Plan_${inputs.name || 'Client'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
    };
    html2pdf().set(opt).from(element).save();
  };

  if (!report) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 0', color: '#9ca3af' }}>
        <p>No data available for PDF report. Please complete input and projection first.</p>
      </div>
    );
  }

  const today = new Date().toLocaleDateString('en-SG', { day: 'numeric', month: 'long', year: 'numeric' });

  // ---- Styles ----
  const s = {
    page: {
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontSize: '11px',
      color: '#1f2937',
      lineHeight: '1.5',
      maxWidth: '210mm',
      margin: '0 auto',
      background: '#fff',
    },
    header: {
      background: '#1a1a2e',
      color: '#fff',
      padding: '28px 32px 20px',
      textAlign: 'center',
    },
    headerTitle: {
      fontSize: '20px',
      fontWeight: 'bold',
      letterSpacing: '0.5px',
      margin: 0,
    },
    headerSub: {
      fontSize: '12px',
      color: '#d4af37',
      marginTop: '6px',
    },
    headerInfo: {
      fontSize: '11px',
      color: '#93c5fd',
      marginTop: '4px',
    },
    body: {
      padding: '24px 32px',
    },
    sectionTitle: {
      fontSize: '13px',
      fontWeight: 'bold',
      color: '#1a1a2e',
      borderBottom: '2px solid #1a1a2e',
      paddingBottom: '4px',
      marginBottom: '12px',
      marginTop: '24px',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      marginBottom: '16px',
    },
    th: {
      background: '#1a1a2e',
      color: '#fff',
      padding: '8px 12px',
      textAlign: 'left',
      fontSize: '11px',
      fontWeight: '600',
    },
    thRight: {
      background: '#1a1a2e',
      color: '#fff',
      padding: '8px 12px',
      textAlign: 'right',
      fontSize: '11px',
      fontWeight: '600',
    },
    td: {
      padding: '7px 12px',
      borderBottom: '1px solid #e5e7eb',
      fontSize: '11px',
    },
    tdRight: {
      padding: '7px 12px',
      borderBottom: '1px solid #e5e7eb',
      textAlign: 'right',
      fontSize: '11px',
      fontWeight: '600',
    },
    rowAlt: {
      background: '#f9fafb',
    },
    rowNormal: {
      background: '#fff',
    },
    badge: (positive) => ({
      display: 'inline-block',
      padding: '3px 10px',
      borderRadius: '4px',
      fontWeight: 'bold',
      fontSize: '11px',
      color: '#fff',
      background: positive ? '#16a34a' : '#dc2626',
    }),
    footer: {
      background: '#f3f4f6',
      padding: '16px 32px',
      borderTop: '1px solid #e5e7eb',
    },
    footerText: {
      fontSize: '9px',
      color: '#9ca3af',
      textAlign: 'center',
      lineHeight: '1.5',
      margin: 0,
    },
    divider: {
      border: 'none',
      borderTop: '1px solid #e5e7eb',
      margin: '16px 0',
    },
  };

  return (
    <div>
      {/* Export Button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
        <button
          onClick={exportPDF}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            background: '#1a1a2e',
            color: '#fff',
            fontSize: '14px',
            fontWeight: '600',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Download Advisory Report
        </button>
      </div>

      {/* Report Content (captured by html2pdf) */}
      <div ref={reportRef} style={s.page}>
        {/* Header */}
        <div style={s.header}>
          <h1 style={s.headerTitle}>NexAiFin Wealth Advisory Report</h1>
          <p style={s.headerSub}>
            Exclusively Prepared for: <strong style={{ color: '#fff' }}>{inputs.name || 'Client'}</strong>
          </p>
          <p style={s.headerInfo}>
            Date Prepared: {today} &nbsp;|&nbsp; Adviser: Your NexAiFin Financial Adviser
          </p>
        </div>

        <div style={s.body}>
          {/* Section 1: Client Summary */}
          <div style={s.sectionTitle}>1. Client Summary</div>
          <table style={s.table}>
            <tbody>
              <tr style={s.rowAlt}>
                <td style={s.td}>Name</td>
                <td style={s.tdRight}>{inputs.name || 'N/A'}</td>
                <td style={s.td}>Gender</td>
                <td style={s.tdRight}>{inputs.gender || 'N/A'}</td>
              </tr>
              <tr style={s.rowNormal}>
                <td style={s.td}>Date of Birth</td>
                <td style={s.tdRight}>{inputs.dob || 'N/A'}</td>
                <td style={s.td}>Current Age</td>
                <td style={s.tdRight}>{report.age}</td>
              </tr>
              <tr style={s.rowAlt}>
                <td style={s.td}>Monthly Income</td>
                <td style={s.tdRight}>{formatCurrency(inputs.monthlySalary)}</td>
                <td style={s.td}>Annual Bonus (months)</td>
                <td style={s.tdRight}>{inputs.annualBonus || 0}</td>
              </tr>
              <tr style={s.rowNormal}>
                <td style={s.td}>CPF OA Balance</td>
                <td style={s.tdRight}>{formatCurrency(inputs.oaBalance)}</td>
                <td style={s.td}>CPF SA Balance</td>
                <td style={s.tdRight}>{formatCurrency(inputs.saBalance)}</td>
              </tr>
              <tr style={s.rowAlt}>
                <td style={s.td}>CPF MA Balance</td>
                <td style={s.tdRight}>{formatCurrency(inputs.maBalance)}</td>
                <td style={s.td}>CPF RA Balance</td>
                <td style={s.tdRight}>{formatCurrency(inputs.raBalance)}</td>
              </tr>
            </tbody>
          </table>

          <hr style={s.divider} />

          {/* Section 2: CPF Projection Summary */}
          <div style={s.sectionTitle}>2. CPF Projection Summary at Age 55</div>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Item</th>
                <th style={s.thRight}>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr style={s.rowAlt}>
                <td style={s.td}>Projected OA Balance at 55</td>
                <td style={s.tdRight}>{formatCurrency(report.projectedOA)}</td>
              </tr>
              <tr style={s.rowNormal}>
                <td style={s.td}>Projected SA Balance at 55</td>
                <td style={s.tdRight}>{formatCurrency(report.projectedSA)}</td>
              </tr>
              <tr style={s.rowAlt}>
                <td style={s.td}>Projected MA Balance at 55</td>
                <td style={s.tdRight}>{formatCurrency(report.projectedMA)}</td>
              </tr>
              <tr style={s.rowNormal}>
                <td style={s.td}>Full Retirement Sum (FRS) - Year {report.yearAt55}</td>
                <td style={s.tdRight}>{formatCurrency(report.frs)}</td>
              </tr>
              <tr style={s.rowAlt}>
                <td style={s.td}>Basic Retirement Sum (BRS)</td>
                <td style={s.tdRight}>{formatCurrency(report.brs)}</td>
              </tr>
              <tr style={s.rowNormal}>
                <td style={s.td}>Enhanced Retirement Sum (ERS)</td>
                <td style={s.tdRight}>{formatCurrency(report.ers)}</td>
              </tr>
              <tr style={s.rowAlt}>
                <td style={s.td}>Retirement Sum Set Aside in RA</td>
                <td style={{ ...s.tdRight, color: '#1a1a2e', fontWeight: 'bold' }}>
                  {formatCurrency(report.retirementSumSetAside)}
                </td>
              </tr>
              <tr style={s.rowNormal}>
                <td style={s.td}>Can Meet Full Retirement Sum?</td>
                <td style={s.tdRight}>
                  <span style={s.badge(report.canMeetFRS)}>
                    {report.canMeetFRS ? 'YES' : 'NO'}
                  </span>
                </td>
              </tr>
              <tr style={s.rowAlt}>
                <td style={s.td}>Excess CPF for Withdrawal at 55</td>
                <td style={s.tdRight}>{formatCurrency(report.excessForWithdrawal)}</td>
              </tr>
            </tbody>
          </table>

          <hr style={s.divider} />

          {/* Section 3: Retirement Cashflow Summary */}
          <div style={s.sectionTitle}>3. Retirement Cashflow Summary</div>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Item</th>
                <th style={s.thRight}>Value</th>
              </tr>
            </thead>
            <tbody>
              <tr style={s.rowAlt}>
                <td style={s.td}>Total Retirement Fund at 55</td>
                <td style={s.tdRight}>{formatCurrency(report.fundAt55)}</td>
              </tr>
              <tr style={s.rowNormal}>
                <td style={s.td}>Estimated Years Fund Lasts</td>
                <td style={s.tdRight}>{report.yearsLasts} years</td>
              </tr>
              <tr style={s.rowAlt}>
                <td style={s.td}>Est. CPF Life Monthly Payout (from 65)</td>
                <td style={s.tdRight}>{formatCurrency(report.cpfLifeMonthly)} /month</td>
              </tr>
              <tr style={s.rowNormal}>
                <td style={s.td}>Desired Monthly Retirement Income</td>
                <td style={s.tdRight}>{formatCurrency(inputs.desiredMonthlyIncome)} /month</td>
              </tr>
              <tr style={s.rowAlt}>
                <td style={s.td}>Income Coverage Ratio</td>
                <td style={s.tdRight}>
                  {(report.coveragePercent * 100).toFixed(1)}%
                </td>
              </tr>
            </tbody>
          </table>

          <hr style={s.divider} />

          {/* Section 4: Cashflow Table */}
          {cashflowData && cashflowData.length > 0 && (
            <>
              <div style={{ ...s.sectionTitle, pageBreakBefore: 'always' }}>
                4. Retirement Cashflow Table (Age 55-89)
              </div>
              <table style={s.table}>
                <thead>
                  <tr>
                    <th style={{ ...s.th, textAlign: 'center' }}>Age</th>
                    <th style={s.thRight}>Start Balance</th>
                    <th style={s.thRight}>Total Expenses</th>
                    <th style={s.thRight}>Total Income</th>
                    <th style={s.thRight}>End Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {cashflowData
                    .filter(row => row.age >= 55 && row.age <= 89)
                    .map((row, idx) => (
                      <tr key={row.age} style={idx % 2 === 0 ? s.rowAlt : s.rowNormal}>
                        <td style={{ ...s.td, textAlign: 'center', fontWeight: '600' }}>{row.age}</td>
                        <td style={s.tdRight}>{formatCurrency(row.startBalance)}</td>
                        <td style={{ ...s.tdRight, color: (row.totalExpenses || 0) > 0 ? '#dc2626' : undefined }}>
                          {formatCurrency(row.totalExpenses || 0)}
                        </td>
                        <td style={{ ...s.tdRight, color: (row.totalIncome || 0) > 0 ? '#16a34a' : undefined }}>
                          {formatCurrency(row.totalIncome || 0)}
                        </td>
                        <td style={{
                          ...s.tdRight,
                          color: (row.endBalance || 0) < 0 ? '#dc2626' : '#1a1a2e',
                          fontWeight: 'bold',
                        }}>
                          {formatCurrency(row.endBalance)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </>
          )}
        </div>

        {/* Footer */}
        <div style={s.footer}>
          <p style={s.footerText}>
            <strong>Confidential — NexAiFin Pte Ltd.</strong> This report is for illustrative purposes only. Projections are based on current CPF contribution rates, interest rates, and assumptions provided. Actual outcomes may differ. Please consult your NexAiFin adviser for personalised advice.
          </p>
          <p style={{ ...s.footerText, marginTop: '4px', color: '#d1d5db' }}>
            Report generated on {today}
          </p>
        </div>
      </div>
    </div>
  );
}
