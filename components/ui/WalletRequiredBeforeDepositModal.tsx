"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence, useDragControls, type PanInfo } from "framer-motion";
import { Wallet, Loader2, ChevronRight } from "lucide-react";
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
  const dragControls = useDragControls();

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

  /* Telegram back button listener */
  useEffect(() => {
    if (!isOpen) return;
    const handleBack = () => onClose();
    window.addEventListener("bwNativeBack", handleBack);
    return () => window.removeEventListener("bwNativeBack", handleBack);
  }, [isOpen, onClose]);

  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (info.offset.y > 100) {
        onClose();
      }
    },
    [onClose]
  );

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
        <>
          {/* Backdrop */}
          <motion.div
            key="wallet-gate-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[998] bg-app-bg/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Bottom Sheet */}
          <motion.div
            key="wallet-gate-sheet"
            role="dialog"
            aria-modal="true"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 350 }}
            drag="y"
            dragControls={dragControls}
            dragConstraints={{ top: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            className="fixed bottom-0 left-0 right-0 z-[999] bg-app-card border-t border-app-border rounded-t-[2.5rem] flex flex-col max-h-[80vh] shadow-app-shadow"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag handle pill */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-text-sub/30" />
            </div>

            {/* Scrollable content */}
            <div className="overflow-y-auto pb-24 flex-1">
              {/* Header */}
              <div className="px-5 pt-2 pb-3 flex items-center gap-3 border-b border-app-border">
                <div className="w-11 h-11 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center shrink-0">
                  <Wallet size={22} className="text-app-accent" />
                </div>
                <h3 className="text-sm font-black text-text-main uppercase tracking-tight">
                  {t("deposit.wallet_required_title")}
                </h3>
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
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
