// src/components/profile/FinancesBox.jsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { CurrencyEuroIcon } from '@heroicons/react/24/outline';
import ProfileDashboardBox from './ProfileDashboardBox';
import ProfileBoxItem from './ProfileBoxItem';

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
      <div className="space-y-1">
        <ProfileBoxItem
          icon={CurrencyEuroIcon}
          primaryText={t('finances.box.consultationsLifetime')}
          rightContent={
            <span className="text-xs md:text-base font-bold text-white">
              {formatCurrency(consultationEarnings)}
            </span>
          }
        />

        <ProfileBoxItem
          icon={CurrencyEuroIcon}
          primaryText={t('finances.box.coachingMonthly')}
          rightContent={
            <span className="text-xs md:text-base font-bold text-white">
              {formatCurrency(coachingRevenue)}
            </span>
          }
        />

        <ProfileBoxItem
          icon={CurrencyEuroIcon}
          primaryText={t('finances.box.pitchDecksFree')}
          rightContent={
            <span className="text-xs md:text-base font-bold text-white">
              {formatCurrency(pitchDeckEarnings)}
            </span>
          }
        />
      </div>
    </ProfileDashboardBox>
  );
};

export default FinancesBox;
