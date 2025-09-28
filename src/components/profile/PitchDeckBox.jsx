// src/components/profile/PitchDeckBox.jsx
import React from 'react';
import { useTranslation } from 'react-i18next'; // if using next-i18next, import from 'next-i18next'
import { DocumentTextIcon, ClockIcon } from '@heroicons/react/24/outline';
import ProfileDashboardBox from './ProfileDashboardBox';

const PitchDeckBox = ({ 
  requests = [], 
  to = '/profile/pitch-requests',
  maxDisplay = 2 
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
      <div className="space-y-2 md:space-y-3 lg:space-y-4">
        {displayedRequests.length > 0 ? (
          displayedRequests.map((request, index) => (
            <div key={index} className="flex items-center justify-between p-3 md:p-4 lg:p-5 rounded-xl border border-white/20 shadow-sm">
              <div className="flex items-center space-x-3 md:space-x-4 lg:space-x-5">
                <DocumentTextIcon className="h-4 w-4 md:h-5 md:w-5 lg:h-6 lg:w-6 text-white/80" />
                <div>
                  <span className="text-sm md:text-base lg:text-lg font-medium text-white/90 block">
                    {request.company || t('pitchDeck.box.untitled')}
                  </span>
                  <div className="flex items-center space-x-2 md:space-x-3 lg:space-x-4 mt-1">
                    <ClockIcon className="h-3 w-3 md:h-4 md:w-4 lg:h-5 lg:w-5 text-white/60" />
                    <span className="text-xs md:text-sm lg:text-base text-white/70">
                      {formatDate(request.submittedAt || request.created_at)}
                    </span>
                  </div>
                </div>
              </div>

              <span className={`text-xs md:text-sm lg:text-base font-medium ${getStatusColor(request.status)}`}>
                {request?.status
                  ? t(`pitchDeck.box.status.${request.status}`, { defaultValue: request.status })
                  : t('pitchDeck.box.status.submitted')}
              </span>
            </div>
          ))
        ) : (
          <div className="text-center py-4 md:py-6 lg:py-8">
            <DocumentTextIcon className="h-8 w-8 md:h-10 md:w-10 lg:h-12 lg:w-12 text-white/40 mx-auto mb-2" />
            <p className="text-sm md:text-base lg:text-lg text-white/70">
              {t('pitchDeck.box.empty')}
            </p>
          </div>
        )}

        {hasMore && (
          <div className="text-center pt-2 md:pt-3 lg:pt-4">
            <span className="text-xs md:text-sm lg:text-base text-white/60">
              {t('pitchDeck.box.more', { count: requests.length - maxDisplay })}
            </span>
          </div>
        )}
      </div>
    </ProfileDashboardBox>
  );
};

export default PitchDeckBox;
