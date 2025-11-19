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



// FULL COUNTRY LIST (Alphabetical)
const ALL_COUNTRIES = [
  { code: "AF", name: "Afghanistan" },
  { code: "AL", name: "Albania" },
  { code: "DZ", name: "Algeria" },
  { code: "AD", name: "Andorra" },
  { code: "AO", name: "Angola" },
  { code: "AR", name: "Argentina" },
  { code: "AM", name: "Armenia" },
  { code: "AU", name: "Australia" },
  { code: "AT", name: "Austria" },
  { code: "AZ", name: "Azerbaijan" },
  { code: "BH", name: "Bahrain" },
  { code: "BD", name: "Bangladesh" },
  { code: "BY", name: "Belarus" },
  { code: "BE", name: "Belgium" },
  { code: "BZ", name: "Belize" },
  { code: "BJ", name: "Benin" },
  { code: "BO", name: "Bolivia" },
  { code: "BR", name: "Brazil" },
  { code: "BG", name: "Bulgaria" },
  { code: "KH", name: "Cambodia" },
  { code: "CM", name: "Cameroon" },
  { code: "CA", name: "Canada" },
  { code: "CL", name: "Chile" },
  { code: "CN", name: "China" },
  { code: "CO", name: "Colombia" },
  { code: "CR", name: "Costa Rica" },
  { code: "HR", name: "Croatia" },
  { code: "CY", name: "Cyprus" },
  { code: "CZ", name: "Czech Republic" },
  { code: "DK", name: "Denmark" },
  { code: "EG", name: "Egypt" },
  { code: "EE", name: "Estonia" },
  { code: "FI", name: "Finland" },
  { code: "FR", name: "France" },
  { code: "GA", name: "Gabon" },
  { code: "DE", name: "Germany" },
  { code: "GH", name: "Ghana" },
  { code: "GR", name: "Greece" },
  { code: "HK", name: "Hong Kong" },
  { code: "HU", name: "Hungary" },
  { code: "IS", name: "Iceland" },
  { code: "IN", name: "India" },
  { code: "ID", name: "Indonesia" },
  { code: "IR", name: "Iran" },
  { code: "IQ", name: "Iraq" },
  { code: "IE", name: "Ireland" },
  { code: "IL", name: "Israel" },
  { code: "IT", name: "Italy" },
  { code: "JM", name: "Jamaica" },
  { code: "JP", name: "Japan" },
  { code: "JO", name: "Jordan" },
  { code: "KZ", name: "Kazakhstan" },
  { code: "KE", name: "Kenya" },
  { code: "KR", name: "Korea" },
  { code: "KW", name: "Kuwait" },
  { code: "LB", name: "Lebanon" },
  { code: "LY", name: "Libya" },
  { code: "LT", name: "Lithuania" },
  { code: "LU", name: "Luxembourg" },
  { code: "MG", name: "Madagascar" },
  { code: "MW", name: "Malawi" },
  { code: "MY", name: "Malaysia" },
  { code: "ML", name: "Mali" },
  { code: "MX", name: "Mexico" },
  { code: "MA", name: "Morocco" },
  { code: "MZ", name: "Mozambique" },
  { code: "NP", name: "Nepal" },
  { code: "NL", name: "Netherlands" },
  { code: "NZ", name: "New Zealand" },
  { code: "NG", name: "Nigeria" },
  { code: "NO", name: "Norway" },
  { code: "OM", name: "Oman" },
  { code: "PK", name: "Pakistan" },
  { code: "PH", name: "Philippines" },
  { code: "PL", name: "Poland" },
  { code: "PT", name: "Portugal" },
  { code: "QA", name: "Qatar" },
  { code: "RO", name: "Romania" },
  { code: "RU", name: "Russia" },
  { code: "SA", name: "Saudi Arabia" },
  { code: "SN", name: "Senegal" },
  { code: "SG", name: "Singapore" },
  { code: "ZA", name: "South Africa" },
  { code: "ES", name: "Spain" },
  { code: "SE", name: "Sweden" },
  { code: "CH", name: "Switzerland" },
  { code: "TZ", name: "Tanzania" },
  { code: "TH", name: "Thailand" },
  { code: "TN", name: "Tunisia" },
  { code: "TR", name: "Türkiye" },
  { code: "UG", name: "Uganda" },
  { code: "UA", name: "Ukraine" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "GB", name: "United Kingdom" },
  { code: "US", name: "United States" },
  { code: "VN", name: "Vietnam" },
  { code: "ZM", name: "Zambia" },
  { code: "ZW", name: "Zimbabwe" },
];

export default function OnboardingModal({ isOpen, onComplete }: OnboardingModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [username, setUsername] = useState("");
  const [code, setCode] = useState("");
  const [country, setCountry] = useState("");
  const [search, setSearch] = useState("");
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

                  {/* SEARCH BOX */}
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search country..."
                    className="mt-1 w-full rounded-md bg-black/40 border border-cyan-800 px-3 py-2 text-sm
                               focus:outline-none focus:border-cyan-400 mb-2"
                  />



                  {/* ALL COUNTRIES - FILTERED */}
                  <div className="text-[10px] text-cyan-500 mb-1">All Countries</div>
                  <div className="max-h-32 overflow-y-auto border border-cyan-900 rounded-md bg-black/30 p-2">
                    {ALL_COUNTRIES.filter(c =>
                      c.name.toLowerCase().includes(search.toLowerCase())
                    ).map((c) => (
                      <div
                        key={c.code}
                        className={`px-2 py-1 text-sm rounded-md cursor-pointer hover:bg-cyan-500/10
                                    ${country === c.code ? "bg-cyan-600/20" : ""}`}
                        onClick={() => setCountry(c.code)}
                      >
                        {c.name}
                      </div>
                    ))}
                  </div>
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
