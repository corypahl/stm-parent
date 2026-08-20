# St. Martha Parent Companion

An unofficial, parent-created site that turns school communications into searchable newsletters and structured pages for events, lunch, handbook search, and the school directory.

The site combines automated Gmail and Google Calendar feeds with school information from the current parent and student handbook. It is not operated or endorsed by the school.

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

Every push to `main` runs `.github/workflows/pages.yml`. This deployment-only workflow reports the exact newsletter it expects, tests and lints the application, builds the static export, verifies that the expected newsletter is present before upload, and verifies the live homepage after GitHub Pages publishes it. Diagnostic artifacts are retained for 14 days.

Inbox and Google Calendar synchronization runs separately through `.github/workflows/inbox.yml`, once per hour from 8 a.m. through 8 p.m. on weekdays in `America/Detroit`. It retries transient feed failures, reports the newest extracted newsletter, commits generated public content only when something changes, and then dispatches the Pages deployment workflow. Its generated data is also retained as a 14-day diagnostic artifact. This keeps extraction, content handoff, build, and live-publishing failures distinguishable in the Actions list.

## AWS hosting bootstrap

The future production infrastructure lives in `infrastructure/cloudfront.yml`. It creates the private bucket, CloudFront origin access control and distribution, security and cache policies, optional Route 53 records and ACM certificate, and the GitHub deployment role. Until the AWS role is configured, GitHub Pages remains the active deployment target.

Authenticate the AWS CLI with an administrator-capable profile, then run:

```powershell
aws sso login --profile AdministratorAccess-094492480032
$env:AWS_PROFILE = "AdministratorAccess-094492480032"
./scripts/bootstrap-cloudfront.ps1
```

The script reuses an account-level GitHub OIDC provider when one exists, deploys the stack in `us-east-1`, records the stack/region/role as GitHub repository variables, and dispatches the first deployment. To attach a Route 53 domain during bootstrap, supply both `-CustomDomainName` and `-HostedZoneId`. Re-running the script updates the same stack safely.

The Directory uses the same 2026–27 staff roster that appears in the searchable handbook. Updating the handbook roster therefore updates both pages without a separate website scrape or review step.

## What is included

- Public navigation for Home, Newsletters, Events, Handbook, and Directory
- Automatic inbox-to-Smore newsletter publishing
- Searchable native and OCR newsletter text
- Unified local search across newsletter sections, the handbook, and events
- Optional cited Gemini answers through the secure Apps Script web app
- Cell-by-cell OCR of the newest lunch-menu calendar found across inbox newsletters
- Automatic signup-form link extraction
- Automatic extraction of newsletter sections labeled Important Upcoming Dates into site events
- Responsive navigation and accessible form controls
- Scheduled synchronization of newsletters and Google Calendar events
- Handbook-based school directory
- Unit coverage for newsletter, lunch-menu, calendar, directory, and static-publishing workflows

## Explicitly deferred

Public-site authentication, AI-generated content publication, a standalone application server, and parent accounts remain deferred. See `docs/architecture.md` for the current capability boundaries.
