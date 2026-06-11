'use client';

import { motion } from 'framer-motion';

interface PasskeyButtonProps {
  onClick: () => void;
  isLoading: boolean;
  label?: string;
}

/**
 * Premium biometric passkey CTA button with fingerprint icon animation.
 * Uses Framer Motion for pulse, shimmer, and hover micro-interactions.
 */
export default function PasskeyButton({
  onClick,
  isLoading,
  label = 'Sign in with Passkey',
}: PasskeyButtonProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={isLoading}
      whileHover={{ scale: 1.02, y: -1 }}
      whileTap={{ scale: 0.98 }}
      className="relative w-full group overflow-hidden rounded-2xl p-[1px] transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {/* Animated gradient border */}
      <motion.div
        className="absolute inset-0 rounded-2xl"
        style={{
          background:
            'linear-gradient(135deg, #D2691E 0%, #B8860B 25%, #CD853F 50%, #B8860B 75%, #D2691E 100%)',
          backgroundSize: '200% 200%',
        }}
        animate={{
          backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'linear',
        }}
      />

      {/* Inner content */}
      <div className="relative flex items-center justify-center gap-3 rounded-[15px] bg-gradient-to-br from-[#1a1207] to-[#0d0903] px-6 py-4 transition-all">
        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <>
            <FingerprintIcon />
            <span className="text-sm font-semibold tracking-wide text-amber-100/90">
              {label}
            </span>
            <BiometricBadge />
          </>
        )}
      </div>

      {/* Hover shimmer overlay */}
      <motion.div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background:
            'linear-gradient(105deg, transparent 40%, rgba(210, 105, 30, 0.08) 45%, rgba(210, 105, 30, 0.15) 50%, rgba(210, 105, 30, 0.08) 55%, transparent 60%)',
          backgroundSize: '200% 100%',
        }}
        animate={{
          backgroundPosition: ['-100% 0%', '200% 0%'],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
    </motion.button>
  );
}

function FingerprintIcon() {
  return (
    <motion.div
      className="relative"
      animate={{
        scale: [1, 1.08, 1],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      {/* Pulse ring */}
      <motion.div
        className="absolute inset-0 rounded-full border border-amber-500/30"
        style={{ margin: '-6px' }}
        animate={{
          scale: [1, 1.4, 1],
          opacity: [0.4, 0, 0.4],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-amber-400"
      >
        <path
          d="M12 2C9.24 2 7 4.24 7 7v4c0 2.76 2.24 5 5 5s5-2.24 5-5V7c0-2.76-2.24-5-5-5z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M12 5c-1.1 0-2 .9-2 2v4c0 1.1.9 2 2 2s2-.9 2-2V7c0-1.1-.9-2-2-2z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M12 8v3"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M4.93 4.93A9.97 9.97 0 0 0 2 12c0 5.52 4.48 10 10 10s10-4.48 10-10c0-2.76-1.12-5.26-2.93-7.07"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
          opacity="0.5"
        />
        <path
          d="M7.05 7.05A6.98 6.98 0 0 0 5 12c0 3.87 3.13 7 7 7s7-3.13 7-7c0-1.93-.78-3.68-2.05-4.95"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
          opacity="0.3"
        />
      </svg>
    </motion.div>
  );
}

function BiometricBadge() {
  return (
    <span className="ml-1 inline-flex items-center rounded-full bg-amber-900/40 px-2 py-0.5 text-[10px] font-medium text-amber-400/80 ring-1 ring-amber-700/30">
      WebAuthn
    </span>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex items-center gap-3">
      <motion.div
        className="h-5 w-5 rounded-full border-2 border-amber-400/30 border-t-amber-400"
        animate={{ rotate: 360 }}
        transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
      />
      <span className="text-sm font-semibold text-amber-100/70">
        Verifying biometrics…
      </span>
    </div>
  );
}
