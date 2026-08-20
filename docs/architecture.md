# Architecture notes

The public site remains a vinext static export. GitHub Pages is the active production host while the planned CloudFront/private-S3 bootstrap is blocked. Google Apps Script is the existing external service: it exposes the public newsletter archive and, when configured, securely proxies cited Gemini search answers without exposing the API key in browser code.

## Publishing pipeline

- Apps Script scans the dedicated Gmail inbox and publishes only newsletter titles, dates, and public Smore URLs.
- `.github/workflows/inbox.yml` checks the inbox and Google Calendar feeds hourly from 8 a.m. through 8 p.m. on weekdays in the Detroit time zone. It downloads public Smore content, applies local OCR to newsletter images, and commits changed static JSON data.
- Newsletter dates and signup links are extracted deterministically. Important Upcoming Dates sections are merged with the academic and Google calendars.
- The newest lunch calendar image is OCRed into individual dated menu records.
- The tested static export is deployed from committed data by `.github/workflows/pages.yml`. Deployments never contact the inbox feed; the inbox workflow dispatches a deployment only after committing changed content.
- Both workflows publish summaries and retain 14-day diagnostic artifacts. Pages verifies the expected newsletter in the static export and again on the live homepage.
- Once AWS bootstrap is complete, `.github/workflows/cloudfront.yml` can deploy the same committed snapshot using short-lived GitHub OIDC credentials. The planned S3 bucket blocks public access and grants object reads only to CloudFront.

Removing a newsletter from the dedicated inbox removes it during the next successful scheduled build. No spreadsheet review or approval process is part of the current pipeline.

## Unified and AI search

The browser builds a small search index from the static newsletter, handbook, and event datasets. Local matching is always available and requires no API call.

For an AI answer, the browser sends only the question and the top eight matching excerpts to the Apps Script web app. Apps Script reads `GEMINI_API_KEY` from Script properties, calls `gemini-3.5-flash-lite`, and requires structured citation IDs. Unknown citations are removed, and an uncited answer is replaced with an insufficient-evidence response. The public UI links accepted citations back to the corresponding on-site source.

The Gemini free tier is quota-limited and may process submitted data for product improvement. The interface tells users not to enter private student information. AI availability never blocks local search.

## Current boundaries

- All public routes remain statically renderable.
- No API credential is committed to the repository or included in the static bundle.
- Raw email bodies, senders, and private mailbox metadata never enter the public site.
- AI does not publish newsletters, events, policies, or forms and is not treated as an authoritative source.
- Parents should verify dates, policies, and requirements against the cited school source.

## Deferred capabilities

- Public-site authentication and parent accounts.
- A standalone database or application server.
- AI-generated content publication or autonomous mailbox actions.
- Durable source snapshots independent of Git history and the original public Smore URL. A versioned S3 pipeline bucket is the planned next step after AWS access is available.
