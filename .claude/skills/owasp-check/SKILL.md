---
name: owasp-check
description: Use when implementing or fixing a feature that touches sensitive data (auth, sessions/tokens, PII, children's/guardian records, file uploads) — walk the change against relevant OWASP standards before it lands.
---

# owasp-check

## Overview

This portal handles minors' records (grades, attendance, guardian contact info, 4Ps beneficiary
status) — security is a first-class, non-negotiable priority per `CLAUDE.md`. This skill is the
concrete, OWASP-grounded checklist to run whenever a change touches sensitive data, so "security
first" is checked against a standard rather than judged ad hoc.

## When to run this

Any change that touches:
- Auth, sessions, login, password reset, or the synthesized-email login scheme.
- RLS policies or privileged columns (`role`, `is_active`, identity fields).
- Any table/column holding PII — guardian contact info, 4Ps flag, grades/assessment records,
  profile pictures.
- A new API function, hook, or Edge Function endpoint.
- File uploads (Supabase Storage).
- Any request/response payload shaping (what a query selects/returns).

## References — fetch the live cheat sheet, don't rely on memory

These get revised; for anything non-trivial, `WebFetch` the matching sheet(s) rather than relying
on cached knowledge:

- [OWASP REST Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [OWASP Input Validation Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html)
- [OWASP HTTP Headers Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html)
- [OWASP File Upload Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

## Checklist (mapped to this project's stack)

- **Transport** — HTTPS end-to-end (Supabase + Netlify both enforce this by default; never disable
  or downgrade).
- **Data minimization** — API functions (`features/*/api/*.ts`) select only the columns the screen
  needs, never `select('*')`; don't return guardian contact info / 4Ps flag / other PII to a view
  that doesn't need it.
- **AuthN/session** — Supabase Auth only, never home-rolled; use Supabase's own session/token
  handling, don't add a custom persistence layer.
- **AuthZ** — enforced at the DB via RLS, never client-only gating; privileged columns guarded by
  triggers (see `CLAUDE.md` → Security).
- **Input validation** — validate at the boundary (React Hook Form + Zod) before it reaches an API
  function; never trust a client-supplied `role`/`id`/other privileged field.
- **Output encoding** — no `dangerouslySetInnerHTML` with user-supplied content; rely on React's
  default escaping.
- **Error handling** — generic client-facing errors (no stack traces; don't let "wrong password" vs
  "no such user" be distinguishable); details stay server-side.
- **Logging** — never log full request/response bodies or error objects that could carry a
  password/token.
- **Headers/caching** — Edge Functions issuing tokens/links set `Cache-Control: no-store`; once
  Netlify is live, `netlify.toml` sets CSP / `X-Content-Type-Options: nosniff` /
  `Referrer-Policy: strict-origin-when-cross-origin`.
- **File uploads** (profile pictures) — validate type/size; bucket RLS so a user only manages their
  own file; no executable content types accepted.
- **Rate limiting / brute force** — Supabase Auth has built-in login rate limiting; flag if a custom
  Edge Function endpoint needs its own.

## How to apply

1. Check whether the change matches a trigger above.
2. For anything non-trivial, `WebFetch` the relevant cheat sheet(s) before implementing/reviewing.
3. Walk the checklist against the diff; note gaps.
4. This **supplements**, never replaces, the `CLAUDE.md` human security gate: anything touching
   auth, RLS, roles/permissions, or secrets still needs repo-owner review + the `code-reviewer`
   agent.
5. When dispatching `code-reviewer` for a security-sensitive change, include this checklist in its
   brief.

## Common mistakes

- Treating "I thought about security" as equivalent to running the checklist — it's a concrete
  list, not a formality.
- Skipping this because a change "isn't auth" — attendance, grades, and profile pictures all carry
  PII worth protecting too.
- Relying on memorized OWASP guidance instead of fetching the current cheat sheet for anything
  non-trivial.
