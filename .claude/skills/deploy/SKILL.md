---
name: deploy
description: Deploy the app to staging - lints, builds the production bundle, and pushes a staging branch. Use when the user says "deploy", "ship to staging", or "push to staging".
---

# Deploy to staging

Run these steps **in order**. Stop and report to the user if any step fails —
never skip a failed step to get to the next one.

## 0. Preconditions

- Confirm the working tree is clean (`git status --porcelain`). If there are


  uncommitted changes, stop and ask the user to commit or stash first — this
  skill does not commit on the user's behalf.

## 1. Tests

This project has no test framework installed yet — `npm run lint` (ESLint) is
the correctness gate. Run:

```
npm run lint
```

If it reports errors, stop and report them. Do not proceed to build.

## 2. Build

```
npm run build
```

This produces the production bundle in `dist/` (gitignored — it is not part
of what gets pushed; only source is pushed to the `staging` branch). If the
build fails, stop and report the error — do not proceed to push.

## 3. Push to staging

Fast-forward (or create) a local `staging` branch to the current commit and
push it to `origin`:

```
git branch -f staging HEAD
git push origin staging
```

Do not force-push (`--force`) unless the user explicitly asks for it — if the
push is rejected because `staging` diverged on the remote, stop and ask the
user how they want to reconcile it rather than overwriting it.

## Report

Summarize: lint result, build result (and that `dist/` was produced
locally, not pushed), and the staging push result with the commit SHA that's
now on `origin/staging`.
