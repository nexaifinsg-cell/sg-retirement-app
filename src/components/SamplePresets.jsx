const PRESETS = [
  {
    label: 'Young Professional (Age 30)',
    color: 'blue',
    data: {
      name: 'Sarah Lim', dob: '1996-03-15', gender: 'Female',
      monthlySalary: 6000, annualBonus: 2, salaryIncrement: 0.04,
      statementDate: '2025-01-01',
      oaBalance: 45000, saBalance: 25000, maBalance: 18000, raBalance: 0,
      housingLoan: 800, housingTillAge: 55, housingStartDate: '2023-01-01',
      cpfisOA: 0, cpfisSA: 0, cpfisOATillAge: 55, cpfisSATillAge: 55,
      shieldIP: true, metFRS: false, cpfLifePayout: 0,
      desiredMonthlyIncome: 2500, investmentReturn: 0.025,
      savingsPlans: [], investmentPlans: [], rentalIncome: [], regularPayouts: [],
    },
  },
  {
    label: 'Mid-Career (Age 45)',
    color: 'green',
    data: {
      name: 'John Tan', dob: '1980-06-15', gender: 'Male',
      monthlySalary: 10000, annualBonus: 2, salaryIncrement: 0.03,
      statementDate: '2025-01-01',
      oaBalance: 180000, saBalance: 95000, maBalance: 55000, raBalance: 0,
      housingLoan: 1200, housingTillAge: 60, housingStartDate: '2015-06-01',
      cpfisOA: 200, cpfisSA: 0, cpfisOATillAge: 55, cpfisSATillAge: 55,
      shieldIP: true, metFRS: false, cpfLifePayout: 0,
      desiredMonthlyIncome: 4000, investmentReturn: 0.03,
      savingsPlans: [
        { maturityAge: 60, maturityValue: 80000, company: 'Prudential', policyNo: 'P123456', policyType: 'Endowment', annualPremium: 3600, remarks: '' },
      ],
      investmentPlans: [
        { surrenderAge: 55, projectedFV: 120000, currentAmount: 60000, assumedReturn: 0.06, name: 'Global Equity Fund', originalAmount: 40000, investedSince: '2018' },
      ],
      rentalIncome: [
        { propertyName: 'Condo Unit #05-12', monthlyRental: 2500, inflationRate: 0.02, loanOffset: 1800, loanExpiredAge: 62 },
      ],
      regularPayouts: [],
    },
  },
  {
    label: 'Near Retirement (Age 52)',
    color: 'amber',
    data: {
      name: 'David Wong', dob: '1973-01-20', gender: 'Male',
      monthlySalary: 12000, annualBonus: 1, salaryIncrement: 0.02,
      statementDate: '2025-01-01',
      oaBalance: 320000, saBalance: 150000, maBalance: 68000, raBalance: 0,
      housingLoan: 0, housingTillAge: 0, housingStartDate: '',
      cpfisOA: 0, cpfisSA: 0, cpfisOATillAge: 55, cpfisSATillAge: 55,
      shieldIP: true, metFRS: false, cpfLifePayout: 0,
      desiredMonthlyIncome: 5000, investmentReturn: 0.025,
      savingsPlans: [
        { maturityAge: 55, maturityValue: 150000, company: 'AIA', policyNo: 'A789012', policyType: 'Endowment', annualPremium: 6000, remarks: 'Maturing at 55' },
        { maturityAge: 65, maturityValue: 50000, company: 'GE Life', policyNo: 'G345678', policyType: 'Whole Life', annualPremium: 0, remarks: 'Paid up' },
      ],
      investmentPlans: [],
      rentalIncome: [],
      regularPayouts: [],
    },
  },
];

const COLOR_MAP = {
  blue:  { border: 'border-blue-400',  bg: 'bg-blue-50',  text: 'text-blue-700',  btn: 'bg-blue-600 hover:bg-blue-700',  badge: 'bg-blue-100 text-blue-700'  },
  green: { border: 'border-green-400', bg: 'bg-green-50', text: 'text-green-700', btn: 'bg-green-600 hover:bg-green-700', badge: 'bg-green-100 text-green-700' },
  amber: { border: 'border-amber-400', bg: 'bg-amber-50', text: 'text-amber-700', btn: 'bg-amber-600 hover:bg-amber-700', badge: 'bg-amber-100 text-amber-700' },
};

function formatCurrency(value) {
  return '$' + value.toLocaleString('en-SG');
}

export default function SamplePresets({ setInputs }) {
  return (
    <div className="mb-6">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
        Sample Client Profiles
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {PRESETS.map((preset) => {
          const c = COLOR_MAP[preset.color];
          const totalCPF =
            preset.data.oaBalance +
            preset.data.saBalance +
            preset.data.maBalance +
            preset.data.raBalance;

          return (
            <div
              key={preset.label}
              className={`rounded-lg border-l-4 ${c.border} ${c.bg} p-4 flex flex-col gap-2`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-sm font-bold ${c.text}`}>{preset.label}</span>
              </div>

              <p className="text-xs text-gray-600">
                <span className="font-medium">{preset.data.name}</span>
                {' '}&middot;{' '}
                {preset.data.gender}
              </p>

              <div className="flex flex-wrap gap-2 text-xs">
                <span className={`px-2 py-0.5 rounded-full font-medium ${c.badge}`}>
                  Salary {formatCurrency(preset.data.monthlySalary)}/mo
                </span>
                <span className={`px-2 py-0.5 rounded-full font-medium ${c.badge}`}>
                  CPF {formatCurrency(totalCPF)}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setInputs(preset.data)}
                className={`mt-auto w-full text-center text-xs font-semibold text-white rounded-md px-3 py-2 ${c.btn} transition-colors cursor-pointer`}
              >
                Load Profile
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
