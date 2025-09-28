// src/components/profile/AccountSettingsBox.jsx
import React from 'react';
import { useTranslation } from 'react-i18next'; // if you're on next-i18next, import from 'next-i18next'
import { Cog6ToothIcon, UserCircleIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import ProfileDashboardBox from './ProfileDashboardBox';

const AccountSettingsBox = ({ 
  user,
  to = '/settings' 
}) => {
  const { t, i18n } = useTranslation();

  const formatDateTime = (dateString) => {
    if (!dateString) return t('common.notAvailable');
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return t('common.notAvailable');

    // Prefer i18next Intl-based formatter; fall back to toLocaleString
    try {
      return t('common.dateTimeShort', {
        val: d,
        formatParams: {
          val: {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }
        }
      });
    } catch {
      return d.toLocaleString(i18n.language || undefined, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  return (
    <ProfileDashboardBox 
      title={t('accountSettings.page.title')}
      to={to}
      className="bg-black/10"
    >
      <div className="space-y-3 md:space-y-4 lg:space-y-5">
        <div className="flex items-center space-x-3 md:space-x-4 lg:space-x-5 p-3 md:p-4 lg:p-5 rounded-xl border border-white/20 shadow-sm">
          <UserCircleIcon className="h-5 w-5 md:h-6 md:w-6 lg:h-7 lg:w-7 text-white/80" />
          <div>
            <span className="text-sm md:text-base lg:text-lg font-medium text-white/90 block">
              {t('accountSettings.box.email.label')}
            </span>
            <span className="text-xs md:text-sm lg:text-base text-white/70">
              {user?.email || t('common.notAvailable')}
            </span>
          </div>
        </div>
        
        <div className="flex items-center space-x-3 md:space-x-4 lg:space-x-5 p-3 md:p-4 lg:p-5 rounded-xl border border-white/20 shadow-sm">
          <ShieldCheckIcon className="h-5 w-5 md:h-6 md:w-6 lg:h-7 lg:w-7 text-white/80" />
          <div>
            <span className="text-sm md:text-base lg:text-lg font-medium text-white/90 block">
              {t('accountSettings.box.created.label')}
            </span>
            <span className="text-xs md:text-sm lg:text-base text-white/70">
              {user?.created_at ? formatDateTime(user.created_at) : t('common.notAvailable')}
            </span>
          </div>
        </div>
        
        <div className="flex items-center space-x-3 md:space-x-4 lg:space-x-5 p-3 md:p-4 lg:p-5 rounded-xl border border-white/20 shadow-sm">
          <Cog6ToothIcon className="h-5 w-5 md:h-6 md:w-6 lg:h-7 lg:w-7 text-white/80" />
          <div>
            <span className="text-sm md:text-base lg:text-lg font-medium text-white/90 block">
              {t('accountSettings.box.settings.label')}
            </span>
            <span className="text-xs md:text-sm lg:text-base text-white/70">
              {t('accountSettings.box.settings.description')}
            </span>
          </div>
        </div>
      </div>
    </ProfileDashboardBox>
  );
};

export default AccountSettingsBox;
