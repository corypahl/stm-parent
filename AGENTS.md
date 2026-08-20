# Repository working agreement

This is a Codex-first repository.

- Work directly on `main` unless the user explicitly requests another branch.
- After each complete, validated change, create one intentional commit and push it to `origin/main` before finishing the task.
- Do not open a pull request for routine Codex work unless the user asks for one.
- GitHub Pages is the active production target while AWS bootstrap is blocked. Production deploys run from `.github/workflows/pages.yml`; the future CloudFront/S3 target remains defined in `infrastructure/cloudfront.yml` and `.github/workflows/cloudfront.yml`.
- Keep the application compatible with static export. Do not add request-time server features without first confirming a hosting change with the user.
- Run `npm test` and `npm run lint` before committing changes that affect the application or deployment.
