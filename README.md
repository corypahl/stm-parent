# St. Martha Parent Companion

An unofficial, parent-created site that turns reviewed school communications into structured, grade-aware pages for events, lunch, volunteering, handbook search, contacts, and newsletter archives.

The site combines reviewed Google Sheet content with public facts linked to the [official St. Martha School website](https://st-martha.org/school). It is not operated or endorsed by the school.

Live site: [https://corypahl.github.io/stm-parent/](https://corypahl.github.io/stm-parent/)

## Local development

Requirements: Node.js 22.13 or newer.

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

To preview the generated static site instead:

```bash
npm run build
npm run start
```

## Validation

```bash
npm run test:unit
npm run build
npm run lint
```

## Codex and deployment workflow

This is a Codex-first repository. Codex works directly on `main`, creates one intentional commit for each completed change, and pushes that commit to `origin/main` before finishing.

Every push to `main` runs `.github/workflows/pages.yml`. The workflow tests, lints, creates a static export, and deploys `dist/client` to GitHub Pages. Request-time server features are intentionally unavailable while GitHub Pages is the deployment target.

## What is included

- Public routes for Home, Events, Lunch, Volunteer, Handbook, Contacts, and Archive
- Persistent multi-select grade filters
- All-school visibility rules
- Reusable content cards and source links
- Responsive navigation and accessible form controls
- Private Google Sheet admin for section-level newsletter review and approval
- Automatic Smore section extraction based on horizontal separators
- Scheduled synchronization of approved content and Google Calendar events
- Unit coverage for filtering, newsletter extraction, calendar synchronization, and static publishing

## Explicitly deferred

A separate application backend, public-site authentication, model-assisted extraction, AWS infrastructure, parent accounts, and a live lunch feed remain deferred. See `docs/architecture.md` for the current capability boundaries.
