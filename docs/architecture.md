# Architecture notes

The public site remains a vinext static export. Reviewed content is generated from a private Google Sheet and Apps Script workflow at build time; the grade preference is the only browser-stored state.

## Hosting

The application uses vinext static export and is deployed from `main` by GitHub Actions to GitHub Pages. The repository name is configured as the production base path during GitHub Actions builds. All routes must remain statically renderable while this hosting model is active.

## Current boundaries

- `app/types/content.ts` is the contract that future APIs and ingestion jobs should return.
- `app/lib/filtering.ts` is independent of React and can be reused in API or test code.
- Each imported item retains a public source URL; raw email content is not part of the public model.
- `automation/google-apps-script` receives forwarded Gmail messages, retrieves structured Smore content, and stores every extracted section as `Unreviewed` in the private spreadsheet.
- The mutable admin interface is an Apps Script HTML dialog launched from the private spreadsheet. The public `/admin` route contains instructions only.
- Only valid `Approved` section rows enter the anonymous JSON feed. Private email bodies, senders, subjects, and unreviewed sections never enter the GitHub Pages build.
- `.github/workflows/pages.yml` is the canonical production deployment path.

## Deferred capabilities

- A provider-neutral receiver beyond the current Gmail and Apps Script implementation.
- Durable source snapshots independent of the original Smore URL.
- Optional model-assisted classification beyond the deterministic extraction and human review flow.
- A standalone database and authenticated public-site administration layer.
- `HandbookIndex`: PDF extraction and cited full-text search.

These capabilities should be introduced only when their phase begins. The current implementation does not include custom passwords, AWS resources, or automated AI publication decisions.
