// src/components/profile/AccountSettingsBox.jsx
import React from 'react';
import { useTranslation } from 'react-i18next'; // if you're on next-i18next, import from 'next-i18next'
import { Cog6ToothIcon, UserCircleIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import ProfileDashboardBox from './ProfileDashboardBox';
import ProfileBoxItem from './ProfileBoxItem';

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
      <div className="space-y-1">
        <ProfileBoxItem
          icon={UserCircleIcon}
          primaryText={t('accountSettings.box.email.label')}
          secondaryText={user?.email || t('common.notAvailable')}
        />
        
        <ProfileBoxItem
          icon={ShieldCheckIcon}
          primaryText={t('accountSettings.box.created.label')}
          secondaryText={user?.created_at ? formatDateTime(user.created_at) : t('common.notAvailable')}
        />
        
        <ProfileBoxItem
          icon={Cog6ToothIcon}
          primaryText={t('accountSettings.box.settings.label')}
          secondaryText={t('accountSettings.box.settings.description')}
        />
      </div>
    </ProfileDashboardBox>
  );
};

export default AccountSettingsBox;