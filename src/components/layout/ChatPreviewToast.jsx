"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";
// ⚠️ Update this path to your actual asset if needed
import BotIcon from "../../assets/icons/DaGalow Branco.svg";

export default function ChatPreviewToast({
  open,
  text,
  onClick,
  bottomOffsetPx = 0,
}) {
  const { t } = useTranslation();

  const toastRef = useRef(null);
  const [exitOffset, setExitOffset] = useState({ x: 0, y: 96 });

  // Clean + clamp text (keeping your previous behavior)
  const cleaned = (text || "").replace(/\s+/g, " ").trim();
  const full = cleaned.length > 120 ? `${cleaned.slice(0, 120)}…` : cleaned;
  const POP_LEAD_MS = 180;
  const popTimerRef = useRef(null);
  // Simple typewriter reveal you already had
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (!open) return;
    setIdx(0);
    const id = setInterval(() => {
      setIdx((i) => (i < full.length ? i + 1 : i));
    }, 30);
    return () => clearInterval(id);
  }, [open, full]);

  const preview = useMemo(() => full.slice(0, idx), [full, idx]);

  // Measure toast center -> chat icon center vector for exit
  useEffect(() => {
    if (!open) return;

    const compute = () => {
      const toastEl = toastRef.current;
      const chatEl = document.getElementById("nav-chat-icon");
      if (!toastEl || !chatEl) {
        setExitOffset({ x: 0, y: 96 });
        return;
      }
      const t = toastEl.getBoundingClientRect();
      const c = chatEl.getBoundingClientRect();
      const toastCx = t.left + t.width / 2;
      const toastCy = t.top + t.height / 2;
      const chatCx = c.left + c.width / 2;
      const chatCy = c.top + c.height / 2;
      setExitOffset({ x: chatCx - toastCx, y: chatCy - toastCy });
    };

    compute();

    const ro = new ResizeObserver(compute);
    if (toastRef.current) ro.observe(toastRef.current);

    window.addEventListener("resize", compute);
    window.addEventListener("orientationchange", compute);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", compute);
      window.removeEventListener("orientationchange", compute);
    };
  }, [open]);

  // Announce exit start so the navbar can optionally pre-react
  useEffect(() => {
    if (open) {
      // if toast reopens while we had a pending popSoon, clear it
      if (popTimerRef.current) {
        clearTimeout(popTimerRef.current);
        popTimerRef.current = null;
      }
      return;
    }
    // Exit is starting now
    try { window.dispatchEvent(new Event("chatToastExitStart")); } catch { }
    // Nudge the icon pop slightly before exit completes
    popTimerRef.current = setTimeout(() => {
      try { window.dispatchEvent(new Event("chatToastPopSoon")); } catch { }
      popTimerRef.current = null;
    }, POP_LEAD_MS);
  }, [open]);

  return (
    <AnimatePresence
      // Announce exit completed (for the chat icon "pop")
      onExitComplete={() => {
        if (popTimerRef.current) {
          clearTimeout(popTimerRef.current);
          popTimerRef.current = null;
        }
        try {
          window.dispatchEvent(new Event("chatToastExitComplete"));
        } catch {
          // no-op
        }
      }}
    >
      {open && (
        <motion.button
          ref={toastRef}
          type="button"
          onClick={onClick}
          initial={{ y: 96, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          custom={exitOffset}
          exit={(c) => ({
            opacity: 0,
            scale: 0.3,
            x: c?.x ?? 0,
            y: c?.y ?? 96,
            transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] },
          })}
          transition={{ type: "spring", stiffness: 480, damping: 36 }}
          className="fixed left-1/2 -translate-x-1/2 w-[90%] md:w-[520px] text-left
                     rounded-2xl border px-4 py-3 shadow-xl
                     backdrop-blur bg-[#bfa200] select-none k"
          style={{
            bottom: `calc(${bottomOffsetPx}px + env(safe-area-inset-bottom))`,
            zIndex: 60, // above the nav (nav is z-50)
            transformOrigin: "center",
          }}
          aria-live="polite"
        >
          <div className="flex items-start gap-3">
            <img src={BotIcon} alt="" className="w-6 h-6 mt-0.5 filter invert" />
            <div className="flex-1">
              <div className="text-black text-[11px] uppercase tracking-wide mb-0.5 text-shadow-lg">
                {t("chatbot.previewToast.newFrom", {
                  defaultValue: "New from Daniel",
                })}
              </div>
              <div className="text-sm md:text-base leading-snug text-shadow-lg">
                {preview}
              </div>
            </div>
          </div>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 -translate-x-1/2 -bottom-[8px]
                       block h-4 w-4 rotate-45
                       bg-[#bfa200] shadow-lg"
          />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
