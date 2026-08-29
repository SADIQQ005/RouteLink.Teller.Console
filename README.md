# RouteLink Teller

Bank teller portal for initiating and approving customer transfers.

## Features

- Teller dashboard with branch balances and daily flow
- New transaction flow with beneficiary name enquiry and source account balance check
- Maker → Checker approval queue with supporting documents
- Transaction history, audit trail and reconciliation exports
- Role-based access control and transfer limits

## Getting started

```bash
npm install
npm run dev
```

- `npm run dev` — start the Vite dev server
- `npm run build` — type-check and build for production
- `npm run lint` — run oxlint

## Tech stack

React 19, TypeScript, Vite, TanStack Query, React Hook Form + Zod, Redux Toolkit, Tailwind CSS v4, Radix UI.

Demo credentials are listed on the login screen. The app falls back to mock data when the backend API is unreachable.