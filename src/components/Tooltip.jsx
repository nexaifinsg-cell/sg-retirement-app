import { useState } from 'react';

const CPF_TERMS = {
  OA: 'Ordinary Account - Can be used for housing, insurance, investment, and education.',
  SA: 'Special Account - For retirement and investment in retirement-related products.',
  MA: 'MediSave Account - For hospitalisation expenses and approved medical insurance.',
  RA: 'Retirement Account - Created at age 55, combines OA and SA savings for retirement.',
  FRS: 'Full Retirement Sum - The amount set aside at 55 to receive CPF Life payouts for life.',
  BRS: 'Basic Retirement Sum - Half of FRS. For those who pledge their property.',
  ERS: 'Enhanced Retirement Sum - 1.5x FRS. For higher monthly payouts.',
  BHS: 'Basic Healthcare Sum - Maximum amount in MediSave Account.',
  'CPF Life': 'CPF Lifelong Income For the Elderly - National annuity scheme providing monthly payouts from age 65.',
  'OW Ceiling': 'Ordinary Wage Ceiling - Maximum monthly salary on which CPF is computed.',
  'AW Ceiling': 'Additional Wage Ceiling - Maximum annual salary (including bonus) on which CPF is computed.',
};

export default function Tooltip({ term, children }) {
  const [show, setShow] = useState(false);
  const definition = CPF_TERMS[term];
  if (!definition) return children || term;

  return (
    <span
      className="relative inline-flex items-center cursor-help"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children || term}
      <svg className="ml-1 h-3.5 w-3.5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      {show && (
        <span className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2.5 text-xs font-normal text-white bg-gray-900 rounded-lg shadow-lg">
          <span className="font-semibold text-amber-300">{term}</span>
          <br />
          {definition}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
        </span>
      )}
    </span>
  );
}
