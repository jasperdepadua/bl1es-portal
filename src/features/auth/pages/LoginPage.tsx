import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  User,
  Users,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  Star,
  BookOpen,
  AlertCircle,
} from 'lucide-react'
import { BrandLogo } from '@/components/brand-logo'
import { useLogin } from '@/features/auth/hooks/use-login'
import type { LoginRole } from '@/features/auth/api/resolve-login-email'
import { cn } from '@/lib/utils'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const wasDeactivated = (location.state as { deactivated?: boolean } | null)?.deactivated === true
  const login = useLogin()
  const [role, setRole] = useState<LoginRole>('student')
  const [showPassword, setShowPassword] = useState(false)
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    login.mutate(
      { identifier, password, role },
      { onSuccess: () => navigate('/dashboard') },
    )
  }

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* Illustration panel */}
      <section className="relative hidden flex flex-col justify-between overflow-hidden bg-primary px-8 py-10 text-primary-foreground lg:flex lg:w-1/2 lg:px-12">
        <div className="absolute -left-16 -top-16 size-56 rounded-full bg-secondary/30" />
        <div className="absolute -bottom-20 right-10 size-64 rounded-full bg-accent/25" />

        <div className="relative z-10 flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-2xl bg-primary-foreground/15">
            <BookOpen className="size-6" />
          </span>
          <span className="font-display text-lg font-extrabold">BL1ES Portal</span>
        </div>

        <div className="relative z-10 mx-auto my-8 w-full max-w-md">
          <div className="rounded-[2rem] bg-primary-foreground/10 p-4 backdrop-blur-sm">
            <img
              src="/login-illustration.png"
              alt="Illustration of cheerful students and a teacher learning together"
              width={640}
              height={640}
              className="h-auto w-full rounded-[1.5rem]"
            />
          </div>
        </div>

        <div className="relative z-10 max-w-md">
          <h2 className="text-balance font-display text-3xl font-extrabold leading-tight sm:text-4xl">
            Welcome back to a happy day of learning!
          </h2>
          <p className="mt-3 text-pretty font-medium text-primary-foreground/85">
            Sign in to stay connected with everything happening at BL1ES —
            attendance, progress, and updates, all in one cheerful place.
          </p>
        </div>
      </section>

      {/* Form panel */}
      <section className="flex flex-1 items-center justify-center bg-background px-6 py-10 sm:px-10">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center justify-between lg:hidden">
            <BrandLogo />
          </div>

          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-secondary/40 px-3 py-1 text-xs font-bold text-secondary-foreground">
            <Sparkles className="size-3.5" />
            Bayanluma 1 Elementary School
          </div>

          <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground">
            Sign in to your portal
          </h1>
          <p className="mt-2 font-medium text-muted-foreground">
            Choose who you are and enter your details to continue.
          </p>

          {/* Role toggle */}
          <div className="mt-6 grid grid-cols-2 gap-2 rounded-2xl bg-muted p-1.5">
            {(
              [
                { key: 'student', label: 'Student', icon: User },
                { key: 'teacher', label: 'Teacher', icon: Users },
              ] as const
            ).map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => setRole(key)}
                aria-pressed={role === key}
                className={cn(
                  'flex cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all',
                  role === key
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon className="size-4" />
                {label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="username"
                className="text-sm font-bold text-foreground"
              >
                {role === 'student' ? 'Student Number' : 'Username'}
              </label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="username"
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={
                    role === 'student' ? 'e.g. bl1es-2026-0142' : 'e.g. maria.reyes'
                  }
                  className="h-12 w-full rounded-2xl border border-border bg-card pl-11 pr-4 text-sm font-medium text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-3 focus:ring-ring/30"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="password"
                className="text-sm font-bold text-foreground"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="h-12 w-full rounded-2xl border border-border bg-card pl-11 pr-11 text-sm font-medium text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-3 focus:ring-ring/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 flex size-8 cursor-pointer -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="size-5" />
                  ) : (
                    <Eye className="size-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex cursor-not-allowed items-center gap-2 text-sm font-semibold text-muted-foreground opacity-50">
                <input
                  type="checkbox"
                  disabled
                  className="size-4 rounded border-border accent-primary disabled:cursor-not-allowed"
                />
                Remember me
              </label>
              <button
                type="button"
                disabled
                className="cursor-pointer text-sm font-bold text-primary hover:underline disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
              >
                Forgot password?
              </button>
            </div>

            {wasDeactivated && (
              <div
                role="alert"
                className="flex items-center gap-2 rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive"
              >
                <AlertCircle className="size-4 shrink-0" />
                Your account has been deactivated. Contact the school office if you
                believe this is a mistake.
              </div>
            )}

            {!wasDeactivated && login.isError && (
              <div
                role="alert"
                className="flex items-center gap-2 rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive"
              >
                <AlertCircle className="size-4 shrink-0" />
                {login.error.message}
              </div>
            )}

            <button
              type="submit"
              disabled={login.isPending}
              className="mt-2 flex h-12 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-extrabold text-primary-foreground shadow-sm transition-transform hover:-translate-y-0.5 active:translate-y-0 disabled:pointer-events-none disabled:opacity-60"
            >
              {login.isPending ? 'Signing in…' : 'Sign in'}
              <ArrowRight className="size-5" />
            </button>
          </form>

          <div className="mt-6 flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent">
              <Star className="size-5" />
            </span>
            <p className="text-xs font-medium text-muted-foreground">
              New to BL1ES? Ask your class adviser for your login details or
              contact the school office.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
