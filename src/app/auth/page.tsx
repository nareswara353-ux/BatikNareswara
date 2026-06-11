'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSignIn, useSignUp, useUser } from '@clerk/nextjs';
import { motion, AnimatePresence } from 'framer-motion';
import AuthBackground from '@/components/auth/AuthBackground';
import PasskeyButton from '@/components/auth/PasskeyButton';

type AuthTab = 'sign-in' | 'sign-up';

interface FormState {
  email: string;
  password: string;
  fullName: string;
}

const initialFormState: FormState = {
  email: '',
  password: '',
  fullName: '',
};

const tabVariants = {
  enter: { opacity: 0, x: 20 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

/**
 * Premium authentication page with biometric Passkeys (WebAuthn) as the primary CTA,
 * powered by Clerk. Features a split layout with animated batik-themed background,
 * glassmorphism card, tab-based sign-in/sign-up toggle, and passkey registration prompts.
 */
export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<AuthTab>('sign-in');
  const [form, setForm] = useState<FormState>(initialFormState);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPasskeyLoading, setIsPasskeyLoading] = useState(false);
  const [showPasskeyPrompt, setShowPasskeyPrompt] = useState(false);

  const { signIn, isLoaded: isSignInLoaded } = useSignIn() as any;
  const { signUp, isLoaded: isSignUpLoaded } = useSignUp() as any;
  const { user } = useUser();
  const router = useRouter();

  const updateField = useCallback(
    (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
      setError(null);
    },
    []
  );

  const switchTab = useCallback(
    (tab: AuthTab) => {
      setActiveTab(tab);
      setForm(initialFormState);
      setError(null);
    },
    []
  );

  // ── Biometric Passkey Authentication (WebAuthn) ──
  const handlePasskeySignIn = useCallback(async () => {
    if (!isSignInLoaded || !signIn) return;

    setIsPasskeyLoading(true);
    setError(null);

    try {
      const result = await signIn.authenticateWithPasskey({
        flow: 'discoverable',
      });

      if (result.status === 'complete' && result.createdSessionId) {
        router.push('/');
      }
    } catch (err: unknown) {
      const clerkError = err as { errors?: Array<{ longMessage?: string }> };
      const message =
        clerkError.errors?.[0]?.longMessage ||
        'Passkey authentication failed. Please try another method.';
      setError(message);
    } finally {
      setIsPasskeyLoading(false);
    }
  }, [isSignInLoaded, signIn, router]);

  // ── Email/Password Sign In ──
  const handleEmailSignIn = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!isSignInLoaded || !signIn) return;

      setIsLoading(true);
      setError(null);

      try {
        const result = await signIn.create({
          identifier: form.email,
          password: form.password,
        });

        if (result.status === 'complete') {
          router.push('/');
        }
      } catch (err: unknown) {
        const clerkError = err as { errors?: Array<{ longMessage?: string }> };
        setError(
          clerkError.errors?.[0]?.longMessage ||
          'Authentication failed. Please check your credentials.'
        );
      } finally {
        setIsLoading(false);
      }
    },
    [isSignInLoaded, signIn, form.email, form.password, router]
  );

  // ── Email/Password Sign Up ──
  const handleEmailSignUp = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!isSignUpLoaded || !signUp) return;

      setIsLoading(true);
      setError(null);

      try {
        const result = await signUp.create({
          firstName: form.fullName.split(' ')[0] || form.fullName,
          lastName: form.fullName.split(' ').slice(1).join(' ') || undefined,
          emailAddress: form.email,
          password: form.password,
        });

        if (result.status === 'complete') {
          setShowPasskeyPrompt(true);
        }
      } catch (err: unknown) {
        const clerkError = err as { errors?: Array<{ longMessage?: string }> };
        setError(
          clerkError.errors?.[0]?.longMessage ||
          'Registration failed. Please try again.'
        );
      } finally {
        setIsLoading(false);
      }
    },
    [isSignUpLoaded, signUp, form.fullName, form.email, form.password]
  );

  // ── Post-Signup Passkey Registration ──
  const handleCreatePasskey = useCallback(async () => {
    if (!user) return;

    setIsPasskeyLoading(true);
    try {
      await user.createPasskey();
      router.push('/');
    } catch (err: unknown) {
      const clerkError = err as { errors?: Array<{ longMessage?: string }> };
      setError(
        clerkError.errors?.[0]?.longMessage ||
        'Passkey registration failed. You can add one later in settings.'
      );
      // Navigate anyway — passkey is optional
      setTimeout(() => router.push('/'), 2000);
    } finally {
      setIsPasskeyLoading(false);
    }
  }, [user, router]);

  // ── Passkey Registration Prompt (post-signup) ──
  if (showPasskeyPrompt) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f0a05] via-[#1a120a] to-[#0d0903] flex items-center justify-center p-4">
        <AuthBackground />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="relative z-10 w-full max-w-md"
        >
          <div className="rounded-3xl bg-white/[0.06] backdrop-blur-2xl border border-white/10 shadow-2xl shadow-black/40 p-8 text-center">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="mx-auto mb-6 w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-900/20 flex items-center justify-center"
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-amber-400">
                <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
              </svg>
            </motion.div>

            <h2 className="font-['Playfair_Display'] text-2xl font-bold text-amber-50 mb-2">
              Account Created
            </h2>
            <p className="text-sm text-amber-200/60 mb-8 leading-relaxed">
              Secure your account with biometric authentication.
              Sign in instantly with TouchID, FaceID, or Windows Hello.
            </p>

            <div className="space-y-3">
              <PasskeyButton
                onClick={handleCreatePasskey}
                isLoading={isPasskeyLoading}
                label="Register Passkey Now"
              />

              <button
                type="button"
                onClick={() => router.push('/')}
                className="w-full py-3 text-sm text-amber-200/40 hover:text-amber-200/70 transition-colors"
              >
                Skip for now
              </button>
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 text-xs text-red-400/80"
              >
                {error}
              </motion.p>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0a05] via-[#1a120a] to-[#0d0903] flex items-center justify-center p-4 lg:p-8">
      <AuthBackground />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 rounded-3xl overflow-hidden bg-white/[0.04] backdrop-blur-2xl border border-white/[0.08] shadow-2xl shadow-black/50"
      >
        {/* ── Left Panel: Decorative Brand Panel ── */}
        <div className="hidden lg:flex flex-col justify-between p-10 bg-gradient-to-br from-[#D2691E]/10 to-transparent relative overflow-hidden">
          {/* Decorative batik pattern overlay */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23D2691E'%3E%3Cpath d='M30 0L60 30L30 60L0 30z' fill-opacity='0.4'/%3E%3Ccircle cx='30' cy='30' r='8' fill-opacity='0.3'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              backgroundSize: '60px 60px',
            }}
          />

          <div className="relative">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              <h1 className="font-['Playfair_Display'] text-4xl font-bold text-amber-50 tracking-tight leading-[1.15]">
                Batik
                <br />
                <span className="bg-gradient-to-r from-[#D2691E] to-[#CD853F] bg-clip-text text-transparent">
                  Nareswara
                </span>
              </h1>
              <p className="mt-4 text-sm text-amber-200/50 max-w-xs leading-relaxed">
                Mahakarya batik Indonesia — setiap helai menyimpan cerita warisan budaya nusantara.
              </p>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="relative space-y-6"
          >
            {/* Feature highlights */}
            {[
              { icon: '🔐', label: 'Passwordless Authentication', desc: 'TouchID / FaceID / Windows Hello' },
              { icon: '⚡', label: 'Instant Checkout', desc: 'One-tap purchase with biometric confirmation' },
              { icon: '🛡️', label: 'Enterprise Security', desc: 'FIDO2 WebAuthn standard compliance' },
            ].map((feature, i) => (
              <motion.div
                key={feature.label}
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + i * 0.15, duration: 0.5 }}
                className="flex items-start gap-3"
              >
                <span className="text-lg mt-0.5">{feature.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-amber-100/80">{feature.label}</p>
                  <p className="text-xs text-amber-200/40">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          <p className="relative text-[10px] text-amber-200/20 mt-6">
            Protected by FIDO2 &amp; WebAuthn Standards
          </p>
        </div>

        {/* ── Right Panel: Authentication Form ── */}
        <div className="p-8 md:p-10 lg:p-12 flex flex-col justify-center">
          {/* Mobile brand header */}
          <div className="lg:hidden text-center mb-8">
            <h1 className="font-['Playfair_Display'] text-2xl font-bold text-amber-50">
              Batik{' '}
              <span className="bg-gradient-to-r from-[#D2691E] to-[#CD853F] bg-clip-text text-transparent">
                Nareswara
              </span>
            </h1>
          </div>

          {/* Tab Toggle */}
          <div className="flex items-center rounded-xl bg-white/[0.04] p-1 mb-8 border border-white/[0.06]">
            {(['sign-in', 'sign-up'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => switchTab(tab)}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 ${activeTab === tab
                  ? 'bg-gradient-to-r from-[#D2691E] to-[#B8860B] text-white shadow-lg shadow-amber-900/30'
                  : 'text-amber-200/40 hover:text-amber-200/60'
                  }`}
              >
                {tab === 'sign-in' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          {/* Primary CTA: Passkey Authentication */}
          {activeTab === 'sign-in' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-6"
            >
              <PasskeyButton
                onClick={handlePasskeySignIn}
                isLoading={isPasskeyLoading}
              />
            </motion.div>
          )}

          {/* Divider */}
          {activeTab === 'sign-in' && (
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent to-white/10" />
              <span className="text-xs text-amber-200/30 font-medium uppercase tracking-widest">
                or
              </span>
              <div className="flex-1 h-px bg-gradient-to-l from-transparent to-white/10" />
            </div>
          )}

          {/* Error Display */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 overflow-hidden"
              >
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-300">
                  {error}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              variants={tabVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25 }}
            >
              <form
                onSubmit={activeTab === 'sign-in' ? handleEmailSignIn : handleEmailSignUp}
                className="space-y-5"
                noValidate
              >
                {activeTab === 'sign-up' && (
                  <div>
                    <label
                      htmlFor="auth-fullname"
                      className="block text-xs font-semibold text-amber-200/60 mb-2 uppercase tracking-wider"
                    >
                      Full Name
                    </label>
                    <input
                      id="auth-fullname"
                      type="text"
                      value={form.fullName}
                      onChange={updateField('fullName')}
                      required
                      disabled={isLoading}
                      autoComplete="name"
                      className="w-full px-4 py-3.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-amber-50 placeholder-amber-200/20 outline-none focus:ring-2 focus:ring-[#D2691E]/50 focus:border-[#D2691E]/50 transition-all duration-200 text-sm disabled:opacity-50"
                      placeholder="Nareswara Putra"
                    />
                  </div>
                )}

                <div>
                  <label
                    htmlFor="auth-email"
                    className="block text-xs font-semibold text-amber-200/60 mb-2 uppercase tracking-wider"
                  >
                    Email Address
                  </label>
                  <input
                    id="auth-email"
                    type="email"
                    value={form.email}
                    onChange={updateField('email')}
                    required
                    disabled={isLoading}
                    autoComplete="email"
                    className="w-full px-4 py-3.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-amber-50 placeholder-amber-200/20 outline-none focus:ring-2 focus:ring-[#D2691E]/50 focus:border-[#D2691E]/50 transition-all duration-200 text-sm disabled:opacity-50"
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <label
                    htmlFor="auth-password"
                    className="block text-xs font-semibold text-amber-200/60 mb-2 uppercase tracking-wider"
                  >
                    Password
                  </label>
                  <input
                    id="auth-password"
                    type="password"
                    value={form.password}
                    onChange={updateField('password')}
                    required
                    disabled={isLoading}
                    autoComplete={activeTab === 'sign-in' ? 'current-password' : 'new-password'}
                    minLength={8}
                    className="w-full px-4 py-3.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-amber-50 placeholder-amber-200/20 outline-none focus:ring-2 focus:ring-[#D2691E]/50 focus:border-[#D2691E]/50 transition-all duration-200 text-sm disabled:opacity-50"
                    placeholder="••••••••••••"
                  />
                </div>

                <motion.button
                  type="submit"
                  disabled={isLoading}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#D2691E] to-[#B8860B] text-white font-semibold text-sm shadow-lg shadow-amber-900/30 hover:shadow-xl hover:shadow-amber-900/40 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <motion.div
                        className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                      />
                      {activeTab === 'sign-in' ? 'Signing in…' : 'Creating account…'}
                    </>
                  ) : (
                    <>{activeTab === 'sign-in' ? 'Sign In with Email' : 'Create Account'}</>
                  )}
                </motion.button>
              </form>
            </motion.div>
          </AnimatePresence>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-white/[0.04] text-center">
            <p className="text-xs text-amber-200/25">
              {activeTab === 'sign-in' ? (
                <>
                  Don&apos;t have an account?{' '}
                  <button
                    type="button"
                    onClick={() => switchTab('sign-up')}
                    className="text-[#D2691E] hover:text-[#CD853F] font-semibold transition-colors"
                  >
                    Create one
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => switchTab('sign-in')}
                    className="text-[#D2691E] hover:text-[#CD853F] font-semibold transition-colors"
                  >
                    Sign in
                  </button>
                </>
              )}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
