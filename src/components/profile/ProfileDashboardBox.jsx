// src/components/profile/ProfileDashboardBox.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRightIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';

const ProfileDashboardBox = ({
  title,
  children,
  to,
  className = '',
  clickable = true
}) => {
  const { t } = useTranslation();

  const boxTitle = title || t('common.untitled');

  const content = (
    <div
      className={`bg-black/10 backdrop-blur-md rounded-md p-2 md:p-3 shadow-sm hover:bg-white/15 hover:shadow-md transition-all duration-200 h-full flex flex-col ${className}`}
    >
      <div className="flex items-center justify-between mb-1 md:mb-2">
        <h3 className="text-xs md:text-lg font-semibold text-white">{boxTitle}</h3>
        {clickable && to && (
          <>
            <ChevronRightIcon className="h-3 w-3 md:h-6 md:w-6 text-white/70" aria-hidden="true" />
            <span className="sr-only">{t('common.viewDetails')}</span>
          </>
        )}
      </div>
      <div className="text-white/90 flex-1 flex flex-col">{children}</div>
    </div>
  );

  if (clickable && to) {
    return (
      <Link to={to} className="block h-full" aria-label={t('common.open')}>
        {content}
      </Link>
    );
  }

  return content;
};

export default ProfileDashboardBox;
