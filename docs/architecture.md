# Architecture notes

This first version is intentionally a single vinext application. Mock JSON is imported at build time and the grade preference is the only browser-stored state.

## Current boundaries

- `app/types/content.ts` is the contract that future APIs and ingestion jobs should return.
- `app/lib/filtering.ts` is independent of React and can be reused in API or test code.
- Each imported item retains a public source URL; raw email content is not part of the public model.
- The admin route is a visual workflow preview and has no mutations.

## Deferred capabilities

- `NewsletterReceiver`: provider-neutral interface for SES, Gmail, or another inbound email provider.
- `NewsletterRetriever`: retrieves and snapshots a detected Smore URL.
- `ContentExtractionService`: deterministic extraction first, optional model-assisted classification second.
- `ContentRepository`: durable store for newsletter sources, content drafts, documents, and processing jobs.
- `AdminIdentityProvider`: managed authentication boundary; no custom passwords.
- `HandbookIndex`: PDF extraction and cited full-text search.

These interfaces should be introduced only when their phase begins. The first version does not include authentication, AWS resources, email processing, scraping, or AI.
