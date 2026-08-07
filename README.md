# St. Martha Parent Companion

An unofficial, parent-created prototype that turns school communications into structured, grade-aware pages for action items, events, lunch, volunteering, documents, handbook search, and archives.

The prototype uses sample JSON data and public facts linked to the [official St. Martha School website](https://st-martha.org/school). It is not operated or endorsed by the school.

## Local development

Requirements: Node.js 22.13 or newer.

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Validation

```bash
npm run test:unit
npm run build
npm run lint
```

## What is included

- Nine requested routes, including an admin workflow preview
- Persistent multi-select grade filters
- All-school visibility rules
- Reusable content cards and source links
- Responsive navigation and accessible form controls
- Mock newsletter, lunch, document, and handbook data
- Unit coverage for grade filtering

## Explicitly deferred

Authentication, email ingestion, Smore retrieval, AI extraction, AWS infrastructure, and parent accounts are intentionally not part of this first version. See `docs/architecture.md` for the future capability boundaries.
