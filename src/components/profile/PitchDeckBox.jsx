// src/components/profile/PitchDeckBox.jsx
import React from 'react';
import { useTranslation } from 'react-i18next'; // if using next-i18next, import from 'next-i18next'
import { DocumentTextIcon, ClockIcon } from '@heroicons/react/24/outline';
import ProfileDashboardBox from './ProfileDashboardBox';
import ProfileBoxItem from './ProfileBoxItem';

const PitchDeckBox = ({ 
  requests = [], 
  to = '/profile/pitch-requests',
  maxDisplay = 3 
}) => {
  const { t, i18n } = useTranslation();

  const formatDate = (dateString) => {
    if (!dateString) return t('common.notAvailable');
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return t('common.notAvailable');

    // Prefer i18next Intl-based formatter; fall back to toLocaleDateString
    try {
      return t('common.dateShort', {
        val: d,
        formatParams: {
          val: { day: '2-digit', month: '2-digit', year: 'numeric' }
        }
      });
    } catch {
      return d.toLocaleDateString(i18n.resolvedLanguage || i18n.language || undefined, {
        day: '2-digit', month: '2-digit', year: 'numeric'
      });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'submitted': return 'text-white/80';
      case 'in_review': return 'text-white/80';
      case 'feedback_sent': return 'text-white/80';
      case 'archived': return 'text-white/60';
      default: return 'text-white/60';
    }
  };

  const displayedRequests = requests.slice(0, maxDisplay);
  const hasMore = requests.length > maxDisplay;

  return (
    <ProfileDashboardBox 
      title={t('pitchDeck.box.title')}
      to={to}
      className="bg-black/10"
    >
      <div className="space-y-1">
        {displayedRequests.length > 0 ? (
          displayedRequests.map((request, index) => (
            <ProfileBoxItem
              key={index}
              icon={DocumentTextIcon}
              primaryText={request.company || t('pitchDeck.box.untitled')}
              secondaryText={formatDate(request.submittedAt || request.created_at)}
              rightContent={
                <span className={`text-xs font-medium ${getStatusColor(request.status)}`}>
                  {request?.status
                    ? t(`pitchDeck.box.status.${request.status}`, { defaultValue: request.status })
                    : t('pitchDeck.box.status.submitted')}
                </span>
              }
            />
          ))
        ) : (
          <div className="flex items-center justify-center h-36 md:h-40 text-center">
            <div>
              <DocumentTextIcon className="h-8 w-8 md:h-10 md:w-10 text-white/40 mx-auto mb-2" />
              <p className="text-xs md:text-sm text-white/70">
                {t('pitchDeck.box.empty')}
              </p>
            </div>
          </div>
        )}

        {hasMore && (
          <div className="text-center pt-1">
            <span className="text-xs text-white/60">
              {t('pitchDeck.box.more', { count: requests.length - maxDisplay })}
            </span>
          </div>
        )}
      </div>
    </ProfileDashboardBox>
  );
};

export default PitchDeckBox;
