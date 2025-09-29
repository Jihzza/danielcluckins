// src/components/profile/ChatbotHistoryBox.jsx
import React from "react";
import { ChatBubbleLeftRightIcon, ClockIcon } from "@heroicons/react/24/outline";
import ProfileDashboardBox from "./ProfileDashboardBox";
import { useTranslation } from "react-i18next";

export default function ChatbotHistoryBox({
  items = [],
  to = "/profile/chatbot-history",
  maxDisplay = 3,
}) {
  const { t, i18n } = useTranslation();

  const displayed = items.slice(0, maxDisplay);
  const hasMore = items.length > maxDisplay;

  const formatDate = (dateString) => {
    if (!dateString) return t("common.notAvailable");
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return t("common.notAvailable");

    // Prefer i18next Intl formatter if available, fall back to toLocaleDateString
    try {
      return t("common.dateShort", {
        val: d,
        formatParams: {
          val: { day: "2-digit", month: "2-digit", year: "numeric" },
        },
      });
    } catch {
      return d.toLocaleDateString(i18n.language || undefined, {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    }
  };

  return (
    <ProfileDashboardBox
      title={t("chatbotHistory.box.title")}
      to={to}
      clickable
      className="bg-black/10"
    >
      <div className="space-y-2 md:space-y-3 lg:space-y-4">
        {displayed.length > 0 ? (
          displayed.map((row) => (
            <div
              key={row.session_id}
              className="w-full flex items-center justify-between p-3 md:p-4 lg:p-5 rounded-xl border border-white/20 shadow-sm"
              title={t("chatbotHistory.box.itemTooltip")}
            >
              <div className="flex items-center space-x-3 md:space-x-4 lg:space-x-5">
                <ChatBubbleLeftRightIcon className="h-4 w-4 md:h-5 md:w-5 lg:h-6 lg:w-6 text-white/80" />
                <div>
                  <span className="text-sm md:text-base lg:text-lg font-medium text-white/90 block">
                    {row.title || t("chatbotHistory.box.untitled")}
                  </span>
                  <div className="flex items-center space-x-2 md:space-x-3 lg:space-x-4 mt-1">
                    <ClockIcon className="h-3 w-3 md:h-4 md:w-4 lg:h-5 lg:w-5 text-white/60" />
                    <span className="text-xs md:text-sm lg:text-base text-white/70">
                      {formatDate(row.last_at)}
                    </span>
                  </div>
                </div>
              </div>

              <span className="text-xs md:text-sm lg:text-base text-white/70">
                {t("chatbotHistory.box.message", {
                  count: row.message_count ?? 0,
                })}
              </span>
            </div>
          ))
        ) : (
          <div className="text-center py-4 md:py-6 lg:py-8">
            <ChatBubbleLeftRightIcon className="h-8 w-8 md:h-10 md:w-10 lg:h-12 lg:w-12 text-white/40 mx-auto mb-2" />
            <p className="text-sm md:text-base lg:text-lg text-white/70">
              {t("chatbotHistory.box.empty")}
            </p>
          </div>
        )}

        {hasMore && (
          <div className="text-center pt-2 md:pt-3 lg:pt-4">
            <span className="text-xs md:text-sm lg:text-base text-white/60">
              {t("chatbotHistory.box.moreConversations", {
                count: items.length - maxDisplay,
              })}
            </span>
          </div>
        )}
      </div>
    </ProfileDashboardBox>
  );
}