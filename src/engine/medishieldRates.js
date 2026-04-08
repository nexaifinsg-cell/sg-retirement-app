// MediShield Life premiums @ 9% GST + Available Withdrawal Limit (AWL)
// From Ref sheet columns W, X, Y
const MSL_RATES = [
  { age: 0, msl: 0, awl: 0 },
  { age: 1, msl: 148, awl: 300 },
  { age: 21, msl: 255, awl: 300 },
  { age: 31, msl: 397, awl: 300 },
  { age: 41, msl: 535, awl: 600 },
  { age: 51, msl: 815, awl: 600 },
  { age: 61, msl: 1039, awl: 600 },
  { age: 66, msl: 1121, awl: 600 },
  { age: 71, msl: 1217, awl: 900 },
  { age: 74, msl: 1345, awl: 900 },
  { age: 76, msl: 1559, awl: 900 },
];

export function getMSLPremium(age) {
  let rate = MSL_RATES[0];
  for (const r of MSL_RATES) {
    if (age >= r.age) rate = r;
  }
  return { msl: rate.msl, awl: rate.awl, total: rate.msl + rate.awl };
}

// ElderShield 400 premiums by age of entry and gender
const ELDERSHIELD_400 = {
  male: [
    { age: 40, premium: 176.60 }, { age: 41, premium: 183.73 },
    { age: 42, premium: 191.48 }, { age: 43, premium: 199.97 },
    { age: 44, premium: 209.30 }, { age: 45, premium: 219.56 },
    { age: 46, premium: 230.92 }, { age: 47, premium: 243.52 },
    { age: 48, premium: 257.60 }, { age: 49, premium: 273.36 },
    { age: 50, premium: 291.14 }, { age: 51, premium: 311.32 },
    { age: 52, premium: 334.44 }, { age: 53, premium: 361.13 },
    { age: 54, premium: 392.30 }, { age: 55, premium: 429.16 },
    { age: 56, premium: 473.41 }, { age: 57, premium: 527.48 },
    { age: 58, premium: 595.00 }, { age: 59, premium: 681.67 },
    { age: 60, premium: 797.06 }, { age: 61, premium: 958.30 },
    { age: 62, premium: 1199.67 }, { age: 63, premium: 1601.08 },
    { age: 64, premium: 2402.41 },
  ],
  female: [
    { age: 40, premium: 219.80 }, { age: 41, premium: 229.23 },
    { age: 42, premium: 239.51 }, { age: 43, premium: 250.73 },
    { age: 44, premium: 263.04 }, { age: 45, premium: 276.59 },
    { age: 46, premium: 291.57 }, { age: 47, premium: 308.17 },
    { age: 48, premium: 326.71 }, { age: 49, premium: 347.45 },
    { age: 50, premium: 370.83 }, { age: 51, premium: 397.38 },
    { age: 52, premium: 427.75 }, { age: 53, premium: 462.84 },
    { age: 54, premium: 503.79 }, { age: 55, premium: 552.21 },
    { age: 56, premium: 610.33 }, { age: 57, premium: 681.34 },
    { age: 58, premium: 770.07 }, { age: 59, premium: 884.13 },
    { age: 60, premium: 1036.15 }, { age: 61, premium: 1248.90 },
    { age: 62, premium: 1567.87 }, { age: 63, premium: 2099.13 },
    { age: 64, premium: 3160.89 },
  ],
};

// CareShield Life annual premiums (approx, from 2020 onwards)
const CARESHIELD_ANNUAL = 600; // base annual premium

export function getElderShieldPremium(age, gender = 'Male') {
  const genderKey = gender === 'Male' ? 'male' : 'female';
  const table = ELDERSHIELD_400[genderKey];
  const entry = table.find(e => e.age === age);
  return entry ? entry.premium : 0;
}

export function getCareShieldPremium(age) {
  // CareShield Life premiums are payable from age 30 to 65
  if (age >= 30 && age <= 65) return CARESHIELD_ANNUAL;
  return 0;
}
