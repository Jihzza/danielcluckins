// src/components/profile/SubscriptionsBox.jsx
import React from 'react';
import { useTranslation } from 'react-i18next'; // if using next-i18next, import from 'next-i18next'
import { CreditCardIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import ProfileDashboardBox from './ProfileDashboardBox';

const SubscriptionsBox = ({
  subscriptions = [],
  to = '/profile/subscriptions',
  maxDisplay = 2,
  currency = 'EUR'
}) => {
  const { t, i18n } = useTranslation();

  const formatCurrency = (amount = 0) => {
    const locale = i18n?.resolvedLanguage || i18n?.language || undefined;
    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits: 2
      }).format(amount);
    } catch {
      return `${amount.toFixed(2)} ${currency}`;
    }
  };

  const displayedSubscriptions = subscriptions.slice(0, maxDisplay);
  const hasMore = subscriptions.length > maxDisplay;

  return (
    <ProfileDashboardBox
      title={t('subscriptions.box.title')}
      to={to}
      className="bg-black/10"
    >
      <div className="space-y-2 md:space-y-3 lg:space-y-4">
        {displayedSubscriptions.length > 0 ? (
          displayedSubscriptions.map((subscription, index) => (
            <div key={index} className="flex items-center justify-between p-3 md:p-4 lg:p-5 rounded-xl border border-white/20 shadow-sm">
              <div className="flex items-center space-x-3 md:space-x-4 lg:space-x-5">
                <CreditCardIcon className="h-4 w-4 md:h-5 md:w-5 lg:h-6 lg:w-6 text-white/80" />
                <span className="text-sm md:text-base lg:text-lg font-medium text-white/90">
                  {subscription.planName || t('subscriptions.box.fallbackPlan')}
                </span>
                <div className="flex items-center space-x-1 md:space-x-2 lg:space-x-3">
                  <CheckCircleIcon className="h-4 w-4 md:h-5 md:w-5 lg:h-6 lg:w-6 text-white/80" />
                  <span className="text-xs md:text-sm lg:text-base text-white/80 font-medium">
                    {subscription.status
                      ? t(`subscriptions.box.status.${subscription.status}`, { defaultValue: subscription.status })
                      : t('subscriptions.box.status.active')}
                  </span>
                </div>
              </div>
              <span className="text-sm md:text-base lg:text-lg font-bold text-white">
                {formatCurrency(subscription.price || 0)}
              </span>
            </div>
          ))
        ) : (
          <div className="text-center py-4 md:py-6 lg:py-8">
            <CreditCardIcon className="h-8 w-8 md:h-10 md:w-10 lg:h-12 lg:w-12 text-white/40 mx-auto mb-2" />
            <p className="text-sm md:text-base lg:text-lg text-white/70">
              {t('subscriptions.box.empty')}
            </p>
          </div>
        )}

        {hasMore && (
          <div className="text-center pt-2 md:pt-3 lg:pt-4">
            <span className="text-xs md:text-sm lg:text-base text-white/60">
              {t('subscriptions.box.more', { count: subscriptions.length - maxDisplay })}
            </span>
          </div>
        )}
      </div>
    </ProfileDashboardBox>
  );
};

export default SubscriptionsBox;
