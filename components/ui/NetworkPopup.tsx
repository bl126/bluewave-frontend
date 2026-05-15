"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Copy, Bell, Check, Loader2, Flame } from "lucide-react";
import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNetwork, notifyIndividual } from "@/lib/useApi";

interface NetworkMember {
  tg_id: number;
  name: string;
  photo_url: string | null;
  bw_id: string;
  last_notified_at: string | null;
}

interface NetworkPopupProps {
  isOpen: boolean;
  onClose: () => void;
  telegramId: number | null;
}

const NOTIFY_COOLDOWN = 4 * 60 * 60 * 1000; // 4 hours in ms

export default function NetworkPopup({ isOpen, onClose, telegramId }: NetworkPopupProps) {
  const { t } = useLanguage();
  const { data: network, loading, mutate } = useNetwork(isOpen ? telegramId : null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [notifyingIds, setNotifyingIds] = useState<Set<number>>(new Set());
  const [countdowns, setCountdowns] = useState<Record<number, string>>({});

  useEffect(() => {
    if (copiedId) {
      const timer = setTimeout(() => setCopiedId(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [copiedId]);

  useEffect(() => {
    const updateCountdowns = () => {
      if (!network?.inactive) return;
      const now = Date.now();
      const newCountdowns: Record<number, string> = {};

      network.inactive.forEach((member: NetworkMember) => {
        if (member.last_notified_at) {
          const lastSent = new Date(member.last_notified_at).getTime();
          const diff = NOTIFY_COOLDOWN - (now - lastSent);
          if (diff > 0) {
            const h = Math.floor(diff / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            newCountdowns[member.tg_id] = `${h}h ${m}m ${s}s`;
          }
        }
      });
      setCountdowns(newCountdowns);
    };

    updateCountdowns();
    const interval = setInterval(updateCountdowns, 1000);
    return () => clearInterval(interval);
  }, [network]);

  const handleCopy = (bwId: string) => {
    navigator.clipboard.writeText(bwId);
    setCopiedId(bwId);
  };

  const handleNotify = async (memberId: number) => {
    setNotifyingIds((prev) => new Set(prev).add(memberId));
    try {
      const res = await notifyIndividual(memberId);
      if (res.success) {
        mutate(); // Refresh data to get new last_notified_at
      }
    } catch (error) {
      console.error("Notify failed", error);
    } finally {
      setNotifyingIds((prev) => {
        const next = new Set(prev);
        next.delete(memberId);
        return next;
      });
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[150] bg-app-bg/80 backdrop-blur-md flex items-center justify-center p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="relative w-full max-w-sm bg-app-card border border-app-border rounded-[2.5rem] overflow-hidden flex flex-col max-h-[75vh] shadow-app-shadow"
          initial={{ scale: 0.9, y: 20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.9, y: 20, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Exit Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-app-accent/5 hover:bg-app-accent/10 border border-app-border transition-colors z-10"
          >
            <X size={16} className="text-text-main" />
          </button>

          {/* Header */}
          <div className="p-4 pt-8 flex flex-col items-center border-b border-app-border text-center">
            <h2 className="text-text-main text-lg font-black uppercase tracking-tight">{t("network.title")}</h2>
            <div className="flex gap-4 mt-2">
              <div className="flex flex-col">
                <span className="text-app-accent text-[10px] font-black leading-none">{(network?.active?.length || 0) + (network?.inactive?.length || 0)}</span>
                <span className="text-text-sub text-[6px] font-bold uppercase tracking-widest mt-0.5">Total Members</span>
              </div>
              <div className="w-[1px] h-4 bg-app-border self-center" />
              <div className="flex flex-col">
                <span className="text-app-accent text-[10px] font-black leading-none">{network?.active?.length || 0}</span>
                <span className="text-text-sub text-[6px] font-bold uppercase tracking-widest mt-0.5">Active Now</span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="animate-spin text-app-accent" size={32} />
                <span className="text-text-sub text-[10px] font-bold uppercase tracking-widest">Gathering Signals...</span>
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                {/* Active Section */}
                {network?.active?.length > 0 && (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2 px-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-app-accent animate-pulse" />
                      <span className="text-text-main text-[10px] font-black uppercase tracking-widest">{t("network.active")}</span>
                    </div>
                    <div className="flex flex-col gap-2">
                      {network.active.map((member: NetworkMember) => (
                        <MemberItem key={member.tg_id} member={member} active />
                      ))}
                    </div>
                  </div>
                )}

                {/* Inactive Section */}
                {network?.inactive?.length > 0 && (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2 px-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-text-sub/30" />
                      <span className="text-text-sub text-[10px] font-black uppercase tracking-widest">{t("network.inactive")}</span>
                    </div>
                    <div className="flex flex-col gap-2">
                      {network.inactive.map((member: NetworkMember) => (
                        <MemberItem
                          key={member.tg_id}
                          member={member}
                          isNotifying={notifyingIds.has(member.tg_id)}
                          countdown={countdowns[member.tg_id]}
                          onNotify={() => handleNotify(member.tg_id)}
                          onCopy={() => handleCopy(member.bw_id)}
                          isCopied={copiedId === member.bw_id}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {!network?.active?.length && !network?.inactive?.length && (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-16 h-16 rounded-full bg-app-accent/5 border border-app-border flex items-center justify-center mb-4">
                      <Bell size={24} className="text-text-sub/20" />
                    </div>
                    <p className="text-text-sub text-[10px] font-bold uppercase tracking-widest max-w-[150px]">
                      {t("network.no_members")}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function MemberItem({
  member,
  active,
  onNotify,
  onCopy,
  isNotifying,
  countdown,
  isCopied
}: {
  member: NetworkMember;
  active?: boolean;
  onNotify?: () => void;
  onCopy?: () => void;
  isNotifying?: boolean;
  countdown?: string;
  isCopied?: boolean;
}) {
  const { t } = useLanguage();

  return (
    <div className={`p-3 rounded-2xl border flex items-center gap-3 transition-all ${
      active
        ? "bg-app-accent/[0.03] border-app-accent/20"
        : "bg-white/[0.01] border-app-border opacity-70"
    }`}>
      {/* Avatar */}
      <div className={`w-10 h-10 rounded-xl overflow-hidden border ${
        active ? "border-app-accent/30" : "border-app-border"
      }`}>
        {member.photo_url ? (
          <img src={member.photo_url} alt={member.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-app-accent/10 flex items-center justify-center text-app-accent font-black text-sm">
            {member.name[0].toUpperCase()}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 flex flex-col min-w-0">
        <span className="text-text-main text-[11px] font-black truncate leading-tight">{member.name}</span>
        <div className="flex items-center gap-1 group mt-0.5">
          <span className="text-text-sub text-[8px] font-mono tracking-tighter opacity-60">{member.bw_id}</span>
          <button
            onClick={(e) => { e.stopPropagation(); onCopy?.(); }}
            className={`transition-colors ${isCopied ? "text-app-accent" : "text-text-sub/40 hover:text-text-main"}`}
          >
            {isCopied ? <Check size={8} /> : <Copy size={8} />}
          </button>
        </div>
      </div>

      {/* Action */}
      {!active && (
        <button
          onClick={onNotify}
          disabled={isNotifying || !!countdown}
          className={`px-3 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 h-8 min-w-[70px] justify-center ${
            isNotifying || countdown
              ? "bg-app-accent/5 border-app-border text-text-sub/30"
              : "bg-app-accent/10 border-app-accent/30 text-app-accent hover:bg-app-accent/20"
          }`}
        >
          {isNotifying ? (
            <Loader2 className="animate-spin" size={10} />
          ) : countdown ? (
            <span>{countdown}</span>
          ) : (
            <>
              <Bell size={10} />
              <span>{t("network.notify")}</span>
            </>
          )}
        </button>
      )}

      {active && (
        <div className="px-3 py-1.5 rounded-xl bg-app-accent/10 border border-app-accent/30 flex items-center gap-1.5 h-8">
          <div className="w-1.5 h-1.5 rounded-full bg-app-accent animate-pulse" />
          <span className="text-app-accent text-[8px] font-black uppercase tracking-widest">ACTIVE</span>
        </div>
      )}
    </div>
  );
}
