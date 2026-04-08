import { useState, useMemo, useEffect } from 'react';
import InputForm from './components/InputForm';
import SamplePresets from './components/SamplePresets';
import PortfolioInput from './components/PortfolioInput';
import CPFProjection from './components/CPFProjection';
import CashflowAnalysis from './components/CashflowAnalysis';
import { runCPFProjection, getBalancesAtAge } from './engine/cpfProjection';
import { runRetirementCashflow, getCPFLifeEstimate } from './engine/retirementCashflow';
import { getFRS } from './engine/frsData';
import { formatAge, isBornBefore1975, getYearAt55 } from './utils/formatters';
import ReportAt55 from './components/ReportAt55';
import ReportAbove55 from './components/ReportAbove55';
import PrintableReport from './components/PrintableReport';
import TopUpScenarios from './components/TopUpScenarios';
import WhatIfAnalysis from './components/WhatIfAnalysis';
import ClientManager from './components/ClientManager';
import CouplePlanning from './components/CouplePlanning';

// ---------------------------------------------------------------------------
// Tab definitions
// ---------------------------------------------------------------------------
const TABS = [
  { key: 'client',    label: 'Client Details' },
  { key: 'portfolio', label: 'Portfolio' },
  { key: 'cpf',       label: 'CPF Projection' },
  { key: 'cashflow',  label: 'Cashflow Analysis' },
  { key: 'topup',     label: 'Top-Up Scenarios' },
  { key: 'whatif',    label: 'What-If Analysis' },
  { key: 'couple',    label: 'Couple Planning' },
  { key: 'reports',   label: 'Reports' },
];

// ---------------------------------------------------------------------------
// Default input state
// ---------------------------------------------------------------------------
const DEFAULT_INPUTS = {
  name: '',
  dob: '',
  gender: 'Male',
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
  housingStartDate: '',
  cpfisOA: 0,
  cpfisSA: 0,
  cpfisOATillAge: 55,
  cpfisSATillAge: 55,
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
// App
// ---------------------------------------------------------------------------
export default function App() {
  const [activeTab, setActiveTab] = useState(() => {
    try { return localStorage.getItem('cpf-retirement-tab') || 'client'; }
    catch { return 'client'; }
  });

  const [inputs, setInputs] = useState(() => {
    try {
      const saved = localStorage.getItem('cpf-retirement-inputs');
      return saved ? { ...DEFAULT_INPUTS, ...JSON.parse(saved) } : DEFAULT_INPUTS;
    } catch { return DEFAULT_INPUTS; }
  });

  useEffect(() => {
    try {
      localStorage.setItem('cpf-retirement-inputs', JSON.stringify(inputs));
    } catch { /* ignore storage errors */ }
  }, [inputs]);

  useEffect(() => {
    try { localStorage.setItem('cpf-retirement-tab', activeTab); }
    catch {}
  }, [activeTab]);

  const handleClearData = () => {
    if (window.confirm('Clear all client data? This cannot be undone.')) {
      setInputs(DEFAULT_INPUTS);
      localStorage.removeItem('cpf-retirement-inputs');
    }
  };

  // Derived values
  const age = formatAge(inputs.dob);
  const canProject = Boolean(inputs.dob && inputs.statementDate);

  // CPF Projection (memoised)
  const projectionData = useMemo(() => {
    if (!canProject) return null;
    try {
      return runCPFProjection(inputs);
    } catch {
      return null;
    }
  }, [inputs, canProject]);

  // Compute excess CPF and CPF Life estimate from projection
  const projectionDerived = useMemo(() => {
    if (!projectionData || projectionData.length === 0) return { excessCPF: 0, estimatedCPFLife: 0 };
    const at55 = getBalancesAtAge(projectionData, 55);
    const yearAt55 = getYearAt55(inputs.dob);
    const frs = getFRS(yearAt55);
    const oaSa = at55.oaBalance + at55.saBalance;
    const excessCPF = Math.max(0, oaSa);
    const estimatedCPFLife = inputs.cpfLifePayout > 0
      ? inputs.cpfLifePayout
      : getCPFLifeEstimate(at55.raBalance, 'FRS', yearAt55);
    return { excessCPF, estimatedCPFLife, raBalance: at55.raBalance };
  }, [projectionData, inputs.dob, inputs.cpfLifePayout]);

  // Retirement Cashflow (memoised)
  const cashflowData = useMemo(() => {
    if (!canProject || !projectionData) return null;
    try {
      return runRetirementCashflow({
        ...inputs,
        projectionData,
        excessCPF: projectionDerived.excessCPF,
        cpfLifePayout: projectionDerived.estimatedCPFLife,
        raBalance: projectionDerived.raBalance,
      });
    } catch {
      return null;
    }
  }, [inputs, projectionData, canProject, projectionDerived]);

  // ------------------------------------------
  // Render helpers
  // ------------------------------------------
  const renderTabContent = () => {
    switch (activeTab) {
      case 'client':
        return (
          <>
            <ClientManager currentInputs={inputs} setInputs={setInputs} onSelectClient={(data) => setInputs(prev => ({ ...DEFAULT_INPUTS, ...data }))} />
            <SamplePresets setInputs={setInputs} />
            <InputForm inputs={inputs} setInputs={setInputs} />
          </>
        );

      case 'portfolio':
        return <PortfolioInput inputs={inputs} setInputs={setInputs} />;

      case 'cpf':
        if (!canProject) {
          return (
            <div className="text-center py-16 text-gray-500">
              <svg className="mx-auto h-12 w-12 mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-lg font-medium">No projection available</p>
              <p className="mt-1 text-sm">
                Please enter <span className="font-semibold">Date of Birth</span> and{' '}
                <span className="font-semibold">CPF Statement Date</span> in the Client Details tab.
              </p>
            </div>
          );
        }
        return <CPFProjection projectionData={projectionData} inputs={inputs} />;

      case 'cashflow':
        if (!cashflowData) {
          return (
            <div className="text-center py-16 text-gray-500">
              <svg className="mx-auto h-12 w-12 mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-lg font-medium">No cashflow data available</p>
              <p className="mt-1 text-sm">Complete the Client Details and CPF Projection first.</p>
            </div>
          );
        }
        return <CashflowAnalysis cashflowData={cashflowData} inputs={{ ...inputs, cpfLifePayout: projectionDerived.estimatedCPFLife }} />;

      case 'reports':
        if (!canProject || !projectionData) {
          return (
            <div className="text-center py-16 text-gray-500">
              <svg className="mx-auto h-12 w-12 mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-lg font-medium">No report available</p>
              <p className="mt-1 text-sm">Complete client details to generate a report.</p>
            </div>
          );
        }
        if (age > 55) {
          return (
            <>
              <ReportAbove55 inputs={inputs} />
              <div style={{ marginTop: '32px' }}>
                <PrintableReport inputs={inputs} projectionData={projectionData} cashflowData={cashflowData} />
              </div>
            </>
          );
        }
        return (
          <>
            <ReportAt55 projectionData={projectionData} inputs={inputs} cashflowData={cashflowData} />
            <div style={{ marginTop: '32px' }}>
              <PrintableReport inputs={inputs} projectionData={projectionData} cashflowData={cashflowData} />
            </div>
          </>
        );

      case 'topup':
        if (!canProject || !projectionData) {
          return (
            <div className="text-center py-16 text-gray-500">
              <p className="text-lg font-medium">No projection available</p>
              <p className="mt-1 text-sm">Complete Client Details first to use Top-Up Scenarios.</p>
            </div>
          );
        }
        return <TopUpScenarios inputs={inputs} projectionData={projectionData} projectionDerived={projectionDerived} />;

      case 'whatif':
        if (!canProject || !projectionData) {
          return (
            <div className="text-center py-16 text-gray-500">
              <p className="text-lg font-medium">No projection available</p>
              <p className="mt-1 text-sm">Complete Client Details first to use What-If Analysis.</p>
            </div>
          );
        }
        return <WhatIfAnalysis inputs={inputs} projectionData={projectionData} cashflowData={cashflowData} projectionDerived={projectionDerived} />;

      case 'couple':
        if (!canProject || !projectionData) {
          return (
            <div className="text-center py-16 text-gray-500">
              <p className="text-lg font-medium">No projection available</p>
              <p className="mt-1 text-sm">Complete Client Details first to use Couple Planning.</p>
            </div>
          );
        }
        return <CouplePlanning inputs={inputs} projectionData={projectionData} cashflowData={cashflowData} projectionDerived={projectionDerived} />;

      default:
        return null;
    }
  };

  // ------------------------------------------
  // Main render
  // ------------------------------------------
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* ---- Header ---- */}
      <header className="bg-[#1e3a5f] text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Singapore CPF Retirement Planner
              </h1>
              <p className="mt-1 text-sm text-[#c8a951] font-medium tracking-wide">
                Comprehensive Retirement Cash Flow Analysis
              </p>
            </div>

            {/* Clear Data button */}
            <button
              onClick={handleClearData}
              className="text-xs text-gray-300 hover:text-white underline underline-offset-2 transition-colors"
            >
              Clear All Data
            </button>

            {/* Client name badge (when entered) */}
            {inputs.name && (
              <div className="hidden sm:flex items-center gap-2 bg-white/10 rounded-lg px-4 py-2">
                <svg className="h-5 w-5 text-[#c8a951]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <div className="text-sm">
                  <p className="font-semibold">{inputs.name}</p>
                  {inputs.dob && (
                    <p className="text-xs text-gray-300">Age {age} &middot; {inputs.gender}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ---- Tab Navigation ---- */}
      <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex overflow-x-auto -mb-px scrollbar-hide">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`
                    whitespace-nowrap px-5 py-3 text-sm font-medium border-b-2 transition-colors
                    ${isActive
                      ? 'border-[#c8a951] text-[#1e3a5f]'
                      : 'border-transparent text-gray-500 hover:text-[#1e3a5f] hover:border-gray-300'
                    }
                  `}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* ---- Status bar ---- */}
      {canProject && projectionData && (
        <div className="bg-[#1e3a5f]/5 border-b border-[#1e3a5f]/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center gap-2 text-xs text-[#1e3a5f]">
            <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
            <span className="font-medium">Projection active</span>
            <span className="text-gray-400 mx-1">|</span>
            <span>Auto-recalculates on input change</span>
          </div>
        </div>
      )}

      {/* ---- Content ---- */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {renderTabContent()}
        </div>
      </main>

      {/* ---- Footer ---- */}
      <footer className="bg-[#1e3a5f] text-gray-400 text-xs text-center py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4">
          <p>&copy; {new Date().getFullYear()} Singapore CPF Retirement Planner. For professional financial adviser use only.</p>
          <p className="mt-1 text-gray-500">
            Projections are estimates based on current CPF policies and assumptions. Not financial advice.
          </p>
        </div>
      </footer>

      {/* Back to top button */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed bottom-6 right-6 bg-[#1e3a5f] text-white p-3 rounded-full shadow-lg hover:bg-[#2c5282] transition-all no-print z-50"
        title="Back to top"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      </button>
    </div>
  );
}
