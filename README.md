# St. Martha Parent Companion

An unofficial, parent-created site that turns school communications into searchable newsletters and structured pages for events, lunch, handbook search, and the school directory.

The site combines automated Gmail and Google Calendar feeds with school information from the current parent and student handbook. It is not operated or endorsed by the school.

The production URL is the `SiteUrl` output of the `stm-parent-production` CloudFormation stack.

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

Every push to `main` runs `.github/workflows/cloudfront.yml`. The workflow tests, lints, creates a root-hosted static export, syncs `dist/client` to a private S3 bucket, and invalidates the CloudFront distribution. GitHub Actions authenticates to AWS with a repository- and branch-scoped OIDC role, so no long-lived AWS access keys are stored in GitHub. Request-time server features remain intentionally unavailable.

Inbox and Google Calendar synchronization runs separately through `.github/workflows/inbox.yml`, once per hour from 8 a.m. through 8 p.m. on weekdays in `America/Detroit`. It retries transient feed failures, commits generated public content only when something changes, and then dispatches the CloudFront deployment workflow. This keeps inbox lookup failures distinct from deployment failures in the Actions list.

## AWS hosting bootstrap

The production infrastructure lives in `infrastructure/cloudfront.yml`. It creates the private bucket, CloudFront origin access control and distribution, security and cache policies, optional Route 53 records and ACM certificate, and the GitHub deployment role.

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
