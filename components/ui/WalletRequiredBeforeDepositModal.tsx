"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, X, Loader2, ChevronRight } from "lucide-react";
import { useTonConnectUI, useTonAddress, toUserFriendlyAddress } from "@tonconnect/ui-react";
import { createPortal } from "react-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { getApi, postApi } from "@/lib/useApi";

interface WalletRequiredBeforeDepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Called when wallet is saved on profile — parent can open deposit flow */
  onReady: () => void;
  onGoToProfile: () => void;
  telegramUser?: any;
}

export default function WalletRequiredBeforeDepositModal({
  isOpen,
  onClose,
  onReady,
  onGoToProfile,
  telegramUser,
}: WalletRequiredBeforeDepositModalProps) {
  const { t } = useLanguage();
  const [tonConnectUI] = useTonConnectUI();
  const walletAddress = useTonAddress();
  const [mounted, setMounted] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const tgId = telegramUser?.id ?? telegramUser?.tg_id;
  const dbWallet = telegramUser?.wallet_address;

  useEffect(() => {
    setMounted(true);
  }, []);

  const trySyncWalletToProfile = useCallback(async () => {
    if (!tgId || !walletAddress || dbWallet) return false;
    setSyncing(true);
    setSyncError(null);
    try {
      let friendly = walletAddress;
      try {
        friendly = toUserFriendlyAddress(walletAddress);
      } catch {
        /* keep raw */
      }
      const res = await postApi("/user/update_profile", {
        tg_id: tgId,
        wallet_address: friendly,
      });
      const user = res?.user || res;
      if (user?.wallet_address) {
        window.dispatchEvent(
          new CustomEvent("updateUser", {
            detail: { wallet_address: user.wallet_address },
          })
        );
        return true;
      }
      const profile = await getApi(`/user/${tgId}`);
      if (profile?.wallet_address) {
        window.dispatchEvent(
          new CustomEvent("updateUser", {
            detail: { wallet_address: profile.wallet_address },
          })
        );
        return true;
      }
      setSyncError(t("deposit.wallet_sync_failed"));
      return false;
    } catch {
      setSyncError(t("deposit.wallet_sync_failed"));
      return false;
    } finally {
      setSyncing(false);
    }
  }, [tgId, walletAddress, dbWallet, t]);

  useEffect(() => {
    if (!isOpen || dbWallet) return;
    if (!walletAddress) return;
    void trySyncWalletToProfile();
  }, [isOpen, dbWallet, walletAddress, trySyncWalletToProfile]);

  useEffect(() => {
    if (!isOpen) return;
    if (dbWallet) {
      onReady();
      onClose();
    }
  }, [isOpen, dbWallet, onReady, onClose]);

  const handleConnect = () => {
    tonConnectUI.openModal();
  };

  const handleGoProfile = () => {
    onGoToProfile();
    onClose();
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[995] flex items-center justify-center p-4 pointer-events-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-app-bg/90 backdrop-blur-md"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            className="relative w-full max-w-sm bg-app-card border border-app-border rounded-3xl shadow-app-shadow overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 pt-5 pb-3 flex items-start justify-between gap-3 border-b border-app-border">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center">
                  <Wallet size={22} className="text-app-accent" />
                </div>
                <h3 className="text-sm font-black text-text-main uppercase tracking-tight">
                  {t("deposit.wallet_required_title")}
                </h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl bg-app-accent/5 border border-app-border text-text-sub"
                aria-label={t("deposit.wallet_gate_close")}
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-5 py-5 space-y-4">
              <p className="text-[11px] text-text-sub leading-relaxed">
                {t("deposit.wallet_required_desc")}
              </p>
              <ol className="text-[10px] text-text-main space-y-2 list-decimal list-inside font-medium">
                <li>{t("deposit.wallet_step_profile")}</li>
                <li>{t("deposit.wallet_step_connect")}</li>
                <li>{t("deposit.wallet_step_connected")}</li>
                <li>{t("deposit.wallet_step_topup")}</li>
              </ol>

              {syncing && (
                <div className="flex items-center gap-2 text-cyan-400 text-[10px] font-bold uppercase tracking-wider">
                  <Loader2 size={14} className="animate-spin" />
                  {t("deposit.wallet_syncing")}
                </div>
              )}
              {syncError && (
                <p className="text-[10px] text-red-400 font-medium">{syncError}</p>
              )}

              <button
                type="button"
                onClick={handleGoProfile}
                className="w-full py-3.5 rounded-2xl bg-app-accent text-app-bg font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2"
              >
                {t("deposit.go_to_profile")}
                <ChevronRight size={16} />
              </button>
              <button
                type="button"
                onClick={handleConnect}
                disabled={syncing}
                className="w-full py-3.5 rounded-2xl border border-app-border bg-app-accent/5 text-text-main font-black uppercase text-[10px] tracking-widest disabled:opacity-50"
              >
                {walletAddress
                  ? t("deposit.wallet_change_connect")
                  : t("deposit.connect_wallet")}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
