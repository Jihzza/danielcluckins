import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTopButton = () => {
  const [isVisible, setIsVisible] = useState(false);
  const location = useLocation();

  // Only show on HomePage
  const isHomePage = location.pathname === '/';

  useEffect(() => {
    if (!isHomePage) {
      setIsVisible(false);
      return;
    }

    const toggleVisibility = () => {
      // Show button when user scrolls down more than 300px
      if (window.pageYOffset > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);

    return () => {
      window.removeEventListener('scroll', toggleVisibility);
    };
  }, [isHomePage]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // Don't render if not on HomePage
  if (!isHomePage) {
    return null;
  }

  return (
    <button
      onClick={scrollToTop}
      className={`
        fixed bottom-20 right-4 z-50
        w-12 h-12
        bg-black rounded-full
        flex items-center justify-center
        shadow-lg hover:shadow-xl
        transition-all duration-300 ease-in-out
        transform hover:scale-105
        focus:outline-none focus:ring-2 focus:ring-yellow-400/50
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'}
      `}
      aria-label="Scroll to top"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-[#bfa200]"
      >
        <path
          d="M12 19V5M5 12L12 5L19 12"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
};

export default ScrollToTopButton;
