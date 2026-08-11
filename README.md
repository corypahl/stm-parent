# St. Martha Parent Companion

An unofficial, parent-created site that turns school communications into searchable newsletters and structured pages for events, lunch, handbook search, and the school directory.

The site combines automated Gmail and Google Calendar feeds with public facts linked to the [official St. Martha School website](https://st-martha.org/school). It is not operated or endorsed by the school.

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

- Public navigation for Home, Newsletters, Events, Lunch, Handbook, and Directory
- Automatic inbox-to-Smore newsletter publishing
- Searchable native and OCR newsletter text
- Unified local search across newsletter sections, the handbook, and events
- Optional cited Gemini answers through the secure Apps Script web app
- Cell-by-cell OCR of the newest lunch-menu calendar found across inbox newsletters
- Automatic signup-form link extraction
- Automatic extraction of newsletter sections labeled Important Upcoming Dates into site events
- Responsive navigation and accessible form controls
- Scheduled synchronization of newsletters and Google Calendar events
- Unit coverage for newsletter, lunch-menu, calendar, and static-publishing workflows

## Explicitly deferred

Public-site authentication, AI-generated content publication, a standalone application server, AWS infrastructure, and parent accounts remain deferred. See `docs/architecture.md` for the current capability boundaries.
