# Mailtrap setup (dev/test email sandbox)

## Why this exists

Every account's auth email is synthetic (`{username}@staff.bl1es.portal`, not a real inbox), so
Supabase's built-in mailer can never reach a person — the Management sub-project's `register-user`
Edge Function has to generate an invite link (`admin.generateLink`) and email it to the person's
*real* `contact_email`/`guardian_email` itself. Free ESPs like Resend won't deliver to an arbitrary
address without a verified sending domain, which we don't have yet. **Mailtrap Sandbox** solves this
for dev/testing: free, zero domain verification, and it captures every "sent" email into a dashboard
inbox instead of trying to deliver it anywhere real. See `specs/management.md` § Out of scope and
`plan/2026-07-10-management.md` § Key decision for the full rationale.

This only covers **dev/testing**. Going live with the real school needs a verified domain + a
production ESP (e.g. Resend) — see § Moving to production below.

## 1. Create a free account

1. Go to [mailtrap.io](https://mailtrap.io) → **Sign Up**. No credit card required.
2. Verify your email if prompted.

## 2. Find your sandbox inbox

1. In the left nav: **Email Testing → Inboxes**. A default sandbox — usually named **My Sandbox** —
   already exists.
2. (Optional) Rename it to something recognizable, e.g. "BL1ES Dev", via the inbox's settings/edit
   button.

## 3. Get SMTP credentials

1. Open the sandbox → **Integration** tab → select **SMTP**.
2. Copy the four values shown:
   - **Host:** `sandbox.smtp.mailtrap.io`
   - **Port:** `587` (2525 also works if 587 is blocked on your network)
   - **Username:** unique to your sandbox
   - **Password:** unique to your sandbox

**Treat these as secrets** — same handling as the Supabase `service_role` key: never commit them,
never paste them into chat/PRs, never put them in `.env`/`.env.local` (those are for client-side
`VITE_`-prefixed values only; these are server-side-only).

## 4. Store as Supabase Edge Function secrets

Do this once `register-user` is being built (Management Task 2), after the project is linked:

```bash
npx supabase secrets set \
  MAILTRAP_HOST=sandbox.smtp.mailtrap.io \
  MAILTRAP_PORT=587 \
  MAILTRAP_USER=<your sandbox username> \
  MAILTRAP_PASS=<your sandbox password>
```

Edge Function secrets are server-side only and are never bundled into the client build — this is
the same trust boundary as the `service_role` key.

## 5. Registering someone and receiving their invite link

Once `register-user` ships:

1. In Management, register a teacher or student using **any placeholder-looking email** as the
   contact/guardian email (e.g. `teacher1@example.com`) — it doesn't need to be real or
   deliverable. Mailtrap intercepts the send regardless of the `To` address; nothing actually
   leaves Mailtrap's sandbox.
2. Open the [Mailtrap dashboard](https://mailtrap.io) → your sandbox inbox. The captured email
   appears within seconds.
3. Click into the message — Mailtrap shows an HTML preview (and a spam-score check, if curious).
4. Click the invite link inside it. It opens `/accept-invite` in the running app.
5. Set a password on that screen to finish onboarding the account — there's no temporary password
   to remember; the link itself was the one-time credential.

## Moving to production later

When piloting with the real school:

1. Buy/verify a real sending domain with a production ESP (e.g. Resend — add DNS records for
   SPF/DKIM, takes a few minutes).
2. Swap the `MAILTRAP_*` secrets for the new provider's SMTP (or API) credentials via
   `npx supabase secrets set`.

The `register-user` Edge Function's code doesn't change — only the secrets it reads.
