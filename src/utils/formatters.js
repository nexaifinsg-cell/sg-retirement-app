export const formatCurrency = (val) => {
  if (val == null || isNaN(val)) return '$0';
  const abs = Math.abs(val);
  const formatted = abs.toLocaleString('en-SG', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  return val < 0 ? `($${formatted})` : `$${formatted}`;
};

export const formatCurrencyDecimal = (val) => {
  if (val == null || isNaN(val)) return '$0.00';
  return `$${val.toLocaleString('en-SG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const formatPercent = (val) => {
  if (val == null || isNaN(val)) return '0.0%';
  return `${(val * 100).toFixed(1)}%`;
};

export const formatAge = (dob) => {
  if (!dob) return 0;
  const today = new Date();
  const birth = new Date(dob);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
};

export const getYearAt55 = (dob) => {
  if (!dob) return new Date().getFullYear();
  return new Date(dob).getFullYear() + 55;
};

export const isBornBefore1975 = (dob) => {
  if (!dob) return false;
  return new Date(dob).getFullYear() < 1975;
};
