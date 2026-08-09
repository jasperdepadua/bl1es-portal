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

**Recommended: [Resend](https://resend.com).** Free tier is 3,000 emails/month (100/day), one
verified domain, forever-free — comfortably enough for a single school's registration and
password-reset traffic. It exposes an SMTP relay, so it's a drop-in swap for Mailtrap: same
`nodemailer.createTransport({ host, port, auth: { user, pass } })` call in
`supabase/functions/register-user/index.ts`, no code changes, only different secret values.

**Why not a truly open-source / self-hosted mail server (e.g. Postfix)?** It's free, but not
practical here: a self-hosted server starts with zero sender reputation and no SPF/DKIM/DMARC
history, so mail to Gmail/Outlook/Yahoo is very likely to land in spam (or get rejected outright)
until significant, ongoing reputation work is done. That cost isn't worth it for a small school's
volume — a free-tier SaaS ESP with an established sending reputation is the better trade-off.

**Alternative: [Brevo](https://www.brevo.com)** — 300 emails/day (9,000/month) free forever, also
SMTP-relay compatible with nodemailer. Reach for this only if Resend's one-verified-domain limit
is ever a blocker.

### Steps to switch (once you have a real domain for the school)

1. Sign up for Resend (or Brevo), verify the school's sending domain — add the SPF/DKIM DNS
   records the provider gives you (takes a few minutes, propagation up to ~24h).
2. Get SMTP credentials from the provider's dashboard (host/port/user/pass — same four values as
   Mailtrap's, just from a different provider).
3. Swap the secrets (same command shape as step 4 above, new values):
   ```bash
   npx supabase secrets set \
     MAILTRAP_HOST=<new-host> \
     MAILTRAP_PORT=<new-port> \
     MAILTRAP_USER=<new-username> \
     MAILTRAP_PASS=<new-password>
   ```
   (The secret names stay `MAILTRAP_*` even though the value comes from a different provider —
   renaming them is optional cleanup, not required for this to work.)
4. Redeploy is **not** required — secrets are read at request time, not baked into the deployed
   function.

The `register-user` Edge Function's code doesn't change at all — only the secret values it reads.
