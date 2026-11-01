// Shared data for Meridian. It starts empty: businesses, files, family holdings and loans are added
// through the app (see registerCompany and the Data Import page) and kept in the viewer's browser.

export const QTRS = ['Q3 FY25','Q4 FY25','Q1 FY26','Q2 FY26','Q3 FY26','Q4 FY26','Q1 FY27','Q2 FY27'];
export const MONTHS12 = ['Nov 25','Dec 25','Jan 26','Feb 26','Mar 26','Apr 26','May 26','Jun 26','Jul 26','Aug 26','Sep 26','Oct 26'];
export const MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];


/* ---------- documents (imported files, originals kept untouched) ---------- */
export const DOCS = [];
export const BS_ROWS = { cash:6, receivables:9, inventory:12, plant:16, land:18, other:21, debt:30, payables:34, advances:36, otherL:39 };

/* ---------- companies ---------- */
export const COMPANIES = [];
export const CO = Object.fromEntries(COMPANIES.map(c => [c.id, c]));

/* ---------- family assets outside the businesses ---------- */
export const FAMILY = { investments:[], property:[], cash:0, vehicles:0, gold:0, loans:[] };

/* ---------- market prices (empty until a price feed is connected) ---------- */
export const MARKET = {
  gold:{ n:'Gold, 24 carat', unit:'₹ per 10 g', s:[] },
  palm:{ n:'Crude palm oil', unit:'₹ per 10 kg', s:[] },
  crude:{ n:'Brent crude', unit:'$ per barrel', s:[] },
  jute:{ n:'Raw jute (TD-3)', unit:'₹ per quintal', s:[] },
  pulp:{ n:'Fluff pulp', unit:'$ per tonne', s:[] },
};

export const LENDERS = [];

export const SELLABLE = [];

export const FUND_META = {
  grat:{ n:'Gratuity', grp:'Employee benefits', charge:'accrual' },
  pf:{ n:'Provident fund dues', grp:'Employee benefits', charge:'catch' },
  bonus:{ n:'Accrued bonus', grp:'Employee benefits', charge:'catch' },
  leave:{ n:'Unpaid leave', grp:'Employee benefits', charge:'catch' },
  pay:{ n:'Pending salary and overtime', grp:'Employee benefits', charge:'full' },
  cont:{ n:'Contingency reserve', grp:'Possible liabilities', charge:'catch' },
  bad:{ n:'Bad debt provision', grp:'Customers who may not pay', charge:'full' },
  repl:{ n:'Replacement and repair fund', grp:'Machinery and buildings', charge:'catch' },
  stock:{ n:'Stock loss provision', grp:'Stock and raw material', charge:'full' },
  emer:{ n:'Emergency reserve', grp:'Running costs cover', charge:'catch' },
};


export const YEARS = 10, FD_RATE = 0.0715, CASH_RATE = 0.035, INV_RATE = 0.10, PROP_RATE = 0.06;
