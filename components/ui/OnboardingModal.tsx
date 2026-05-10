// [CODE: FRONTEND_ONBOARDING_MODAL_COMPONENT]
"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { getApi, postApi } from "@/lib/useApi";


// [CODE: FRONTEND_ONBOARDING_TYPES]
interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: (user: any) => void;
  autoUsername?: string;
  initialUser?: any;
}

interface VerifyResponse {
  tg_id: number;
  username: string;
  first_login_completed: boolean;
  country_code?: string | null;
  points_balance?: number;
}

import { ALL_COUNTRIES } from "@/lib/constants";

export default function OnboardingModal({ isOpen, onComplete, autoUsername, initialUser }: OnboardingModalProps) {
  const { t } = useLanguage();
  const [step, setStep] = useState<1 | 2 | 3>(initialUser ? 3 : 1);

  const [username, setUsername] = useState("");
  const [code, setCode] = useState("");
  const [country, setCountry] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verifiedUser, setVerifiedUser] = useState<VerifyResponse | null>(initialUser || null);

  useEffect(() => {
    if (initialUser) {
      setVerifiedUser(initialUser);
      setStep(3);
    }
  }, [initialUser]);

  const apiBase = process.env.NEXT_PUBLIC_API_URL;

  // Prefill username via Telegram InitData → fallback to backend tg_id lookup
  useEffect(() => {
    // 1️⃣ If LandingPage pre-filled autoUsername, use it
    if (autoUsername) {
      setUsername(autoUsername.toLowerCase());
      return;
    }

    // 2️⃣ Try Telegram InitData
    try {
      const tg = (window as any).Telegram?.WebApp;
      const tgUser = tg?.initDataUnsafe?.user;

      if (tgUser) {
        const uname =
          tgUser.username?.toLowerCase() || `bw_user_${tgUser.id}`;
        setUsername(uname);
        return;
      }
    } catch (e) {
      console.log("Telegram initData error:", e);
    }

    // 3️⃣ Fallback → extract tg_id from URL or LocalStorage & fetch username from backend
    try {
      const url = new URL(window.location.href);
      const tg_id = url.searchParams.get("tg_id") || window.localStorage.getItem("bw_tg_id");

      if (!tg_id) return;

      // Immediate fallback to avoid "loading..." state for new users
      setUsername(`bw_user_${tg_id}`);

      const fetchUsername = async () => {
        try {
          const data = await getApi(`/user/username/${tg_id}`);
          if (data.username) {
            setUsername(data.username.toLowerCase());
          }
        } catch (e) {
          console.log("Backend username prefill error:", e);
        }
      };

      fetchUsername();
    } catch (e) {
      console.log("URL parse error:", e);
    }
  }, [autoUsername]);


  const handleRequestCode = async () => {
    setError(null);
    const cleanUsername = username.trim();
    if (!cleanUsername) {
      setError(t("onboarding.error_username"));
      return;
    }
    setLoading(true);
    try {
      const data = await postApi(`/login/request_code`, { username: cleanUsername });

      // Since postApi returns data and handles errors via a common check, 
      // we need to check if the response was successful or had a detail error.
      // But postApi currently doesn't throw on 4xx, it returns the body.

      if (data.error || data.detail) {
        const err = data.error || data.detail;
        if (err === "NOT_REGISTERED") {
          setError(t("onboarding.error_not_registered"));
        } else if (err === "RATE_LIMITED" || err === "TOO_FAST") {
          setError(t("onboarding.error_rate_limit"));
        } else if (err === "TELEGRAM_DELIVERY_FAILED") {
          setError(t("onboarding.error_delivery_failed"));
        } else {
          setError(`${t("onboarding.error_request_code")} (${err})`);
        }
        return;
      }

      setStep(2);
    } catch (e) {
      setError(t("onboarding.error_network"));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    setError(null);
    if (!code.trim()) {
      setError(t("onboarding.error_verify_failed"));
      return;
    }
    setLoading(true);
    try {
      const data = await postApi(`/login/verify_code`, { username: username.trim(), code: code.trim() });

      if (data.error || data.detail) {
        const err = data.error || data.detail;
        if (err === "CODE_INVALID") setError(t("onboarding.error_invalid_code"));
        else if (err === "CODE_EXPIRED") setError(t("onboarding.error_expired_code"));
        else if (err === "NOT_REGISTERED") {
          setError(t("onboarding.error_not_registered"));
        } else setError(`${t("onboarding.error_verify_failed")} (${err})`);
        return;
      }

      if (!data.tg_id) {
        setError(t("onboarding.error_id_missing"));
        return;
      }

      const user: VerifyResponse = data;
      setVerifiedUser(user);

      // If user already completed onboarding earlier (another device), just finish.
      if (user.first_login_completed) {
        onComplete(user);
        return;
      }

      setStep(3);
    } catch (e) {
      setError(t("onboarding.error_network"));
    } finally {
      setLoading(false);
    }
  };

  const handleActivatePresence = async () => {
    setError(null);
    if (!verifiedUser) {
      setError(t("onboarding.error_restart"));
      return;
    }
    if (!country) {
      setError(t("onboarding.error_select_country"));
      return;
    }
    setLoading(true);
    try {
      const data = await postApi(`/user/update_profile`, {
        tg_id: verifiedUser.tg_id,
        username: username.trim(),
        country_code: country,
      });

      if (data.error || !data.success) {
        setError(t("onboarding.error_save_profile"));
        return;
      }

      onComplete({
        ...verifiedUser,
        country_code: country,
        first_login_completed: true,
      });
    } catch (e) {
      setError(t("onboarding.error_network"));
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
            className="fixed inset-0 z-40 bg-app-bg/70 backdrop-blur-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Centered glass card */}
          <motion.div
            className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
                       w-[90%] max-w-sm bg-app-card backdrop-blur-2xl border border-app-border
                       rounded-2xl p-5 text-text-main shadow-app-shadow"
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.85, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="flex justify-between items-center mb-3">
              <div className="text-xs uppercase tracking-[0.2em] text-app-accent">
                {t("onboarding.title")}
              </div>
              <button
                className="text-text-sub hover:text-text-main transition"
                onClick={() => { }}
              // We intentionally do NOT allow closing/onSkip.
              >
                <X size={16} />
              </button>
            </div>

            <h2 className="text-lg font-semibold text-text-main mb-1">
              {t("onboarding.hero_title")}
            </h2>
            <p className="text-xs text-app-accent mb-4">
              {t("onboarding.hero_desc")}
            </p>

            {step === 1 && (
              <div className="space-y-3">
                <label className="text-xs text-text-sub">
                  {t("onboarding.username_label")}
                  <input
                    value={username}
                    readOnly
                    placeholder={t("onboarding.loading")}
                    className="mt-1 w-full rounded-md bg-app-bg/40 border border-app-border px-3 py-2 text-sm
                               opacity-70 cursor-not-allowed"
                  />
                </label>

                <button
                  onClick={handleRequestCode}
                  disabled={loading}
                  className="w-full mt-1 py-2 rounded-md text-sm font-medium
                             bg-app-accent/20 border border-app-border text-text-main
                             hover:bg-app-accent/30 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? t("onboarding.btn_requesting") : t("onboarding.btn_request")}
                </button>

                <p className="text-[11px] text-text-sub">
                  {t("onboarding.bot_hint")}
                </p>

                <div className="pt-4 mt-2 border-t border-cyan-900/40 text-center">
                  <a
                    href="https://t.me/Reuben_TON"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-orange-400/80 hover:text-orange-300 transition-colors inline-block"
                  >
                    {t("onboarding.lost_account")} <span className="underline">{t("onboarding.contact_support")}</span>
                  </a>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-3">
                <p className="text-xs text-text-sub">
                  {t("onboarding.code_sent")}{" "}
                  <span className="text-text-main font-medium">
                    {username.trim()}
                  </span>.
                </p>

                <label className="text-xs text-text-sub">
                  {t("onboarding.code_label")}
                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="123456"
                    maxLength={6}
                    className="mt-1 w-full rounded-md bg-app-bg/40 border border-app-border px-3 py-2 text-sm
                               tracking-[0.3em] text-center
                               focus:outline-none focus:border-app-accent"
                  />
                </label>

                <button
                  onClick={handleVerifyCode}
                  disabled={loading}
                  className="w-full mt-1 py-2 rounded-md text-sm font-medium
                             bg-app-accent/20 border border-app-border text-text-main
                             hover:bg-app-accent/30 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? t("onboarding.btn_verifying") : t("onboarding.btn_verify")}
                </button>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-3">
                <p className="text-xs text-text-sub mb-1">
                  {t("onboarding.step3_title")}
                </p>

                <label className="text-xs text-text-sub">
                  {t("onboarding.country_label")}

                  {/* SEARCH BOX */}
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={t("onboarding.search_placeholder")}
                    className="mt-1 w-full rounded-md bg-app-bg/40 border border-app-border px-3 py-2 text-sm
                               focus:outline-none focus:border-app-accent mb-2"
                  />



                  {/* ALL COUNTRIES - FILTERED */}
                  <div className="text-[10px] text-app-accent mb-1">{t("onboarding.all_countries")}</div>
                  <div className="max-h-32 overflow-y-auto border border-app-border rounded-md bg-app-bg/30 p-2">
                    {ALL_COUNTRIES.filter(c =>
                      c.name.toLowerCase().includes(search.toLowerCase())
                    ).map((c) => (
                      <div
                        key={c.code}
                        className={`px-2 py-1 text-sm rounded-md cursor-pointer hover:bg-app-accent/10
                                    ${country === c.code ? "bg-app-accent/20" : ""}`}
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
                             bg-app-accent border border-app-border text-black
                             hover:bg-app-accent/80 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? t("onboarding.btn_activating") : t("onboarding.btn_activate")}
                </button>
              </div>
            )}

            {error && (
              <div className="mt-3 text-[11px] text-red-400">
                {error}
              </div>
            )}

            <div className="mt-3 text-[10px] text-text-sub">
              {t("onboarding.footer_note")}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
