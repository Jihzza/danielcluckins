import React, { useEffect, useState, useMemo, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import OctagonAvatar from "../common/OctagonAvatar";
import { useTranslation } from "react-i18next";
import { motion, useAnimation } from "framer-motion";
import { scrollToTop } from "../../utils/scrollPositionManager";
import { createPortal } from "react-dom";

import ChatPreviewToast from "./ChatPreviewToast";

import homeIcon from "../../assets/icons/House Branco.svg";
import calendarIcon from "../../assets/icons/Calendar Branco.svg";
import settingsIcon from "../../assets/icons/Settings Branco.svg";
import profileIcon from "../../assets/icons/Profile Branco.svg";
import chatIcon from "../../assets/icons/CluckinsLogo.svg";
import { getOrCreateChatSession } from "../../services/chatService";

function useBreakpointValue(values) {
  const [val, setVal] = useState(values.base);
  useEffect(() => {
    const md = window.matchMedia("(min-width: 768px)");
    const lg = window.matchMedia("(min-width: 1024px)");
    const update = () => {
      if (lg.matches) setVal(values.lg ?? values.md ?? values.base);
      else if (md.matches) setVal(values.md ?? values.base);
      else setVal(values.base);
    };
    update();
    md.addEventListener("change", update);
    lg.addEventListener("change", update);
    return () => {
      md.removeEventListener("change", update);
      lg.removeEventListener("change", update);
    };
  }, [values]);
  return val;
}

function ImgIcon({ src, className, alt }) {
  return <img src={src} alt={alt ?? ""} className={`block ${className}`} />;
}

const ICON_BOX_CLASS = "h-7 w-7 md:h-8 md:w-8 lg:h-7 lg:w-7 shrink-0";
const LABEL_CLASS = "text-[10px] md:text-xs leading-none font-medium transition-opacity";
const BUTTON_CLASS = [
  "flex flex-col items-center justify-center gap-1 md:gap-1.5",
  "h-14 md:h-16 w-full focus:outline-none focus-visible:ring-2",
  "focus-visible:ring-cyan-400/70 rounded-lg",
  "cursor-pointer",
].join(" ");
const BAR_CLASS = "w-full fixed bottom-0 left-0 right-0 bg-black z-50";
const INNER_CLASS = "mx-auto grid grid-cols-5 items-center w-full lg:w-[80%] px-2";

export default function NavigationBar({ onNavigate, isChatbotOpen, onChatClick, navBarHeight = 56 }) {
  // Double-click tracking for home icon
  const homeClickTimeoutRef = useRef(null);
  const homeClickCountRef = useRef(0);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isLoggedIn } = useAuth();
  const { t, i18n } = useTranslation();
  const chatPop = useAnimation();

  // Glow state for chat icon when chat section is visible
  const [glowChatIcon, setGlowChatIcon] = useState(false);

  useEffect(() => {
    const onExitStart = () => {
      // Optional: small pre-glow or nothing
    };
    const doPop = () => {
      // Pop sequence (quick, snappy)
      chatPop.start({
        scale: [1, 1.18, 0.96, 1.08, 1],
        transition: { duration: 0.3, times: [0, 0.25, 0.55, 0.8, 1], ease: "easeOut" }
      });
    };
    window.addEventListener("chatToastPopSoon", doPop);
    window.addEventListener("chatToastExitComplete", doPop);
    return () => {
      window.removeEventListener("chatToastPopSoon", doPop);
      window.removeEventListener("chatToastExitComplete", doPop);
    };
  }, [chatPop]);


  useEffect(() => {
    const handler = (e) => setGlowChatIcon(!!e.detail);
    window.addEventListener('chatSectionVisible', handler);
    return () => window.removeEventListener('chatSectionVisible', handler);
  }, []);

  // Chatbot unread badge
  const [hasPendingWelcome, setHasPendingWelcome] = useState(false);
  const [welcomePreview, setWelcomePreview] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const popupTimeoutRef = useRef(null);
  const hasShownRef = useRef(false)
  // Global per-page-load guard (resets on full reload)
  if (typeof window !== 'undefined' && typeof window.__welcome_preview_shown === 'undefined') {
    window.__welcome_preview_shown = false;
  }

  useEffect(() => {
    hasShownRef.current = !!window.__welcome_preview_shown;

    const maybeShow = (source, msg) => {
      if (!msg) return;
      setHasPendingWelcome(true);
      setWelcomePreview(msg);
      if (!hasShownRef.current) {
        setShowPopup(true);
        hasShownRef.current = true;
        window.__welcome_preview_shown = true;
        if (popupTimeoutRef.current) clearTimeout(popupTimeoutRef.current);
        popupTimeoutRef.current = setTimeout(() => {
          setShowPopup(false);
        }, 2500);
      }
    };

    // If Home already put the message in sessionStorage before we mounted
    const pending = sessionStorage.getItem('pending_welcome_message');
    if (pending) {
      maybeShow('sessionStorage(pending)', pending);
    }

    const onReady = (e) => {
      const msg = e?.detail || sessionStorage.getItem('pending_welcome_message');
      maybeShow('welcomeMessageReady(event)', msg);
    };

    const onConsumed = () => {
      setHasPendingWelcome(false);
      setWelcomePreview('');
      setShowPopup(false);
      if (popupTimeoutRef.current) clearTimeout(popupTimeoutRef.current);
    };

    window.addEventListener('welcomeMessageReady', onReady);
    window.addEventListener('welcomeMessageConsumed', onConsumed);

    return () => {
      window.removeEventListener('welcomeMessageReady', onReady);
      window.removeEventListener('welcomeMessageConsumed', onConsumed);
      if (popupTimeoutRef.current) clearTimeout(popupTimeoutRef.current);
    };
    // run once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close the toast when entering /chat (but do NOT re-open on other pages)
  useEffect(() => {
    if (location.pathname === '/chat' && showPopup) {
      setShowPopup(false);
    }
  }, [location.pathname, showPopup]);

  const avatarSrc =
    user?.user_metadata?.avatar_url || user?.user_metadata?.picture || "";
  

  // Mark which items require aut
  const navItems = useMemo(
    () => [
      { icon: homeIcon, label: t("navigation.home"), path: "/", requiresAuth: false },
      { icon: calendarIcon, label: t("navigation.calendar"), path: "/calendar", requiresAuth: true },
      { icon: chatIcon, label: t("navigation.chat"), path: "/chat", isChat: true },
      { icon: settingsIcon, label: t("navigation.settings"), path: "/settings", requiresAuth: true },
      { icon: profileIcon, label: t("navigation.profile"), path: "/profile", requiresAuth: true, isProfile: true },
    ],
    [t, i18n.language]
  );

  // Route match helper
  const isActivePath = (base, current) => {
    if (!base) return false;
    if (base === "/") return current === "/";
    return current === base || current.startsWith(base + "/");
  };

  // Remember the "intended" selection for logged-out users
  const [ghostActivePath, setGhostActivePath] = useState(() => {
    if (!isLoggedIn) return sessionStorage.getItem("ghostActivePath");
    return null;
  });

  // Keep ghost in sync with auth changes
  useEffect(() => {
    if (!isLoggedIn) {
      const stored = sessionStorage.getItem("ghostActivePath");
      if (stored) setGhostActivePath(stored);
    }
    // Don't clear here — we only clear after user actually reaches the intended page post-login.
  }, [isLoggedIn]);


  // Only clear ghost once the user is authenticated and actually reaches the page
  useEffect(() => {
    if (!ghostActivePath) return;
    if (isLoggedIn && isActivePath(ghostActivePath, location.pathname)) {
      setGhostActivePath(null);
      sessionStorage.removeItem("ghostActivePath");
    }
  }, [isLoggedIn, location.pathname, ghostActivePath]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (homeClickTimeoutRef.current) {
        clearTimeout(homeClickTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!showPopup) return;
    if (popupTimeoutRef.current) clearTimeout(popupTimeoutRef.current);
    popupTimeoutRef.current = setTimeout(() => {
      setShowPopup(false);
    }, 2000);
    return () => {
      if (popupTimeoutRef.current) clearTimeout(popupTimeoutRef.current);
    };
  }, [showPopup]);

  const handleItemClick = (item) => {
    if (!item.path) return;

    // Special case: Home icon with double-click behavior
    if (item.path === "/") {
      const isOnHomePage = location.pathname === "/";

      if (isOnHomePage) {
        // On home page: handle double-click logic
        homeClickCountRef.current += 1;

        // Clear any existing timeout
        if (homeClickTimeoutRef.current) {
          clearTimeout(homeClickTimeoutRef.current);
        }

        // Set timeout to reset click count
        homeClickTimeoutRef.current = setTimeout(() => {
          homeClickCountRef.current = 0;
        }, 300); // 300ms window for double-click

        // If this is the second click, scroll to top
        if (homeClickCountRef.current === 2) {
          // Find the scroll container (main content area)
          const scrollContainer = document.querySelector('main');
          if (scrollContainer) {
            scrollToTop(scrollContainer);
          }
          homeClickCountRef.current = 0; // Reset immediately after action
        }
        // If it's the first click, do nothing (as requested)
      } else {
        // Not on home page: navigate to home (will restore scroll position)
        navigate("/");
      }
      return;
    }

    // If we're already on this item's destination, toggle back to the previous page
    if (isActivePath(item.path, location.pathname)) {
      navigate(-1);
      return;
    }

    const go = (p) => {
      if (typeof onNavigate === "function") onNavigate(p);
      else navigate(p);
    };

    //asd
    // If logged out and the tab needs auth, show it as selected and go directly to login
    if (!isLoggedIn && item.requiresAuth) {
      setGhostActivePath(item.path);
      sessionStorage.setItem("ghostActivePath", item.path);
      const loginUrl = `/login?next=${encodeURIComponent(item.path)}`;
      go(loginUrl);
      return;
    }

    if (item.isChat) {
      // clear the toast
      try { window.dispatchEvent(new Event('welcomeMessageConsumed')); } catch { }
      setHasPendingWelcome(false);
      setWelcomePreview('');
      setShowPopup(false);
      // open current chat session
      const sid = sessionStorage.getItem('chatbot-session-id') || getOrCreateChatSession();
      go(`/chat?session_id=${encodeURIComponent(sid)}`);
      return;
    }

    // Normal navigation for everything else
    go(item.path);
  };

  const avatarPx = useBreakpointValue({ base: 28, md: 32, lg: 28 });

  // NEW: If any real tab matches the current path, ignore ghost so only one label shows
  const hasRealActive = useMemo(
    () => navItems.some((n) => isActivePath(n.path, location.pathname)),
    [navItems, location.pathname]
  );

  useEffect(() => {
    function onPreview(e) {
      const { sessionId, welcome } = e.detail || {};
      const current = sessionStorage.getItem("chatbot-session-id");
      if (sessionId !== current) return;

      const toastKey = `toast_shown:${sessionId}`;
      if (sessionStorage.getItem(toastKey)) return;

      showToast(welcome); // your UI
      sessionStorage.setItem(toastKey, "true");
    }
    window.addEventListener("welcome-preview", onPreview);
    return () => window.removeEventListener("welcome-preview", onPreview);
  }, []);


  return (
    <nav
      id="bottom-nav"
      className={BAR_CLASS}
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      role="navigation"
      aria-label="Primary"
    >
      <div className={INNER_CLASS}>
        {navItems.map((item, idx) => {
          const reallyActive = isActivePath(item.path, location.pathname);
          const ghostActive =
            !isLoggedIn && ghostActivePath && isActivePath(item.path, ghostActivePath);

          // Only allow ghost when no real tab is active
          const active = hasRealActive ? reallyActive : (reallyActive || ghostActive);

          const isProfile = !!item.isProfile;
          const showAvatar = isProfile && !!avatarSrc;

          // base (active) and hover scaling — keeps label from scaling
          const baseScale = active ? 1.06 : 1;
          const hoverScale = active ? 1.09 : 1.06;

          return (
            <button
              key={`${item.label}-${idx}`}
              onClick={() => handleItemClick(item)}
              className={BUTTON_CLASS}
              aria-label={item.label}
              aria-current={reallyActive ? "page" : undefined}
              // Only expose pressed state for ghost when no real active exists
              aria-pressed={!hasRealActive && !reallyActive && ghostActive ? true : undefined}
              type="button"
            >
              {/* Icon / Avatar */}
              {showAvatar ? (
                <motion.div
                  className="grid place-items-center shrink-0"
                  style={{ width: avatarPx, height: avatarPx }}
                  animate={{ scale: baseScale }}
                  whileHover={{ scale: hoverScale }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.12 }}
                >
                  <OctagonAvatar
                    src={avatarSrc}
                    alt={t("navigation.profileAlt")}
                    size={avatarPx}
                    ringWidth={1}
                    gap={2}
                    ringColor={active ? "#bfa200" : "#9CA3AF"}
                  />
                </motion.div>
              ) : (
                <motion.div
                  id={item.isChat ? "nav-chat-icon" : undefined}
                  className={["grid place-items-center relative", ICON_BOX_CLASS, item.isChat && glowChatIcon ? "chat-icon-glow" : ""].join(" ")}
                  animate={{ scale: baseScale }}
                  whileHover={{ scale: hoverScale }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.12 }}
                >
                  <motion.div animate={item.isChat ? chatPop : undefined} className="grid place-items-center">
                    <ImgIcon
                      src={item.icon}
                      alt={item.label}
                      className="w-full h-full object-contain p-[1px] pointer-events-none select-none"
                    />
                  </motion.div>
                  {/* 🔴 Unread badge */}
                  {item.isChat && hasPendingWelcome && location.pathname !== '/chat' && (
                    <span
                      className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-black"
                      aria-label={t('chatbot.previewToast.newFrom', { defaultValue: 'New message' })}
                      role="status"
                    />
                  )}
                </motion.div>

              )
              }

              {/* Label */}
              {active && (
                <span className={[LABEL_CLASS, "text-white opacity-100"].join(" ")}>
                  {item.label}
                </span>
              )}
            </button>
          );
        })}
      </div>
      {
        createPortal(
          <ChatPreviewToast
            open={showPopup && location.pathname !== '/chat'}
            text={welcomePreview}
            bottomOffsetPx={navBarHeight + 60}
            onClick={() => {
              setShowPopup(false);
              window.dispatchEvent(new CustomEvent('welcomeMessageConsumed'));
              const sid = sessionStorage.getItem('chatbot-session-id') || getOrCreateChatSession();
              navigate(`/chat?session_id=${encodeURIComponent(sid)}`);
            }}
          />,
          document.body
        )
      }
    </nav >
  );
}