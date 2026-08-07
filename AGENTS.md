# Repository working agreement

This is a Codex-first repository.

- Work directly on `main` unless the user explicitly requests another branch.
- After each complete, validated change, create one intentional commit and push it to `origin/main` before finishing the task.
- Do not open a pull request for routine Codex work unless the user asks for one.
- GitHub Pages is the canonical deployment target. Production deploys run from `.github/workflows/pages.yml` on every push to `main`.
- Keep the application compatible with static export. Do not add request-time server features without first confirming a hosting change with the user.
- Run `npm test` and `npm run lint` before committing changes that affect the application or deployment.
