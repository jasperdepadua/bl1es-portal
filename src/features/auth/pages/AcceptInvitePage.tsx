import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { AlertCircle, ArrowRight, Eye, EyeOff, Lock } from 'lucide-react'
import { BrandLogo } from '@/components/brand-logo'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { useSetInvitePassword } from '@/features/auth/hooks/use-set-invite-password'

// Supabase appends `error`/`error_description` to the redirect (in the URL hash for the
// legacy implicit flow, or the query string for the PKCE flow) when an invite link is
// expired or has already been used. Never log the raw hash/search string — it may still
// carry a token fragment on the success path; only read specific known-safe param names.
function getInviteLinkErrorDescription(): string | null {
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  const searchParams = new URLSearchParams(window.location.search)
  return (
    hashParams.get('error_description') ??
    searchParams.get('error_description') ??
    (hashParams.get('error') || searchParams.get('error')
      ? 'This link has expired or already been used.'
      : null)
  )
}

const setPasswordSchema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type SetPasswordForm = z.infer<typeof setPasswordSchema>

function SetPasswordForm() {
  const navigate = useNavigate()
  const setInvitePassword = useSetInvitePassword()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SetPasswordForm>({
    resolver: zodResolver(setPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  })

  function onValid(values: SetPasswordForm) {
    setInvitePassword.mutate(values.password, {
      onSuccess: () => navigate('/dashboard', { replace: true }),
    })
  }

  return (
    <form onSubmit={handleSubmit(onValid)} className="mt-6 flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-bold text-foreground">
          Password
        </label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="Create a password"
            {...register('password')}
            className="h-12 w-full rounded-2xl border border-border bg-card pl-11 pr-11 text-sm font-medium text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-3 focus:ring-ring/30"
          />
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            className="absolute right-3 top-1/2 flex size-8 cursor-pointer -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
          </button>
        </div>
        {errors.password && (
          <p className="text-xs font-semibold text-destructive">{errors.password.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="confirmPassword" className="text-sm font-bold text-foreground">
          Confirm password
        </label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
          <input
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="Re-enter your password"
            {...register('confirmPassword')}
            className="h-12 w-full rounded-2xl border border-border bg-card pl-11 pr-11 text-sm font-medium text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-3 focus:ring-ring/30"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword((s) => !s)}
            className="absolute right-3 top-1/2 flex size-8 cursor-pointer -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground"
            aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
          >
            {showConfirmPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="text-xs font-semibold text-destructive">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      {setInvitePassword.isError && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive"
        >
          <AlertCircle className="size-4 shrink-0" />
          {setInvitePassword.error.message}
        </div>
      )}

      <button
        type="submit"
        disabled={setInvitePassword.isPending}
        className="mt-2 flex h-12 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-extrabold text-primary-foreground shadow-sm transition-transform hover:-translate-y-0.5 active:translate-y-0 disabled:pointer-events-none disabled:opacity-60"
      >
        {setInvitePassword.isPending ? 'Setting password…' : 'Set password'}
        <ArrowRight className="size-5" />
      </button>
    </form>
  )
}

export default function AcceptInvitePage() {
  const { session, isLoading } = useAuth()

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center justify-center">
          <BrandLogo />
        </div>

        <div className="rounded-3xl border border-border bg-card p-8 shadow-sm">
          {isLoading ? (
            <p className="text-center text-sm font-medium text-muted-foreground">
              Setting up your account…
            </p>
          ) : session ? (
            <>
              <h1 className="text-center font-display text-2xl font-extrabold tracking-tight text-foreground">
                Set your password
              </h1>
              <p className="mt-2 text-center text-sm font-medium text-muted-foreground">
                Choose a password to finish setting up your account.
              </p>
              <SetPasswordForm />
            </>
          ) : (
            <>
              <h1 className="text-center font-display text-2xl font-extrabold tracking-tight text-foreground">
                This link isn&apos;t valid
              </h1>
              <p className="mt-2 text-center text-sm font-medium text-muted-foreground">
                {getInviteLinkErrorDescription() ?? 'This link is invalid or has already been used.'}
              </p>
              <Link
                to="/login"
                className="mt-6 block text-center text-sm font-bold text-primary hover:underline"
              >
                Back to Login
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
