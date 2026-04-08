// Historical Full Retirement Sum and Basic Healthcare Sum
export const FRS_DATA = [
  { year: 2003, frs: 80000, bhs: 30000 },
  { year: 2004, frs: 84500, bhs: 30500 },
  { year: 2005, frs: 90000, bhs: 32500 },
  { year: 2006, frs: 94600, bhs: 33000 },
  { year: 2007, frs: 99600, bhs: 33500 },
  { year: 2008, frs: 106000, bhs: 34500 },
  { year: 2009, frs: 117000, bhs: 37000 },
  { year: 2010, frs: 123000, bhs: 39500 },
  { year: 2011, frs: 131000, bhs: 41000 },
  { year: 2012, frs: 139000, bhs: 43500 },
  { year: 2013, frs: 148000, bhs: 45500 },
  { year: 2014, frs: 155000, bhs: 48500 },
  { year: 2015, frs: 161000, bhs: 48500 },
  { year: 2016, frs: 161000, bhs: 49800 },
  { year: 2017, frs: 166000, bhs: 52000 },
  { year: 2018, frs: 171000, bhs: 54500 },
  { year: 2019, frs: 176000, bhs: 57200 },
  { year: 2020, frs: 181000, bhs: 60000 },
  { year: 2021, frs: 186000, bhs: 63000 },
  { year: 2022, frs: 192000, bhs: 66000 },
  { year: 2023, frs: 198800, bhs: 68500 },
  { year: 2024, frs: 205800, bhs: 71500 },
  { year: 2025, frs: 213000, bhs: 75500 },
  { year: 2026, frs: 220400, bhs: 78200 },
  { year: 2027, frs: 228200, bhs: 81100 },
];

const FRS_GROWTH = 0.035;
const BHS_GROWTH = 0.035;

export function getFRS(year) {
  const entry = FRS_DATA.find(d => d.year === year);
  if (entry) return entry.frs;
  const last = FRS_DATA[FRS_DATA.length - 1];
  if (year > last.year) {
    return Math.round(last.frs * Math.pow(1 + FRS_GROWTH, year - last.year));
  }
  return FRS_DATA[0].frs;
}

export function getBHS(year) {
  const entry = FRS_DATA.find(d => d.year === year);
  if (entry) return entry.bhs;
  const last = FRS_DATA[FRS_DATA.length - 1];
  if (year > last.year) {
    return Math.round(last.bhs * Math.pow(1 + BHS_GROWTH, year - last.year));
  }
  return FRS_DATA[0].bhs;
}

export function getBRS(year) {
  return Math.round(getFRS(year) / 2);
}

export function getERS(year) {
  return Math.round(getFRS(year) * 1.5);
}
