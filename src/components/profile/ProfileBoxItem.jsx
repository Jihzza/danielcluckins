// src/components/profile/ProfileBoxItem.jsx
import React from 'react';

const ProfileBoxItem = ({
  icon: Icon,
  primaryText,
  secondaryText,
  rightContent,
  className = '',
  onClick
}) => {
  const content = (
    <div 
      className={`flex items-center justify-between p-2 md:p-3 rounded-md border border-white/20 shadow-sm h-12 md:h-14 ${className}`}
      onClick={onClick}
    >
      <div className="flex items-center space-x-2 md:space-x-3 flex-1 min-w-0">
        {Icon && <Icon className="h-3 w-3 md:h-6 md:w-6 text-white/80 flex-shrink-0" />}
        <div className="min-w-0 flex-1">
          <div className="text-xs md:text-base font-medium text-white/90 truncate">
            {primaryText}
          </div>
          {secondaryText && (
            <div className="text-xs md:text-base text-white/70 truncate">
              {secondaryText}
            </div>
          )}
        </div>
      </div>
      {rightContent && (
        <div className="flex-shrink-0 ml-2 md:ml-3">
          {rightContent}
        </div>
      )}
    </div>
  );

  return content;
};

export default ProfileBoxItem;