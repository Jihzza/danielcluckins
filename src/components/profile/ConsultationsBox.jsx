// src/components/profile/ConsultationsBox.jsx
import React from 'react';
import { useTranslation } from 'react-i18next'; // or from 'next-i18next' if that's your setup
import { ClockIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import ProfileDashboardBox from './ProfileDashboardBox';

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
      <div className="space-y-2 md:space-y-3 lg:space-y-4">
        {displayed.length > 0 ? (
          displayed.map((c, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 md:p-4 lg:p-5 rounded-xl border border-white/20 shadow-sm">
              <div className="flex items-center space-x-3 md:space-x-4 lg:space-x-5">
                <ClockIcon className="h-4 w-4 md:h-5 md:w-5 lg:h-6 lg:w-6 text-white/80" />
                <span className="text-sm md:text-base lg:text-lg font-medium text-white/90">
                  {formatDuration(c.duration)}
                </span>
                <span className="text-xs md:text-sm lg:text-base text-white/60">•</span>
                <div className="flex items-center space-x-1 md:space-x-2 lg:space-x-3">
                  <CheckCircleIcon className="h-4 w-4 md:h-5 md:w-5 lg:h-6 lg:w-6 text-white/80" />
                  <span className="text-xs md:text-sm lg:text-base text-white/80 font-medium">
                    {c.status ? t(`consultations.box.status.${c.status}`, c.status) : t('consultations.box.status.confirmed')}
                  </span>
                </div>
              </div>
              <span className="text-sm md:text-base lg:text-lg font-bold text-white">
                {formatCurrency(c.price)}
              </span>
            </div>
          ))
        ) : (
          <div className="text-center py-4 md:py-6 lg:py-8">
            <ClockIcon className="h-8 w-8 md:h-10 md:w-10 lg:h-12 lg:w-12 text-white/40 mx-auto mb-2" />
            <p className="text-sm md:text-base lg:text-lg text-white/70">
              {t('consultations.box.empty')}
            </p>
          </div>
        )}

        {hasMore && (
          <div className="text-center pt-2 md:pt-3 lg:pt-4">
            <span className="text-xs md:text-sm lg:text-base text-white/60">
              {t('consultations.box.more', { count: consultations.length - maxDisplay })}
            </span>
          </div>
        )}
      </div>
    </ProfileDashboardBox>
  );
};

export default ConsultationsBox;