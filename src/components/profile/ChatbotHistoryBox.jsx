// src/components/profile/ChatbotHistoryBox.jsx
import React from "react";
import { ChatBubbleLeftRightIcon, ClockIcon } from "@heroicons/react/24/outline";
import ProfileDashboardBox from "./ProfileDashboardBox";
import ProfileBoxItem from "./ProfileBoxItem";
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
      <div className="space-y-1">
        {displayed.length > 0 ? (
          displayed.map((row) => (
            <ProfileBoxItem
              key={row.session_id}
              icon={ChatBubbleLeftRightIcon}
              primaryText={row.title || t("chatbotHistory.box.untitled")}
              secondaryText={formatDate(row.last_at)}
              rightContent={
                <span className="text-xs text-white/70">
                  {t("chatbotHistory.box.message", {
                    count: row.message_count ?? 0,
                  })}
                </span>
              }
              title={t("chatbotHistory.box.itemTooltip")}
            />
          ))
        ) : (
          <div className="flex items-center justify-center h-36 md:h-40 text-center">
            <div>
              <ChatBubbleLeftRightIcon className="h-8 w-8 md:h-10 md:w-10 text-white/40 mx-auto mb-2" />
              <p className="text-xs md:text-sm text-white/70">
                {t("chatbotHistory.box.empty")}
              </p>
            </div>
          </div>
        )}

        {hasMore && (
          <div className="text-center pt-1">
            <span className="text-xs text-white/60">
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
