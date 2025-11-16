"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useState } from "react";

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: (user: any) => void;
}

interface VerifyResponse {
  tg_id: number;
  username: string;
  first_login_completed: boolean;
  country_code?: string | null;
  points_balance?: number;
}

const TOP_COUNTRIES = [
  { code: "NG", name: "Nigeria" },
  { code: "GH", name: "Ghana" },
  { code: "KE", name: "Kenya" },
  { code: "ZA", name: "South Africa" },
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "CA", name: "Canada" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "IN", name: "India" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "SA", name: "Saudi Arabia" },
  { code: "TR", name: "Türkiye" },
  { code: "BR", name: "Brazil" },
  { code: "AR", name: "Argentina" },
  { code: "IT", name: "Italy" },
  { code: "ES", name: "Spain" },
  { code: "NL", name: "Netherlands" },
  { code: "SE", name: "Sweden" },
  { code: "PK", name: "Pakistan" },
  // You can extend this list or plug a full country list later
];

export default function OnboardingModal({ isOpen, onComplete }: OnboardingModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [username, setUsername] = useState("");
  const [code, setCode] = useState("");
  const [country, setCountry] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verifiedUser, setVerifiedUser] = useState<VerifyResponse | null>(null);

  const apiBase = process.env.NEXT_PUBLIC_API_URL;

  const handleRequestCode = async () => {
    setError(null);
    const cleanUsername = username.trim();
    if (!cleanUsername) {
      setError("Enter your Telegram username.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/login/request_code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: cleanUsername }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.detail === "NOT_REGISTERED") {
          setError("You are not registered. Go to the Bluewave bot, type /start, then open the mini app again.");
        } else {
          setError("Could not request code. Try again.");
        }
        return;
      }

      setStep(2);
    } catch (e) {
      setError("Network error. Check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    setError(null);
    if (!code.trim()) {
      setError("Enter the 6-digit code sent to your Telegram.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/login/verify_code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), code: code.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.detail === "CODE_INVALID") setError("Invalid code. Please try again.");
        else if (data.detail === "CODE_EXPIRED") setError("Code expired. Request a new one.");
        else if (data.detail === "NOT_REGISTERED") {
          setError("You are not registered. Go to the Bluewave bot, type /start, then open the mini app again.");
        } else setError("Verification failed. Try again.");
        return;
      }

      const user: VerifyResponse = data;
      setVerifiedUser(user);

      // If user already completed onboarding earlier (another device), just finish.
      if (user.first_login_completed && user.country_code) {
        onComplete(user);
        return;
      }

      setStep(3);
    } catch (e) {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleActivatePresence = async () => {
    setError(null);
    if (!verifiedUser) {
      setError("Something went wrong. Please restart onboarding.");
      return;
    }
    if (!country) {
      setError("Select your country to activate your presence.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/user/update_profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tg_id: verifiedUser.tg_id,
          country_code: country,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError("Could not save profile. Try again.");
        return;
      }

      onComplete({
        ...verifiedUser,
        country_code: country,
        first_login_completed: true,
      });
    } catch (e) {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Fullscreen blur overlay */}
          <motion.div
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Centered glass card */}
          <motion.div
            className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
                       w-[90%] max-w-sm bg-black/70 backdrop-blur-2xl border border-cyan-900/70
                       rounded-2xl p-5 text-cyan-100 shadow-[0_0_30px_#00e6ff50]"
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.85, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="flex justify-between items-center mb-3">
              <div className="text-xs uppercase tracking-[0.2em] text-cyan-500">
                Bluewave Onboarding
              </div>
              <button
                className="text-cyan-400/70 hover:text-cyan-100 transition"
                onClick={() => {}}
                // We intentionally do NOT allow closing/onSkip.
              >
                <X size={16} />
              </button>
            </div>

            <h2 className="text-lg font-semibold text-cyan-200 mb-1">
              Activate Your Presence
            </h2>
            <p className="text-xs text-cyan-400 mb-4">
              This one-time setup links your Telegram account to the Bluewave ecosystem.
            </p>

            {step === 1 && (
              <div className="space-y-3">
                <label className="text-xs text-cyan-300">
                  Telegram username
                  <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="@yourusername"
                    className="mt-1 w-full rounded-md bg-black/40 border border-cyan-800 px-3 py-2 text-sm
                               focus:outline-none focus:border-cyan-400"
                  />
                </label>

                <button
                  onClick={handleRequestCode}
                  disabled={loading}
                  className="w-full mt-1 py-2 rounded-md text-sm font-medium
                             bg-cyan-500/20 border border-cyan-400 text-cyan-100
                             hover:bg-cyan-500/30 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? "Requesting..." : "Request Code"}
                </button>

                <p className="text-[11px] text-cyan-500/80">
                  Make sure you already typed <span className="text-cyan-300">/start</span> in the Bluewave bot before this step.
                </p>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-3">
                <p className="text-xs text-cyan-300">
                  A 6-digit code was sent to your Telegram account{" "}
                  <span className="text-cyan-100 font-medium">
                    {username.trim()}
                  </span>.
                </p>

                <label className="text-xs text-cyan-300">
                  Verification code
                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="123456"
                    maxLength={6}
                    className="mt-1 w-full rounded-md bg-black/40 border border-cyan-800 px-3 py-2 text-sm
                               tracking-[0.3em] text-center
                               focus:outline-none focus:border-cyan-400"
                  />
                </label>

                <button
                  onClick={handleVerifyCode}
                  disabled={loading}
                  className="w-full mt-1 py-2 rounded-md text-sm font-medium
                             bg-cyan-500/20 border border-cyan-400 text-cyan-100
                             hover:bg-cyan-500/30 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? "Verifying..." : "Verify Code"}
                </button>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-3">
                <p className="text-xs text-cyan-300 mb-1">
                  Last step — choose where your presence is mapped from.
                </p>

                <label className="text-xs text-cyan-300">
                  Country
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="mt-1 w-full rounded-md bg-black/40 border border-cyan-800 px-3 py-2 text-sm
                               focus:outline-none focus:border-cyan-400"
                  >
                    <option value="">Select your country</option>
                    {TOP_COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>

                <button
                  onClick={handleActivatePresence}
                  disabled={loading}
                  className="w-full mt-1 py-2 rounded-md text-sm font-medium
                             bg-cyan-500 border border-cyan-300 text-black
                             hover:bg-cyan-400 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? "Activating..." : "Activate Presence"}
                </button>
              </div>
            )}

            {error && (
              <div className="mt-3 text-[11px] text-red-400">
                {error}
              </div>
            )}

            <div className="mt-3 text-[10px] text-cyan-500/70">
              Your presence = your access. We never ask for passwords — only your Telegram identity.
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
