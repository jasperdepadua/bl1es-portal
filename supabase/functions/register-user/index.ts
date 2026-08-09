// register-user — privileged Edge Function for creating teacher/student accounts.
//
// Why this exists: creating an auth.users row requires the service_role key, which must
// never reach the browser. A superadmin (principal) calls this endpoint to register a
// teacher or student; it creates a password-less auth account + profile row, generates a
// one-time Supabase invite link, and emails that link to the person's real contact/guardian
// email (Mailtrap Sandbox in dev — never delivered anywhere real in this environment).
//
// Request contract (see src/features/management/api/register-user.ts, the only caller):
//   { kind: 'teacher', firstName, lastName, username, contactEmail }
//   { kind: 'student', firstName, lastName, guardianName?, guardianRelationship?,
//     guardianContactNumber?, guardianEmail, is4psBeneficiary }
//
// Env vars used (all read via Deno.env.get; none are set by this file):
//   SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY (auto-injected by Supabase)
//   MAILTRAP_HOST, MAILTRAP_PORT, MAILTRAP_USER, MAILTRAP_PASS, SITE_URL (project secrets)

import { createClient, type SupabaseClient } from 'jsr:@supabase/supabase-js@2'
import nodemailer from 'npm:nodemailer'
import { corsHeaders } from '../_shared/cors.ts'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface RegisterTeacherBody {
  kind: 'teacher'
  firstName: string
  lastName: string
  username: string
  contactEmail: string
}

interface RegisterStudentBody {
  kind: 'student'
  firstName: string
  lastName: string
  guardianName?: string
  guardianRelationship?: string
  guardianContactNumber?: string
  guardianEmail: string
  is4psBeneficiary: boolean
}

type RegisterUserBody = RegisterTeacherBody | RegisterStudentBody

type ValidationResult =
  | { ok: true; data: RegisterUserBody }
  | { ok: false; message: string }

function jsonResponse(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      ...corsHeaders,
    },
  })
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

// Trims all string fields and validates required-ness / shape. Never trusts the client
// beyond basic format checks — the actual authorization decision already happened before
// this runs (see the caller in Deno.serve below).
function validateBody(raw: unknown): ValidationResult {
  if (typeof raw !== 'object' || raw === null) {
    return { ok: false, message: 'Request body must be a JSON object.' }
  }
  const body = raw as Record<string, unknown>

  if (body.kind !== 'teacher' && body.kind !== 'student') {
    return { ok: false, message: 'kind must be "teacher" or "student".' }
  }

  if (!isNonEmptyString(body.firstName) || !isNonEmptyString(body.lastName)) {
    return { ok: false, message: 'firstName and lastName are required.' }
  }
  const firstName = body.firstName.trim()
  const lastName = body.lastName.trim()

  if (body.kind === 'teacher') {
    if (!isNonEmptyString(body.username)) {
      return { ok: false, message: 'username is required.' }
    }
    if (!isNonEmptyString(body.contactEmail) || !EMAIL_RE.test(body.contactEmail.trim())) {
      return { ok: false, message: 'contactEmail must be a valid email address.' }
    }
    return {
      ok: true,
      data: {
        kind: 'teacher',
        firstName,
        lastName,
        username: body.username.trim().toLowerCase(),
        contactEmail: body.contactEmail.trim(),
      },
    }
  }

  // kind === 'student'
  if (!isNonEmptyString(body.guardianEmail) || !EMAIL_RE.test(body.guardianEmail.trim())) {
    return { ok: false, message: 'guardianEmail must be a valid email address.' }
  }
  if (typeof body.is4psBeneficiary !== 'boolean') {
    return { ok: false, message: 'is4psBeneficiary must be a boolean.' }
  }

  const trimmedOrNull = (value: unknown): string | null =>
    isNonEmptyString(value) ? value.trim() : null

  return {
    ok: true,
    data: {
      kind: 'student',
      firstName,
      lastName,
      guardianName: trimmedOrNull(body.guardianName) ?? undefined,
      guardianRelationship: trimmedOrNull(body.guardianRelationship) ?? undefined,
      guardianContactNumber: trimmedOrNull(body.guardianContactNumber) ?? undefined,
      guardianEmail: body.guardianEmail.trim(),
      is4psBeneficiary: body.is4psBeneficiary,
    },
  }
}

// Generates the next permanent student_number for the current (or fallback) school year.
// This is generated ONCE and never changes as the student advances grades — grade
// progression lives in the separate `enrollments` table. The max+1 approach here has a
// theoretical race under concurrent registration; that's acceptable for a single-operator,
// low-volume tool. The DB's UNIQUE constraint on student_number, plus the auth-user rollback
// on insert failure below, is the backstop if a collision ever occurs.
async function generateStudentNumber(adminClient: SupabaseClient): Promise<string> {
  const { data: currentYear } = await adminClient
    .from('school_years')
    .select('start_date')
    .eq('is_current', true)
    .maybeSingle()

  const year = currentYear?.start_date
    ? new Date(currentYear.start_date as string).getFullYear()
    : new Date().getFullYear()

  const prefix = `bl1es-${year}-`

  const { data: existing, error } = await adminClient
    .from('student_details')
    .select('student_number')
    .like('student_number', `${prefix}%`)

  if (error) throw error

  let maxSeq = 0
  for (const row of existing ?? []) {
    const suffix = String(row.student_number).slice(prefix.length)
    const n = Number.parseInt(suffix, 10)
    if (Number.isFinite(n) && n > maxSeq) maxSeq = n
  }

  return `${prefix}${String(maxSeq + 1).padStart(4, '0')}`
}

function isUniqueViolationMessage(message: string): boolean {
  const m = message.toLowerCase()
  return m.includes('duplicate key') || m.includes('unique constraint') || m.includes('already registered')
}

// Postgrest/GoTrue errors are plain objects with a `.message` string, not `Error` instances —
// `err instanceof Error` is false for them, so a naive check falls through to `String(err)`,
// which yields the useless "[object Object]" and breaks any message-based error classification.
function extractErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  if (typeof err === 'object' && err !== null && 'message' in err) {
    return String((err as { message: unknown }).message)
  }
  return String(err)
}

// Names are user-supplied and get interpolated into HTML email bodies below — escape before
// inserting, since email clients render HTML and a crafted name shouldn't be able to inject markup.
function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

const EMAIL_BUTTON_STYLE =
  'display:inline-block;background-color:#1b72de;color:#ffffff;text-decoration:none;' +
  'font-weight:600;padding:12px 24px;border-radius:8px;margin:16px 0;'

function buildInviteEmail(input: RegisterUserBody, actionLink: string): { subject: string; html: string } {
  const schoolName = 'Bayanluma 1 Elementary School'
  const button = `<a href="${actionLink}" style="${EMAIL_BUTTON_STYLE}">Set Up My Account</a>`
  const fallbackLink = `
    <p style="color:#555555;font-size:13px;">
      If the button above doesn't work, copy and paste this link into your browser:<br />
      <a href="${actionLink}">${actionLink}</a>
    </p>
  `
  const footer = `
    <p style="color:#555555;font-size:13px;">
      If you were not expecting this email, please disregard it or contact the school office.
    </p>
    <p style="color:#555555;font-size:13px;">${schoolName}</p>
  `

  if (input.kind === 'teacher') {
    const name = escapeHtml(`${input.firstName} ${input.lastName}`)
    return {
      subject: `Set Up Your ${schoolName} Portal Account`,
      html: `
        <p>Dear ${name},</p>
        <p>
          An account has been created for you as a teacher on the ${schoolName} Portal. To get
          started, please set up your password using the secure, one-time link below.
        </p>
        <p>${button}</p>
        ${fallbackLink}
        ${footer}
      `,
    }
  }

  // Addressed to the student directly, not the guardian: per the school's account model, the
  // student is the account holder (guardian info is just the delivery channel, since a
  // student's synthesized login email isn't a real inbox) — a guardian may view the account
  // alongside them, but the content speaks to the student in second person.
  const studentFirstName = escapeHtml(input.firstName)
  return {
    subject: `Set Up Your ${schoolName} Portal Account`,
    html: `
      <p>Dear ${studentFirstName},</p>
      <p>
        An account has been created for you on the ${schoolName} Portal, where you can view your
        attendance, progress, and announcements from the school.
      </p>
      <p>To activate your account, please set a password using the secure, one-time link below.</p>
      <p>${button}</p>
      ${fallbackLink}
      ${footer}
    `,
  }
}

Deno.serve(async (req: Request) => {
  // ---- 1. CORS / method gate --------------------------------------------------------
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: { ...corsHeaders, 'Cache-Control': 'no-store' },
    })
  }
  if (req.method !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed' })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const mailtrapHost = Deno.env.get('MAILTRAP_HOST')
  const mailtrapPort = Deno.env.get('MAILTRAP_PORT')
  const mailtrapUser = Deno.env.get('MAILTRAP_USER')
  const mailtrapPass = Deno.env.get('MAILTRAP_PASS')
  const siteUrl = Deno.env.get('SITE_URL')
  // Fail fast on missing config, before any auth/DB write — otherwise a missing MAILTRAP_*
  // or SITE_URL secret is only discovered after the auth user + profile rows already
  // committed, landing in the "account created but email failed" branch instead of a clean
  // startup error.
  if (
    !supabaseUrl ||
    !anonKey ||
    !serviceRoleKey ||
    !mailtrapHost ||
    !mailtrapPort ||
    !mailtrapUser ||
    !mailtrapPass ||
    !siteUrl
  ) {
    console.error('register-user: missing required env vars')
    return jsonResponse(500, { error: 'Server misconfigured.' })
  }

  // ---- 2. AuthN — resolve the caller from their bearer token -------------------------
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return jsonResponse(401, { error: 'Not authenticated' })
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  })

  const { data: userResult, error: userError } = await userClient.auth.getUser()
  if (userError || !userResult?.user) {
    return jsonResponse(401, { error: 'Not authenticated' })
  }
  const callerId = userResult.user.id

  // Admin client (service_role) — bypasses RLS. Used for the authorization check itself
  // and for every privileged write below. Never derived from client-supplied claims.
  const adminClient = createClient(supabaseUrl, serviceRoleKey)

  // ---- 3. AuthZ — THE load-bearing check ---------------------------------------------
  // We never trust a client-supplied role claim (OWASP: broken access control). The only
  // source of truth for "is this caller a superadmin" is a direct, server-side read of
  // their `profiles` row via the service_role client, re-checked on every call.
  const { data: callerProfile, error: callerProfileError } = await adminClient
    .from('profiles')
    .select('role, is_active')
    .eq('id', callerId)
    .single()

  if (
    callerProfileError ||
    !callerProfile ||
    callerProfile.role !== 'superadmin' ||
    callerProfile.is_active !== true
  ) {
    return jsonResponse(403, { error: 'Forbidden' })
  }

  // ---- 4. Parse & validate body --------------------------------------------------------
  let rawBody: unknown
  try {
    rawBody = await req.json()
  } catch {
    return jsonResponse(400, { error: 'Request body must be valid JSON.' })
  }

  const validation = validateBody(rawBody)
  if (!validation.ok) {
    return jsonResponse(400, { error: validation.message })
  }
  const input = validation.data

  // ---- 5. Resolve identifier + synthesize the auth email -----------------------------
  // Must exactly match src/features/auth/api/resolve-login-email.ts.
  let email: string
  let studentNumber: string | null = null

  if (input.kind === 'teacher') {
    email = `${input.username}@staff.bl1es.portal`
  } else {
    studentNumber = await generateStudentNumber(adminClient)
    email = `${studentNumber}@students.bl1es.portal`
  }

  // ---- 6. Create the auth user + generate the one-time invite link, in one call ------
  // generateLink({ type: 'invite' }) creates the auth user itself (no password — the
  // recipient sets one via the link) AND returns the action_link in the same response.
  // Do NOT call admin.createUser() separately first: generateLink's 'invite' type expects
  // to create the user, so a prior createUser() call would make this step fail against an
  // email that's already registered. This is the documented single-call pattern for
  // "invite a user, send the email myself instead of Supabase's mailer".
  const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
    type: 'invite',
    email,
    options: { redirectTo: `${siteUrl}/accept-invite` },
  })

  if (linkError || !linkData?.user || !linkData?.properties?.action_link) {
    console.error('register-user: generateLink failed', { kind: input.kind, message: linkError?.message })
    return jsonResponse(500, { error: 'Failed to create the account. Please try again.' })
  }
  const newUserId = linkData.user.id
  const actionLink = linkData.properties.action_link

  // ---- 7. Insert profile (+ student_details) row(s), rolling back the auth user on failure
  try {
    const { error: profileInsertError } = await adminClient.from('profiles').insert({
      id: newUserId,
      role: input.kind === 'teacher' ? 'admin' : 'normal',
      first_name: input.firstName,
      last_name: input.lastName,
      username: input.kind === 'teacher' ? input.username : null,
      contact_email: input.kind === 'teacher' ? input.contactEmail : null,
    })
    if (profileInsertError) throw profileInsertError

    if (input.kind === 'student') {
      const { error: studentInsertError } = await adminClient.from('student_details').insert({
        profile_id: newUserId,
        student_number: studentNumber,
        guardian_name: input.guardianName ?? null,
        guardian_relationship: input.guardianRelationship ?? null,
        guardian_contact_number: input.guardianContactNumber ?? null,
        guardian_email: input.guardianEmail,
        is_4ps_beneficiary: input.is4psBeneficiary,
      })
      if (studentInsertError) throw studentInsertError
    }
  } catch (insertError) {
    const message = extractErrorMessage(insertError)

    // Confirmed by live testing: generateLink({type:'invite'}) on an email that's ALREADY
    // registered does not error — it silently returns the pre-existing user (same id) instead
    // of creating a new one. That makes this catch block's insert fail with a PK conflict
    // specifically on "profiles_pkey" — the one signal that definitively means newUserId
    // already had a real, complete profile *before this request*. Only in that exact case must
    // we NOT delete it (that would destroy an unrelated pre-existing account). Any other insert
    // failure (a different unique violation, a NOT NULL/check violation, a transient error)
    // means newUserId had no pre-existing profile, so it's safe to roll back.
    const isPreExistingAccount = message.toLowerCase().includes('profiles_pkey')
    if (!isPreExistingAccount) {
      const { error: rollbackError } = await adminClient.auth.admin.deleteUser(newUserId)
      if (rollbackError) {
        // Surfaces the exact known footgun this rollback exists to prevent: if the delete
        // itself fails, newUserId is now an orphaned auth.users row with no profile.
        console.error('register-user: rollback deleteUser failed, orphaned auth user', {
          kind: input.kind,
          userId: newUserId,
        })
      }
    }

    return jsonResponse(isUniqueViolationMessage(message) ? 409 : 500, {
      error: isUniqueViolationMessage(message)
        ? 'That username/student number is already registered.'
        : 'Failed to create the account. Please try again.',
    })
  }

  // ---- 8. Email the invite link to the REAL recipient ----------------------------------
  const recipient = input.kind === 'teacher' ? input.contactEmail : input.guardianEmail

  try {
    const transport = nodemailer.createTransport({
      host: mailtrapHost,
      port: Number(mailtrapPort),
      auth: {
        user: mailtrapUser,
        pass: mailtrapPass,
      },
    })

    const { subject, html } = buildInviteEmail(input, actionLink)
    await transport.sendMail({
      from: '"Bayanluma 1 Elementary School" <no-reply@bl1es.portal>',
      to: recipient,
      subject,
      html,
    })
  } catch (sendError) {
    // Never log the action_link/token. Logging the recipient address is fine — the
    // superadmin who triggered this call already knows it.
    const message = extractErrorMessage(sendError)
    console.error('register-user: invite email send failed', {
      kind: input.kind,
      recipient,
      message,
    })
    // Account/profile rows already committed — do not roll those back for an email failure.
    return jsonResponse(502, {
      error:
        'Account created but the invite email could not be sent. Ask them to use "resend invite" once available, or contact support.',
    })
  }

  // ---- 9. Success — never return the link, token, or any credential -------------------
  return jsonResponse(200, { ok: true })
})
