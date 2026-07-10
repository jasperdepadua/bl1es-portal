// Seed the first superadmin. Run locally with your SECRET key — never commit secrets.
//
// 1. Copy .env.seed.example -> .env.seed.local (git-ignored) and fill in the values.
// 2. Run one of:
//      set -a && source .env.seed.local && set +a && npx tsx scripts/seed-superadmin.ts
//      npx tsx --env-file=.env.seed.local scripts/seed-superadmin.ts
//
// .env.seed.local defines: SUPABASE_URL, SUPABASE_SECRET_KEY (sb_secret_… — the new secret key,
// or the legacy service_role key), SEED_PASSWORD, and optional SEED_USERNAME / SEED_CONTACT_EMAIL /
// SEED_FIRST / SEED_LAST. Log in afterward with username "principal" (or SEED_USERNAME) + SEED_PASSWORD.
import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL
const secretKey = process.env.SUPABASE_SECRET_KEY
const password = process.env.SEED_PASSWORD
if (!url || !secretKey || !password) {
  throw new Error('Set SUPABASE_URL, SUPABASE_SECRET_KEY, and SEED_PASSWORD (see header for how)')
}

const username = process.env.SEED_USERNAME ?? 'principal'
const email = `${username}@staff.bl1es.portal` // synthesized auth email (login is by username)
const contactEmail = process.env.SEED_CONTACT_EMAIL ?? null

const admin = createClient(url, secretKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const { data, error } = await admin.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
})
if (error) throw error

const { error: profileError } = await admin.from('profiles').insert({
  id: data.user!.id,
  role: 'superadmin',
  username,
  contact_email: contactEmail,
  first_name: process.env.SEED_FIRST ?? 'School',
  last_name: process.env.SEED_LAST ?? 'Principal',
})
if (profileError) throw profileError

console.log(`Seeded superadmin — log in with username "${username}" and your chosen password.`)
