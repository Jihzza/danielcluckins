// src/components/profile/ConsultationsBox.jsx
import React from 'react';
import { useTranslation } from 'react-i18next'; // or from 'next-i18next' if that's your setup
import { ClockIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import ProfileDashboardBox from './ProfileDashboardBox';
import ProfileBoxItem from './ProfileBoxItem';

const ConsultationsBox = ({
  consultations = [],
  to = '/profile/appointments',
  maxDisplay = 3,
  currency = 'EUR'
}) => {
  const { t, i18n } = useTranslation();

  const formatCurrency = (amount = 0) => {
    const locale = i18n.resolvedLanguage || i18n.language || undefined;
    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits: 2
      }).format(amount);
    } catch {
      // Fallback if Intl formatter fails
      return `${amount.toFixed(2)} ${currency}`;
    }
  };

  const formatDuration = (minutes) => {
    if (!minutes && minutes !== 0) return t('common.notAvailable');

    if (minutes < 60) {
      return t('consultations.box.duration.minutes', { count: minutes });
    }

    const hours = Math.floor(minutes / 60);
    const remaining = minutes % 60;

    if (remaining > 0) {
      // e.g. "1h 30min" (both parts localized)
      return t('consultations.box.duration.hoursAndMinutes', {
        hours,
        minutes: remaining
      });
    }
    // e.g. "2h"
    return t('consultations.box.duration.hoursOnly', { count: hours });
  };

  const displayed = consultations.slice(0, maxDisplay);
  const hasMore = consultations.length > maxDisplay;

  return (
    <ProfileDashboardBox
      title={t('consultations.box.title')}
      to={to}
      className="bg-black/10"
    >
      <div className="space-y-1">
        {displayed.length > 0 ? (
          displayed.map((c, idx) => (
            <ProfileBoxItem
              key={idx}
              icon={ClockIcon}
              primaryText={formatDuration(c.duration)}
              secondaryText={c.status ? t(`consultations.box.status.${c.status}`, c.status) : t('consultations.box.status.confirmed')}
              rightContent={
                <span className="text-xs font-bold text-white">
                  {formatCurrency(c.price)}
                </span>
              }
            />
          ))
        ) : (
          <div className="flex items-center justify-center h-36 md:h-40 text-center">
            <div>
              <ClockIcon className="h-8 w-8 md:h-10 md:w-10 text-white/40 mx-auto mb-2" />
              <p className="text-xs md:text-sm text-white/70">
                {t('consultations.box.empty')}
              </p>
            </div>
          </div>
        )}

        {hasMore && (
          <div className="text-center pt-1">
            <span className="text-xs text-white/60">
              {t('consultations.box.more', { count: consultations.length - maxDisplay })}
            </span>
          </div>
        )}
      </div>
    </ProfileDashboardBox>
  );
};

export default ConsultationsBox;