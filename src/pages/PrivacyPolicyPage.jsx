// src/pages/PrivacyPolicyPage.jsx

import React from 'react';
import { useTranslation } from 'react-i18next';
import SectionTextWhite from '../components/common/SectionTextWhite';

// Enhanced helper to render different content types with better styling
const renderContent = (item, index) => {
  switch (item.type) {
    case 'h4':
      return (
        <h4 key={index} className="text-xl font-bold text-white mt-8 mb-4 first:mt-0 border-b border-white/20 pb-2">
          {item.text}
        </h4>
      );
    case 'p':
      return (
        <p key={index} className="text-white/90 leading-relaxed mb-4 text-sm md:text-base">
          {item.text}
        </p>
      );
    case 'ul':
      return (
        <ul key={index} className="list-disc list-inside space-y-2 mb-4 text-white/90 text-sm md:text-base">
          {item.items.map((li, i) => (
            <li key={i} className="leading-relaxed">
              {li}
            </li>
          ))}
        </ul>
      );
    default:
      return null;
  }
};

export default function PrivacyPolicyPage() {
  const { t } = useTranslation();

  const pageContent = t('privacyPolicy', { returnObjects: true });

  return (
    <div className="relative min-h-[85vh] w-full overflow-hidden bg-[#002147]">
      {/* Decorative background accents */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 -left-32 h-72 w-72 rounded-full bg-black/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-80 w-80 rounded-full bg-[#002147]/40 blur-3xl" />
        <div className="absolute inset-0 opacity-30 [background:radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.18)_1px,transparent_1px)] [background-size:22px_22px]" />
      </div>

      <div className="mx-auto flex h-full max-w-4xl flex-col items-center justify-start px-6 py-12">
        <SectionTextWhite title={pageContent.title} />
        
        <div className="mt-8 w-full">
          <div className="rounded-2xl bg-black/10 p-8 shadow-2xl ring-1 ring-white/20 backdrop-blur-xl">
            {/* Simple header with dates */}
            <div className="mb-8 text-center">
              <p className="text-white/80 text-sm md:text-base">
                {pageContent.lead}
              </p>
            </div>

            {/* Content with improved formatting */}
            <div className="space-y-6">
              {pageContent.content?.map(renderContent)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};