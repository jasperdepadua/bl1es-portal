---
name: gitmerge
description: Use when committing changes or merging a feature branch into dev in the bl1es-portal repo.
---

# gitmerge

## Overview

The standard git workflow for landing work on `dev` in this repo. Keeps history linear: one
commit per unit of work, rebase (never a merge commit) onto `dev`, PR into `dev`, rebase-and-merge.

## Scope

- Target branch is always `dev`. **Never** open a PR into `main`, never push or rebase `main` —
  the repo owner merges `dev` → `main` manually.
- Applies to any feature/working branch being landed on `dev`.

## Workflow

1. **Squash to a single commit.** If the branch has more than one commit ahead of `dev`,
   consolidate before doing anything else:
   ```bash
   git reset --soft $(git merge-base dev HEAD)
   git commit -m "<short, meaningful message>"
   ```
   Commit message: short, meaningful, describes the *why*/*what*. No "Co-Authored-By" or any
   AI-attribution trailer — omit entirely.

2. **Rebase onto latest `dev`:**
   ```bash
   git fetch origin
   git rebase origin/dev
   ```
   On conflict: **take dev's side first**, then manually re-apply this branch's intended change
   on top. During a rebase, `--ours` means the upstream side (`dev`), and `--theirs` means this
   branch's commit being replayed — the *opposite* of merge semantics. Don't get this backwards.
   ```bash
   git checkout --ours <file>   # --ours = dev's version during a rebase
   # hand-edit the file to re-apply this branch's change on top of dev's version
   git add <file>
   git rebase --continue
   ```

3. **Push the branch** (force-with-lease, since rebase rewrites history — only ever on the
   feature branch, never on `dev`/`main`):
   ```bash
   git push --force-with-lease -u origin <branch>
   ```

4. **Open the PR into `dev`:**
   ```bash
   gh pr create --base dev --head <branch> --title "<short message>" --body "<what/why, 1-3 bullets>"
   ```

5. **Merge with rebase (linear history):**
   ```bash
   gh pr merge --rebase
   ```

## Quick reference

| Step | Command |
|---|---|
| Squash | `git reset --soft $(git merge-base dev HEAD)` |
| Rebase | `git fetch origin && git rebase origin/dev` |
| Conflict | take dev's side (`--ours`), hand-reapply our change |
| Push | `git push --force-with-lease -u origin <branch>` |
| PR | `gh pr create --base dev --head <branch> ...` |
| Merge | `gh pr merge --rebase` |

## Common mistakes

- Opening a PR into `main` — never; `dev` is the only target.
- Resolving conflicts by keeping our side wholesale — always start from dev's side, then reconcile.
- Leaving multiple commits on the branch before pushing — squash first.
- Adding "Co-Authored-By: Claude" or similar to commit messages — omit entirely.
- Using plain `git push --force` instead of `--force-with-lease` — lease protects against
  clobbering someone else's concurrent push.
