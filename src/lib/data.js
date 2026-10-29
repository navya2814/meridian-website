// Sample data for Meridian. Every figure here is illustrative and is labelled "Sample data" in the app.
// Replace it with real imported books before relying on any number.

export const QTRS = ['Q3 FY25','Q4 FY25','Q1 FY26','Q2 FY26','Q3 FY26','Q4 FY26','Q1 FY27','Q2 FY27'];
export const MONTHS12 = ['Nov 25','Dec 25','Jan 26','Feb 26','Mar 26','Apr 26','May 26','Jun 26','Jul 26','Aug 26','Sep 26','Oct 26'];
export const MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];


/* ---------- documents (imported files, originals kept untouched) ---------- */
export const DOCS = [
  { id:'d1', file:'HHL_Consolidated_BalanceSheet_Sep2026.xlsx', co:'hyg', unit:'All units', type:'Balance sheet', date:'2026-10-04', rows:62 },
  { id:'d2', file:'HHL_Siliguri_PnL_Q2FY27.xlsx', co:'hyg', unit:'Siliguri unit', type:'Profit and loss', date:'2026-10-04', rows:48 },
  { id:'d3', file:'HHL_Guwahati_PnL_Q2FY27.xlsx', co:'hyg', unit:'Guwahati unit', type:'Profit and loss', date:'2026-10-04', rows:44 },
  { id:'d4', file:'EEO_BalanceSheet_Sep2026.xlsx', co:'oil', unit:'All units', type:'Balance sheet', date:'2026-10-03', rows:58 },
  { id:'d5', file:'EEO_Haldia_StockRegister_Sep2026.csv', co:'oil', unit:'Haldia refinery', type:'Stock register', date:'2026-10-03', rows:311 },
  { id:'d6', file:'EEO_GeneralLedger_FY27_H1.xlsx', co:'oil', unit:'All units', type:'Ledger', date:'2026-10-02', rows:2840 },
  { id:'d7', file:'BJM_BalanceSheet_Sep2026.xlsx', co:'jute', unit:'All units', type:'Balance sheet', date:'2026-10-05', rows:55 },
  { id:'d8', file:'BJM_Titagarh_CashBook_Sep2026.csv', co:'jute', unit:'Titagarh mill', type:'Cash book', date:'2026-10-05', rows:406 },
  { id:'d9', file:'BJM_Wages_Register_Sep2026.xlsx', co:'jute', unit:'All units', type:'Staff register', date:'2026-10-05', rows:652 },
  { id:'d10', file:'JJ_BalanceSheet_Sep2026.xlsx', co:'jj', unit:'All units', type:'Balance sheet', date:'2026-10-01', rows:51 },
  { id:'d11', file:'JJ_StockRegister_Jul2026.xlsx', co:'jj', unit:'Park Street showroom', type:'Stock register', date:'2026-07-27', rows:1912 },
  { id:'d12', file:'JJ_ParkStreet_CashBook_Sep2026.csv', co:'jj', unit:'Park Street showroom', type:'Cash book', date:'2026-10-01', rows:388 },
  { id:'d13', file:'Staff_Master_AllCompanies_Aug2026.xlsx', co:'all', unit:'All units', type:'Staff register', date:'2026-08-31', rows:1338 },
  { id:'d14', file:'Debtors_Ageing_AllCompanies_Sep2026.xlsx', co:'all', unit:'All units', type:'Ledger', date:'2026-10-02', rows:524 },
  { id:'d15', file:'Family_Investments_Statement_Sep2026.pdf', co:'fam', unit:'Family office', type:'Investment statement', date:'2026-10-03', rows:36 },
  { id:'d16', file:'Fixed_Asset_Register_FY27.xlsx', co:'all', unit:'All units', type:'Asset register', date:'2026-09-20', rows:214 },
];
export const BS_ROWS = { cash:6, receivables:9, inventory:12, plant:16, land:18, other:21, debt:30, payables:34, advances:36, otherL:39 };

/* ---------- companies ---------- */
export const COMPANIES = [
 { id:'hyg', name:'Himgiri Hygiene Limited', short:'Himgiri Hygiene', industry:'Hygiene products: diapers, sanitary pads, wipes',
   theme:{ main:'#1F7A73', bright:'#5DBDB2', deep:'#0D3330', deepD:'#081F1D', tintL:'#EDF5F3', tintD:'#0E1817', mainD:'#4FB3A9' },
   bsDoc:'d1', plDoc:'d2',
   rev:[9.2,9.6,9.9,10.1,10.6,11.0,11.3,11.9], mar:[9.8,10.1,10.4,10.6,10.9,11.2,11.4,11.6],
   debtHist:[7.2,7.0,6.8,6.6,6.3,6.0,5.8,5.5], invDays:[41,40,40,39,38,38,37,36],
   capital:18, g:0.12, rate:0.095,
   bs:{ cash:3.4, receivables:5.2, inventory:4.1, plant:11.8, land:6.5, other:1.0, debt:5.5, payables:3.6, advances:0, otherL:1.4 },
   fixedMonthly:0.85, cashDays:52, rawDep:0.46, rawName:'Fluff pulp and polymers', topCust:0.18, topCustName:'Regional distributor (East)',
   staff:380, basic:15500, years:5.8, leaveDays:10, pfMonths:1, pendingPay:0.06,
   aging:[3.1,1.4,0.5,0.2],
   assets:[ {n:'Diaper line 1',cost:6.0,age:7,life:12},{n:'Wipes line',cost:2.2,age:3,life:10},{n:'Delivery vans (6)',cost:0.6,age:5,life:8},{n:'Factory building, Siliguri',cost:4.0,age:12,life:40} ],
   stockLoss:0.035, contingencies:[ {n:'GST input credit dispute',a:0.45,p:0.4},{n:'Product return and warranty claims',a:0.20,p:0.6} ],
   set:{ grat:1.75, pf:0.14, bonus:0.18, leave:0.18, pay:0.06, cont:0.22, bad:0.26, repl:4.9, stock:0.12, emer:2.9 },
   market:{ key:'pulp', sens:-0.09, label:'Fluff pulp price' },
   seasonal:[1.0,1.0,1.05,1.0,1.1,0.95,0.95,1.0,0.95,1.0,1.0,1.0],
   factories:[ {n:'Siliguri unit',what:'Diapers and sanitary pads',rev:0.62,staff:240,doc:'d2'},{n:'Guwahati unit',what:'Wet wipes',rev:0.30,staff:110,doc:'d3'},{n:'Kolkata warehouse',what:'Distribution',rev:0.08,staff:30,doc:'d1'} ] },
 { id:'oil', name:'Eastern Edible Oils', short:'Eastern Edible Oils', industry:'Edible oil refining and packing',
   theme:{ main:'#A87B14', bright:'#E2B85A', deep:'#33260A', deepD:'#1E1606', tintL:'#FAF4E4', tintD:'#18130A', mainD:'#DDB04F' },
   bsDoc:'d4', plDoc:'d6',
   rev:[21.0,22.4,20.8,21.6,22.1,23.0,21.9,22.6], mar:[4.6,4.4,4.1,4.3,3.9,3.7,3.8,3.6],
   debtHist:[16.4,16.9,16.6,16.8,17.1,16.9,16.7,16.8], invDays:[48,50,52,51,53,55,54,56],
   capital:24, g:0.05, rate:0.102,
   bs:{ cash:2.1, receivables:9.8, inventory:12.6, plant:14.2, land:7.9, other:1.4, debt:16.8, payables:7.9, advances:0, otherL:1.3 },
   fixedMonthly:1.1, cashDays:78, rawDep:0.82, rawName:'Crude palm and soybean oil', topCust:0.31, topCustName:'Modern trade chain',
   staff:210, basic:18000, years:8.2, leaveDays:12, pfMonths:1, pendingPay:0.09,
   aging:[5.9,2.6,0.9,0.4],
   assets:[ {n:'Refinery plant, Haldia',cost:9.5,age:14,life:20},{n:'Packing line',cost:2.0,age:6,life:10},{n:'Road tankers (4)',cost:1.1,age:7,life:10},{n:'Storage tanks',cost:2.4,age:10,life:25} ],
   stockLoss:0.05, contingencies:[ {n:'Customs duty demand on imported crude oil',a:0.80,p:0.35},{n:'Food safety labelling penalty',a:0.15,p:0.5},{n:'Bank guarantee given for jute mill loan',a:2.0,p:0.05} ],
   set:{ grat:1.65, pf:0.18, bonus:0.16, leave:0.14, pay:0.09, cont:0.30, bad:0.42, repl:7.9, stock:0.42, emer:3.1 },
   market:{ key:'palm', sens:-0.16, label:'Crude palm oil price' },
   seasonal:[1.05,1.0,0.95,0.9,0.9,0.95,0.95,1.0,1.05,1.15,1.1,1.0],
   factories:[ {n:'Haldia refinery',what:'Refining',rev:0.71,staff:150,doc:'d5'},{n:'Kolkata packing unit',what:'Packing and dispatch',rev:0.29,staff:60,doc:'d6'} ] },
 { id:'jute', name:'Bengal Jute Mills', short:'Bengal Jute Mills', industry:'Jute yarn, sacking and bags',
   theme:{ main:'#4B6187', bright:'#93A9D2', deep:'#1B2537', deepD:'#101622', tintL:'#EEF1F7', tintD:'#11151D', mainD:'#8FA6CF' },
   bsDoc:'d7', plDoc:'d8',
   rev:[6.1,5.8,6.4,6.9,6.6,6.2,6.8,7.3], mar:[6.8,6.5,7.0,7.4,7.2,6.9,7.5,7.8],
   debtHist:[5.4,5.2,5.0,4.9,4.7,4.5,4.4,4.2], invDays:[70,74,66,60,68,72,64,58],
   capital:11, g:0.06, rate:0.10,
   bs:{ cash:1.3, receivables:3.4, inventory:4.6, plant:6.2, land:4.1, other:0.4, debt:4.2, payables:2.3, advances:0, otherL:0.6 },
   fixedMonthly:0.6, cashDays:64, rawDep:0.58, rawName:'Raw jute fibre', topCust:0.44, topCustName:'Government sacking orders',
   staff:640, basic:12500, years:11.5, leaveDays:14, pfMonths:2, pendingPay:0.11,
   aging:[1.8,0.9,0.4,0.3],
   assets:[ {n:'Spinning frames',cost:3.8,age:18,life:25},{n:'Looms',cost:2.6,age:15,life:20},{n:'Mill building, Titagarh',cost:3.5,age:40,life:60} ],
   stockLoss:0.045, contingencies:[ {n:'Wage arrears dispute (labour court)',a:0.60,p:0.5},{n:'Pollution board penalty',a:0.10,p:0.3} ],
   set:{ grat:3.6, pf:0.20, bonus:0.22, leave:0.20, pay:0.06, cont:0.12, bad:0.24, repl:6.2, stock:0.16, emer:2.0 },
   market:{ key:'jute', sens:-0.11, label:'Raw jute price' },
   seasonal:[0.95,0.9,0.95,1.0,1.05,1.0,0.85,0.8,0.85,1.1,1.2,1.15],
   factories:[ {n:'Titagarh mill',what:'Yarn and sacking',rev:0.64,staff:420,doc:'d8'},{n:'Naihati mill',what:'Bags and fabric',rev:0.36,staff:220,doc:'d7'} ] },
 { id:'jj', name:'JJ Jewelers', short:'JJ Jewelers', industry:'Gold and diamond jewellery retail',
   theme:{ main:'#B4553A', bright:'#E7957A', deep:'#3B1A11', deepD:'#22100A', tintL:'#F9EEEA', tintD:'#1B1210', mainD:'#E38B6F' },
   bsDoc:'d10', plDoc:'d12',
   rev:[16.2,12.8,13.4,14.9,15.1,11.6,12.2,13.1], mar:[6.4,6.0,5.7,5.5,5.2,4.6,4.4,4.1],
   debtHist:[12.1,12.8,13.6,14.2,15.0,15.8,16.6,17.5], invDays:[248,262,270,276,284,296,305,318],
   capital:32, g:-0.02, rate:0.11,
   bs:{ cash:0.9, receivables:2.1, inventory:38.5, plant:2.4, land:9.0, other:0.6, debt:17.5, payables:4.4, advances:3.1, otherL:0.5 },
   fixedMonthly:0.75, cashDays:296, rawDep:0.88, rawName:'Gold', topCust:0.07, topCustName:'Largest wedding client',
   staff:85, basic:24000, years:9.0, leaveDays:12, pfMonths:2, pendingPay:0.04,
   aging:[0.9,0.5,0.3,0.4],
   assets:[ {n:'Showroom fit-out, Park Street',cost:1.6,age:6,life:10},{n:'Workshop tools and casting',cost:0.5,age:4,life:8},{n:'Vaults and security systems',cost:0.3,age:3,life:7} ],
   stockLoss:0.022, contingencies:[ {n:'Income tax reassessment',a:1.20,p:0.3},{n:'Hallmarking compliance penalty',a:0.08,p:0.4},{n:'Gold savings scheme redemption claims',a:0.25,p:0.5} ],
   set:{ grat:0.9, pf:0.08, bonus:0.08, leave:0.08, pay:0.03, cont:0.30, bad:0.28, repl:1.1, stock:0.62, emer:1.6 },
   market:{ key:'gold', sens:0.03, label:'Gold price' },
   seasonal:[0.9,0.95,0.9,1.15,1.15,0.85,0.8,0.8,0.85,1.35,1.4,1.0],
   factories:[ {n:'Park Street showroom',what:'Flagship retail',rev:0.66,staff:48,doc:'d12'},{n:'Siliguri showroom',what:'Retail',rev:0.26,staff:22,doc:'d10'},{n:'Kolkata workshop',what:'Karigar unit',rev:0.08,staff:15,doc:'d11'} ] },
];
export const CO = Object.fromEntries(COMPANIES.map(c => [c.id, c]));

/* ---------- family assets outside the businesses ---------- */
export const FAMILY = {
  investments:[
    { n:'Listed equity portfolio', type:'Stocks', inv:5.2, val:6.8, ret1y:0.142, doc:'d15', row:8 },
    { n:'Equity mutual funds', type:'Mutual funds', inv:7.1, val:9.4, ret1y:0.128, doc:'d15', row:14 },
    { n:'Debt mutual funds', type:'Mutual funds', inv:1.9, val:2.1, ret1y:0.071, doc:'d15', row:17 },
    { n:'Bank fixed deposits', type:'Fixed deposits', inv:5.0, val:5.0, ret1y:0.0715, doc:'d15', row:22 },
    { n:'Sovereign gold bonds', type:'Bonds', inv:1.2, val:2.0, ret1y:0.21, doc:'d15', row:26 },
  ],
  property:[ { n:'Family residence, Kolkata', val:14.0, doc:'d15', row:31 }, { n:'Land parcel, Siliguri', val:4.5, doc:'d15', row:32 } ],
  cash:1.6, vehicles:0.9, gold:2.2,
  loans:[ { n:'Home loan', amt:2.8, rate:0.088, emi:0.031, yrs:11 }, { n:'Vehicle loan', amt:0.3, rate:0.095, emi:0.009, yrs:3 } ],
};

/* ---------- market (sample, illustrative) ---------- */
export const MARKET = {
  gold:{ n:'Gold, 24 carat', unit:'₹ per 10 g', s:[121000,124500,127800,131200,129400,133600,136900,135200,138800,141500,139900,143200] },
  palm:{ n:'Crude palm oil', unit:'₹ per 10 kg', s:[1090,1065,1040,1015,1050,1085,1120,1150,1135,1170,1195,1210] },
  crude:{ n:'Brent crude', unit:'$ per barrel', s:[64,63,66,68,71,69,72,74,73,76,75,78] },
  jute:{ n:'Raw jute (TD-3)', unit:'₹ per quintal', s:[6200,6050,5900,5750,5800,6100,6500,6900,7200,6800,6400,6150] },
  pulp:{ n:'Fluff pulp', unit:'$ per tonne', s:[1180,1170,1165,1150,1140,1145,1130,1125,1120,1110,1105,1100] },
};

export const LENDERS = [
  { co:'hyg', n:'Term loan, HDFC Bank', amt:4.0, rate:0.094, due:'2030-03', emi:0.085 }, { co:'hyg', n:'Cash credit, State Bank of India', amt:1.5, rate:0.097, due:'Renews Mar 2027', emi:0 },
  { co:'oil', n:'Cash credit, State Bank of India', amt:9.8, rate:0.10, due:'Renews Jan 2027', emi:0 }, { co:'oil', n:'Term loan, Axis Bank', amt:7.0, rate:0.105, due:'2029-06', emi:0.19 },
  { co:'jute', n:'Term loan, UCO Bank', amt:4.2, rate:0.10, due:'2028-12', emi:0.16 },
  { co:'jj', n:'Cash credit, ICICI Bank', amt:10.0, rate:0.115, due:'Renews Dec 2026', emi:0 }, { co:'jj', n:'Gold metal loan, ICICI Bank', amt:7.5, rate:0.103, due:'Rolls over every 180 days', emi:0 },
  { co:'fam', n:'Home loan, HDFC Bank', amt:2.8, rate:0.088, due:'2037-08', emi:0.031 }, { co:'fam', n:'Vehicle loan, Kotak Mahindra Bank', amt:0.3, rate:0.095, due:'2029-04', emi:0.009 },
];

export const SELLABLE = [
  { id:'land_sil', n:'Land parcel, Siliguri', book:4.5, co:null, revLoss:0, kind:'Land' },
  { id:'jj_gold', n:'Slow-moving gold stock, JJ Jewelers (25%)', book:9.6, co:'jj', revLoss:0.10, kind:'Gold stock', invCut:9.6 },
  { id:'oil_tank', n:'Old road tankers, Eastern Edible Oils', book:0.33, co:'oil', revLoss:0.01, kind:'Vehicle' },
  { id:'jute_frames', n:'Idle spinning frames, Bengal Jute Mills', book:0.5, co:'jute', revLoss:0.0, kind:'Machinery' },
  { id:'fam_gold', n:'Family physical gold', book:2.2, co:null, revLoss:0, kind:'Gold' },
];

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
