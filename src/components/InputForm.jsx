import { formatAge } from '../utils/formatters';

export default function InputForm({ inputs, setInputs }) {
  const age = formatAge(inputs.dob);
  const isAbove55 = age > 55;

  const handleChange = (field) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked :
      e.target.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value;
    setInputs(prev => ({ ...prev, [field]: val }));
  };

  const Label = ({ htmlFor, children, hint }) => (
    <div className="mb-1">
      <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-700">
        {children}
      </label>
      {hint && <p className="text-xs text-gray-400 mt-0.5">{hint}</p>}
    </div>
  );

  const Input = ({ id, type = 'text', value, onChange, prefix, step, min, max, placeholder }) => (
    <div className="relative">
      {prefix && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">
          {prefix}
        </span>
      )}
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        step={step}
        min={min}
        max={max}
        placeholder={placeholder}
        className={`w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm
          focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none
          ${prefix ? 'pl-7' : ''}`}
      />
    </div>
  );

  const Section = ({ title, children }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 mb-5">
      <h3 className="text-primary font-semibold text-base mb-4 pb-2 border-b border-gray-100">
        {title}
      </h3>
      {children}
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Personal Information */}
      <Section title="Personal Information">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="name">Client Name</Label>
            <Input id="name" value={inputs.name} onChange={handleChange('name')} placeholder="Full name" />
          </div>
          <div>
            <Label htmlFor="dob" hint="Used to determine CPF rates and milestones">Date of Birth</Label>
            <Input id="dob" type="date" value={inputs.dob} onChange={handleChange('dob')} />
            {inputs.dob && formatAge(inputs.dob) < 18 && (
              <p className="text-xs text-red-500 mt-1">Age must be at least 18</p>
            )}
            {inputs.dob && formatAge(inputs.dob) > 0 && (
              <p className="text-xs text-gray-500 mt-1">Age: {formatAge(inputs.dob)} years old</p>
            )}
          </div>
          <div>
            <Label htmlFor="gender">Gender</Label>
            <select
              id="gender"
              value={inputs.gender}
              onChange={handleChange('gender')}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm
                focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>
        </div>
      </Section>

      {/* Employment Details */}
      <Section title="Employment Details">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="monthlySalary">Monthly Salary</Label>
            <Input
              id="monthlySalary"
              type="number"
              value={inputs.monthlySalary}
              onChange={handleChange('monthlySalary')}
              prefix="$"
              min={0}
              step={100}
            />
            {inputs.monthlySalary > 0 && inputs.monthlySalary < 500 && (
              <p className="text-xs text-amber-500 mt-1">Salary seems low - minimum $500 for CPF</p>
            )}
          </div>
          <div>
            <Label htmlFor="annualBonus" hint="Number of months (e.g. 1 = 1 month AWS)">Annual Bonus</Label>
            <Input
              id="annualBonus"
              type="number"
              value={inputs.annualBonus}
              onChange={handleChange('annualBonus')}
              min={0}
              step={0.5}
            />
          </div>
          <div>
            <Label htmlFor="salaryIncrement" hint="Annual increment rate (e.g. 0.03 = 3%)">Salary Increment</Label>
            <Input
              id="salaryIncrement"
              type="number"
              value={inputs.salaryIncrement}
              onChange={handleChange('salaryIncrement')}
              min={0}
              max={1}
              step={0.005}
            />
          </div>
        </div>
      </Section>

      {/* CPF Account Balances */}
      <Section title="CPF Account Balances">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <Label htmlFor="statementDate" hint="Date of the CPF statement used">Statement Date</Label>
            <Input id="statementDate" type="date" value={inputs.statementDate} onChange={handleChange('statementDate')} />
            {!inputs.statementDate && (
              <p className="text-xs text-amber-500 mt-1">Required for projection</p>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="oaBalance">Ordinary Account (OA)</Label>
            <Input
              id="oaBalance"
              type="number"
              value={inputs.oaBalance}
              onChange={handleChange('oaBalance')}
              prefix="$"
              min={0}
              step={1000}
            />
          </div>
          <div>
            <Label htmlFor="saBalance">Special Account (SA)</Label>
            <Input
              id="saBalance"
              type="number"
              value={inputs.saBalance}
              onChange={handleChange('saBalance')}
              prefix="$"
              min={0}
              step={1000}
            />
          </div>
          <div>
            <Label htmlFor="maBalance">MediSave Account (MA)</Label>
            <Input
              id="maBalance"
              type="number"
              value={inputs.maBalance}
              onChange={handleChange('maBalance')}
              prefix="$"
              min={0}
              step={1000}
            />
          </div>
        </div>

        {/* Above 55 fields */}
        {isAbove55 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs font-medium text-accent mb-3 uppercase tracking-wide">For Above 55</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="raBalance">Retirement Account (RA)</Label>
                <Input
                  id="raBalance"
                  type="number"
                  value={inputs.raBalance}
                  onChange={handleChange('raBalance')}
                  prefix="$"
                  min={0}
                  step={1000}
                />
              </div>
              <div className="flex items-center gap-3 pt-6">
                <input
                  id="metFRS"
                  type="checkbox"
                  checked={inputs.metFRS}
                  onChange={handleChange('metFRS')}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <Label htmlFor="metFRS" hint="Has the client met the Full Retirement Sum?">Met FRS</Label>
              </div>
              <div>
                <Label htmlFor="cpfLifePayout" hint="Monthly CPF LIFE payout (if already receiving)">CPF LIFE Payout</Label>
                <Input
                  id="cpfLifePayout"
                  type="number"
                  value={inputs.cpfLifePayout}
                  onChange={handleChange('cpfLifePayout')}
                  prefix="$"
                  min={0}
                  step={50}
                />
              </div>
            </div>
          </div>
        )}
      </Section>

      {/* CPF Deductions */}
      <Section title="CPF Deductions">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <Label htmlFor="housingLoan" hint="Monthly CPF deduction for housing loan">Housing Loan (Monthly)</Label>
            <Input
              id="housingLoan"
              type="number"
              value={inputs.housingLoan}
              onChange={handleChange('housingLoan')}
              prefix="$"
              min={0}
              step={100}
            />
          </div>
          <div>
            <Label htmlFor="housingTillAge" hint="Age when housing loan will be fully paid">Housing Loan Till Age</Label>
            <Input
              id="housingTillAge"
              type="number"
              value={inputs.housingTillAge}
              onChange={handleChange('housingTillAge')}
              min={0}
              max={99}
              step={1}
            />
          </div>
          <div>
            <Label htmlFor="housingStartDate" hint="Start date of current housing loan deduction">Housing Loan Start Date</Label>
            <Input id="housingStartDate" type="date" value={inputs.housingStartDate} onChange={handleChange('housingStartDate')} />
          </div>
        </div>

        <p className="text-xs font-medium text-gray-500 mb-3 uppercase tracking-wide">CPFIS Investments</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="cpfisOA" hint="Amount invested under CPFIS-OA">CPFIS-OA Amount</Label>
            <Input
              id="cpfisOA"
              type="number"
              value={inputs.cpfisOA}
              onChange={handleChange('cpfisOA')}
              prefix="$"
              min={0}
              step={1000}
            />
          </div>
          <div>
            <Label htmlFor="cpfisSA" hint="Amount invested under CPFIS-SA">CPFIS-SA Amount</Label>
            <Input
              id="cpfisSA"
              type="number"
              value={inputs.cpfisSA}
              onChange={handleChange('cpfisSA')}
              prefix="$"
              min={0}
              step={1000}
            />
          </div>
          <div>
            <Label htmlFor="cpfisOATillAge" hint="Age when CPFIS-OA investments will be liquidated">CPFIS-OA Till Age</Label>
            <Input
              id="cpfisOATillAge"
              type="number"
              value={inputs.cpfisOATillAge}
              onChange={handleChange('cpfisOATillAge')}
              min={0}
              max={99}
              step={1}
            />
          </div>
          <div>
            <Label htmlFor="cpfisSATillAge" hint="Age when CPFIS-SA investments will be liquidated">CPFIS-SA Till Age</Label>
            <Input
              id="cpfisSATillAge"
              type="number"
              value={inputs.cpfisSATillAge}
              onChange={handleChange('cpfisSATillAge')}
              min={0}
              max={99}
              step={1}
            />
          </div>
        </div>
      </Section>

      {/* MediSave Details */}
      <Section title="MediSave Details">
        <div className="flex items-center gap-3">
          <input
            id="shieldIP"
            type="checkbox"
            checked={inputs.shieldIP}
            onChange={handleChange('shieldIP')}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <Label htmlFor="shieldIP" hint="Does the client have an Integrated Shield Plan with MediSave deduction?">
            Integrated Shield Plan (IP)
          </Label>
        </div>
      </Section>

      {/* Retirement Goals */}
      <Section title="Retirement Goals">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="desiredMonthlyIncome" hint="Target monthly retirement income in today's dollars">
              Desired Monthly Income
            </Label>
            <Input
              id="desiredMonthlyIncome"
              type="number"
              value={inputs.desiredMonthlyIncome}
              onChange={handleChange('desiredMonthlyIncome')}
              prefix="$"
              min={0}
              step={500}
            />
          </div>
          <div>
            <Label htmlFor="investmentReturn" hint="Expected annual return on investments (e.g. 0.025 = 2.5%)">
              Investment Return Rate
            </Label>
            <Input
              id="investmentReturn"
              type="number"
              value={inputs.investmentReturn}
              onChange={handleChange('investmentReturn')}
              min={0}
              max={1}
              step={0.005}
            />
          </div>
        </div>
      </Section>
    </div>
  );
}
