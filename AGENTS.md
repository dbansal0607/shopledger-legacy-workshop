# Repository Guidelines

## Project Structure & Module Organization

This is a CommonJS Node.js and Express app for shop billing, inventory, GST, and customer credit. `server.js` wires the app and serves `public/` (`index.html`, `js/`, and `css/`). API handlers live in `routes/`; reusable business logic lives in `lib/` (pricing, tax, coupons, orders, inventory, ledger, invoices, reports, and dates). `config.js` contains shop and business settings. `data/db.json` is the file-backed store. `docs/` contains the architecture diagram. There is no test directory or test suite currently.

## Build, Test, and Development Commands

- `npm start` runs `node server.js` on port 3000, or the port in `PORT`.
- There is no build step; the browser assets are served directly from `public/`.
- `npm test` is a placeholder that exits with an error; do not treat it as a passing test suite. No test framework or lint/format command is configured.

For local development, install dependencies with `npm install` when needed, then run `npm start`. Keep operational data backed up before using the app with real records.

## Coding Style & Naming Conventions

Match the existing JavaScript style: two-space indentation, semicolons, single-quoted strings, CommonJS `require`, and callback-based Express handlers. Use lower camel case for functions and variables, and descriptive filenames such as `gst-reconciliation` for route names. Keep HTTP handling in `routes/` and calculations or domain rules in `lib/`.

## Testing Guidelines

Tests use Node's built-in `node:test` and run with `node --test`. No automated test suite exists today. For changes to pricing, GST, inventory, cancellation, or Khata, include focused tests and document manual verification until then. Cover both successful requests and invalid or boundary inputs (for example, stock limits, coupon minimums, and credit limits). Do not rely on `npm test` until it is replaced with a real test command.

## Commit & Pull Request Guidelines

Recent commits use short, descriptive, lowercase summaries (for example, `invoice page for accountant`); no strict Conventional Commits format is evident. Keep commits focused. Pull requests should explain user-visible and data-flow changes, list verification performed, link related issues when available, and include screenshots for UI changes. Call out any changes that affect existing `data/db.json` records or financial calculations.

## Security & Configuration

Do not commit secrets or real customer data. Review `config.js` before deployment and keep backups before changing the JSON store format or write behavior. Validate request input at route boundaries, especially for money, quantities, and user-provided text.

## Agent-Specific Instructions

- Write characterization tests before changing behaviour.
- Change only the module the ticket is about.
- Tests never touch `data/db.json`.
- Add no dependencies.
