// src/components/profile/FinancesBox.jsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { CurrencyEuroIcon } from '@heroicons/react/24/outline';
import ProfileDashboardBox from './ProfileDashboardBox';

/**
 * Finances section box showing financial metrics
 */
const FinancesBox = ({
  consultationEarnings = 0,
  coachingRevenue = 0,
  pitchDeckEarnings = 0,
  to = '/profile/finances',
  currency = 'EUR',
}) => {
  const { t, i18n } = useTranslation();

  const formatCurrency = (amount) => {
    const locale = i18n?.resolvedLanguage || i18n?.language || undefined;
    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
      }).format(amount ?? 0);
    } catch {
      return `${(amount ?? 0).toFixed(2)} ${currency}`;
    }
  };

  return (
    <ProfileDashboardBox
      title={t('finances.box.title')}
      to={to}
      className="bg-black/10"
    >
      <div className="space-y-3 md:space-y-4 lg:space-y-5">
        <div className="flex items-center justify-between p-3 md:p-4 lg:p-5 rounded-xl border border-white/20 shadow-sm">
          <div className="flex items-center space-x-2 md:space-x-3 lg:space-x-4">
            <CurrencyEuroIcon className="h-5 w-5 md:h-6 md:w-6 lg:h-7 lg:w-7 text-white/80" />
            <span className="text-sm md:text-base lg:text-lg font-medium text-white/90">
              {t('finances.box.consultationsLifetime')}
            </span>
          </div>
          <span className="text-lg md:text-xl lg:text-2xl font-bold text-white">
            {formatCurrency(consultationEarnings)}
          </span>
        </div>

        <div className="flex items-center justify-between p-3 md:p-4 lg:p-5 rounded-xl border border-white/20 shadow-sm">
          <div className="flex items-center space-x-2 md:space-x-3 lg:space-x-4">
            <CurrencyEuroIcon className="h-5 w-5 md:h-6 md:w-6 lg:h-7 lg:w-7 text-white/80" />
            <span className="text-sm md:text-base lg:text-lg font-medium text-white/90">
              {t('finances.box.coachingMonthly')}
            </span>
          </div>
          <span className="text-lg md:text-xl lg:text-2xl font-bold text-white">
            {formatCurrency(coachingRevenue)}
          </span>
        </div>

        <div className="flex items-center justify-between p-3 md:p-4 lg:p-5 rounded-xl border border-white/20 shadow-sm">
          <div className="flex items-center space-x-2 md:space-x-3 lg:space-x-4">
            <CurrencyEuroIcon className="h-5 w-5 md:h-6 md:w-6 lg:h-7 lg:w-7 text-white/80" />
            <span className="text-sm md:text-base lg:text-lg font-medium text-white/90">
              {t('finances.box.pitchDecksFree')}
            </span>
          </div>
          <span className="text-lg md:text-xl lg:text-2xl font-bold text-white">
            {formatCurrency(pitchDeckEarnings)}
          </span>
        </div>
      </div>
    </ProfileDashboardBox>
  );
};

export default FinancesBox;