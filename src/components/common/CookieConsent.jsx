import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const STORAGE_KEY = 'cookie-consent';

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        setVisible(true);
        // trigger entrance animation on next frame
        requestAnimationFrame(() => setEntered(true));
      }
    } catch {
      setVisible(true);
      requestAnimationFrame(() => setEntered(true));
    }
  }, []);

  const saveChoice = (value) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ value, ts: Date.now() }));
    } catch {}
  };

  const handleAcceptAll = () => {
    saveChoice('accepted');
    setVisible(false);
  };

  const handleRejectNonEssential = () => {
    saveChoice('essential_only');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 top-0 z-50 px-4 pt-4">
      <div
        className={
          "mx-auto max-w-4xl rounded-xl border border-white/20 bg-[#002147]/95 backdrop-blur supports-[backdrop-filter]:bg-[#002147]/80 text-white p-4 md:p-5 shadow-2xl transition-all duration-500 ease-out " +
          (entered ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4")
        }
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="text-sm leading-relaxed">
            <p className="font-semibold text-[#BFA200]">Cookies</p>
            <p className="mt-1 text-white/90">
              We use essential cookies to make this site work, and optional cookies to improve your experience. You can learn more in our{' '}
              <Link to="/cookie-policy" className="underline decoration-[#BFA200] underline-offset-4 hover:text-[#BFA200]">Cookie Policy</Link>.
            </p>
          </div>
          <div className="flex items-center gap-2 md:gap-3 shrink-0">
            <button
              type="button"
              onClick={handleRejectNonEssential}
              className="px-4 py-2 rounded-lg border border-[#BFA200] text-[#BFA200] hover:bg-[#BFA200]/10 transition-colors"
            >
              Reject non-essential
            </button>
            <button
              type="button"
              onClick={handleAcceptAll}
              className="px-4 py-2 rounded-lg bg-[#BFA200] text-black font-semibold hover:brightness-110 transition-colors"
            >
              Accept all
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


