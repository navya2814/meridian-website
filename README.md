# Meridian · Financial Intelligence Platform

Meridian brings a family's businesses, investments, property and loans into one place. It shows where cash and assets sit, how much each business really earns after setting money aside for obligations, and what would happen if money were moved between businesses.

**Everything in this build is sample data.** The companies, figures, files and market prices are illustrative. The top bar says "Sample data" on every page, and reports say so in their header. There are no API keys, passwords or real financial records anywhere in the code.

## Run it on your computer

You need [Node.js](https://nodejs.org) 18 or newer.

```bash
npm install
npm run dev
```

Then open the address it prints (usually http://localhost:5173).

Other commands:

| Command | What it does |
| --- | --- |
| `npm run build` | Builds the production site into `dist/` |
| `npm run preview` | Serves the production build locally to check it |

## Deploy to Vercel

**From the Vercel website**

1. Put this folder in a GitHub repository (it already has a `.gitignore`).
2. On vercel.com choose **Add New → Project** and import the repository.
3. Vercel detects Vite. Keep the defaults: build command `npm run build`, output directory `dist`.
4. Select **Deploy**.

**From the command line**

```bash
npm install -g vercel
vercel        # first run links the project and makes a preview deployment
vercel --prod # publishes to your production address
```

`vercel.json` sends every page address to the app (so links like `/forecast` or `/businesses/hyg` work when opened directly or refreshed) and adds security headers: a content security policy, no framing, no sniffing, a strict referrer policy and `noindex` so search engines do not list the site. No environment variables are needed.

## Pages

| Address | Page |
| --- | --- |
| `/` | Overview: net worth, cash, assets, liabilities, five-year path, suggested change |
| `/financials` | Profit and margins, reserves and true profit, combined balance sheet (tabs) |
| `/businesses` | All businesses, with **Add a business** (up to 15) |
| `/businesses/:id` | One business in its own colours: outlook, factories, balance sheet, reserves, documents |
| `/assets`, `/liabilities`, `/cash-flow`, `/investments` | Resources, each with filters |
| `/resource-allocation` | Advice, ranking, the What If simulator, and when to buy raw materials (tabs) |
| `/forecast` | Projections with adjustable growth for each business |
| `/insights` | Alerts (filterable), strengths, weaknesses, risks, opportunities, market prices |
| `/data-import` | Read Excel (.xlsx), CSV and PDF files and sort them to company, unit and type |
| `/reports` | Copy or download plain-text reports |
| `/settings` | Reserve rules, appearance, data and sync, users, security |

Tabs are part of the address (for example `/resource-allocation?tab=whatif`), so any view can be linked to. Most figures can be selected to show the source rows they were built from.

## Project layout

```
src/
  main.jsx              Entry point
  App.jsx               Routes and error handling
  AppContext.jsx        Shared state: theme, sidebar, drawer, modal, toast, What If scenario, saved plans
  styles.css            Full design: espresso sidebar, cream workspace, gold accents, light and dark themes
  lib/
    data.js             Sample data (businesses, files, family holdings, market prices, loans)
    engine.js           Finance engine: reserves, true profit, outlook, ranking, scenarios, Monte Carlo, reports
    format.js           Indian number format (lakh, crore), dates, colours
    charts.js           Shared Chart.js options that follow the theme
    storage.js          Safe wrapper around browser storage
  components/
    Layout.jsx          Sidebar, top bar, intro screen, drawer, modal, toast
    ui.jsx              Cards, KPIs, tabs, filters, bars, sparklines, sliders, source-row tracing
    ChartCanvas.jsx     Chart.js wrapper that redraws on theme or data changes
    finance.jsx         Advice card, reserves tables, override form, add-business form
    Icon.jsx            Line icon set
  pages/                One file per page (Resources.jsx holds Assets, Liabilities, Cash Flow, Investments)
```

## Where data is kept

This build has no server and no database. Theme, sidebar state, saved What If plans and businesses you add are stored in the viewer's own browser (`localStorage`), so they do not appear on other devices. Files chosen on Data Import are read inside the browser and are never uploaded.

## Before putting real books in

Real financial data needs more than a static site. Before replacing the sample data, add:

- sign-in with per-user access rules (the Users table in Settings shows the intended roles);
- a server and database to store imported books, with encryption at rest;
- a server-side import that keeps the original files untouched;
- a live market price feed in place of the sample gold, palm oil, crude, jute and pulp prices;
- review of the reserve rules by a qualified accountant.

Never put API keys or credentials in this front-end code. Anything in `src/` is visible to whoever opens the site.
