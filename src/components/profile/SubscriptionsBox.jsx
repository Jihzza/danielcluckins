// src/components/profile/SubscriptionsBox.jsx
import React from 'react';
import { useTranslation } from 'react-i18next'; // if using next-i18next, import from 'next-i18next'
import { CreditCardIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import ProfileDashboardBox from './ProfileDashboardBox';
import ProfileBoxItem from './ProfileBoxItem';

const SubscriptionsBox = ({
  subscriptions = [],
  to = '/profile/subscriptions',
  maxDisplay = 3,
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
      <div className="space-y-1">
        {displayedSubscriptions.length > 0 ? (
          displayedSubscriptions.map((subscription, index) => (
            <ProfileBoxItem
              key={index}
              icon={CreditCardIcon}
              primaryText={subscription.planName || t('subscriptions.box.fallbackPlan')}
              secondaryText={subscription.status
                ? t(`subscriptions.box.status.${subscription.status}`, { defaultValue: subscription.status })
                : t('subscriptions.box.status.active')}
              rightContent={
                <span className="text-xs font-bold text-white">
                  {formatCurrency(subscription.price || 0)}
                </span>
              }
            />
          ))
        ) : (
          <div className="flex items-center justify-center h-36 md:h-40 text-center">
            <div>
              <CreditCardIcon className="h-8 w-8 md:h-10 md:w-10 text-white/40 mx-auto mb-2" />
              <p className="text-xs md:text-sm text-white/70">
                {t('subscriptions.box.empty')}
              </p>
            </div>
          </div>
        )}

        {hasMore && (
          <div className="text-center pt-1">
            <span className="text-xs text-white/60">
              {t('subscriptions.box.more', { count: subscriptions.length - maxDisplay })}
            </span>
          </div>
        )}
      </div>
    </ProfileDashboardBox>
  );
};

export default SubscriptionsBox;
