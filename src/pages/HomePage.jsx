// src/pages/HomePage.jsx

import React, { useRef, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import HeroSection from './sections/HeroSection';
import AboutMeSection from './sections/AboutMeSection';
import ConsultationsSection from './sections/Consultations';
import CoachingSection from './sections/Coaching';
import PitchDeckSection from './sections/PitchDeck';
import OtherWinsSection from './sections/OtherWinsSection';
import MediaAppearancesSection from './sections/MediaAppearancesSection';
import TestimonialsSection from './sections/TestimonialsSection';
import SignupSection from './sections/SignupSection';
import InteractiveSections from './sections/InteractiveSections';
import ServiceSelectionStep from '../components/scheduling/ServiceSelectionStep';
import { saveHomeScrollPosition, getHomeScrollPosition, scrollToPosition } from '../utils/scrollPositionManager';
import { ScrollRootContext } from '../contexts/ScrollRootContext';
import ChatWithMeSection from './sections/ChatWithMeSection';

import { useTranslation } from 'react-i18next';
import { openaiService } from '../services/openaiService';
import { emitWelcomePreview } from '../utils/welcomeEmitter';
import { useAuth } from '../contexts/AuthContext';
import { getOrCreateChatSession } from '../services/chatService';
import ScrollToTopButton from '../components/common/ScrollToTopButton';

export default function HomePage() {
    const navigate = useNavigate();
    const location = useLocation();
    const schedulingRef = useRef(null);
    const { t, i18n } = useTranslation();
    const scrollContainer = useContext(ScrollRootContext);
    const { user } = useAuth();
    // Language change handling (debug logs removed)
    useEffect(() => {
        try {
            const onChange = (lng) => {
                // Language changed - no debug log needed
            };
            i18n.on('languageChanged', onChange);
            return () => i18n.off('languageChanged', onChange);
        } catch { }
    }, [i18n, t]);

    // All buttons on home page go directly to step 2 (specific service step)
    const handleScheduleService = (serviceId, details = null) => {
        // Build the URL with service parameter
        let url = `/schedule?service=${serviceId}`;

        // If Coaching, add plan parameter
        if (serviceId === 'coaching' && details) {
            // accept either { tier } payload or a direct id
            const planId = details?.tier?.id ?? details?.id ?? details ?? null;
            if (planId) {
                url += `&plan=${planId}`;
            }
        }

        // Navigate to the scheduling form page
        navigate(url);
    };

    useEffect(() => {
        const handlePageReady = () => {
            const savedStateJSON = sessionStorage.getItem('schedulingState');
            const legacyScrollTo = localStorage.getItem('scrollTo');

            if (savedStateJSON) {
                try {
                    const savedState = JSON.parse(savedStateJSON);

                    // Build URL with service and plan parameters
                    let url = `/schedule?service=${savedState.formData.serviceType}`;
                    if (savedState.formData.serviceType === 'coaching' && savedState.formData.coaching.plan) {
                        url += `&plan=${savedState.formData.coaching.plan}`;
                    }

                    // Navigate to the scheduling form page
                    navigate(url);

                } catch (error) {
                    console.error("Failed to restore state in HomePage:", error);
                } finally {
                    sessionStorage.removeItem('schedulingState');
                    if (legacyScrollTo) localStorage.removeItem('scrollTo');
                }
            } else if (legacyScrollTo) {
                const targetElement = document.getElementById(legacyScrollTo);
                if (targetElement) {
                    targetElement.scrollIntoView({ behavior: 'smooth' });
                }
                localStorage.removeItem('scrollTo');
            }
        };

        if (document.readyState === 'complete') {
            handlePageReady();
        } else {
            window.addEventListener('load', handlePageReady, { once: true });
        }

        return () => {
            window.removeEventListener('load', handlePageReady);
        };
    }, [navigate]); // The dependency array ensures this runs only once.

    // Scroll position tracking and restoration
    useEffect(() => {
        if (!scrollContainer?.current) return;

        const scrollElement = scrollContainer.current;

        // Check if we should restore scroll position
        const savedScrollPosition = getHomeScrollPosition();
        if (savedScrollPosition !== null) {
            // Small delay to ensure the page is fully rendered
            setTimeout(() => {
                scrollToPosition(savedScrollPosition, scrollElement);
            }, 100);
        }

        // Track scroll position changes
        const handleScroll = () => {
            const scrollTop = scrollElement.scrollTop;
            saveHomeScrollPosition(scrollTop);
        };

        scrollElement.addEventListener('scroll', handleScroll, { passive: true });

        return () => {
            scrollElement.removeEventListener('scroll', handleScroll);
        };
    }, [scrollContainer]);

    // Save scroll position when leaving the home page
    useEffect(() => {
        return () => {
            // This cleanup function runs when the component unmounts
            // (i.e., when navigating away from home page)
            if (scrollContainer?.current) {
                const scrollTop = scrollContainer.current.scrollTop;
                saveHomeScrollPosition(scrollTop);
            }
        };
    }, [scrollContainer]);

    // Observe Chat section visibility and broadcast event for navbar glow
    useEffect(() => {
        let observer = null;
        let retryTimeout = null;
        let retryCount = 0;
        const maxRetries = 10;
        const retryDelay = 100;
        let scrollHandler = null;

        const checkVisibility = () => {
            const section = document.getElementById('chat-section');
            if (!section) return false;

            const rect = section.getBoundingClientRect();
            const windowHeight = window.innerHeight;
            const windowWidth = window.innerWidth;
            
            // More sensitive detection: section is visible if any part is in viewport
            // and it's not completely above or below the visible area
            const isVisible = rect.bottom > 0 && rect.top < windowHeight && 
                             rect.right > 0 && rect.left < windowWidth;
            
            // Debug logging
            if (process.env.NODE_ENV === 'production') {
                console.log('Scroll detection - rect:', {
                    top: rect.top,
                    bottom: rect.bottom,
                    left: rect.left,
                    right: rect.right,
                    windowHeight,
                    windowWidth,
                    isVisible
                });
            }
            
            return isVisible;
        };

        const dispatchVisibilityEvent = (isVisible) => {
            // Debug log for production troubleshooting
            if (process.env.NODE_ENV === 'production') {
                console.log('Chat section visibility changed:', isVisible);
            }
            window.dispatchEvent(new CustomEvent('chatSectionVisible', { detail: isVisible }));
        };

        const setupObserver = () => {
            const section = document.getElementById('chat-section');
            if (!section) {
                // Retry if element not found and we haven't exceeded max retries
                if (retryCount < maxRetries) {
                    retryCount++;
                    retryTimeout = setTimeout(setupObserver, retryDelay);
                }
                return;
            }

            // Set up intersection observer with more sensitive threshold
            observer = new IntersectionObserver(
                ([entry]) => {
                    const isVisible = !!entry?.isIntersecting;
                    // Debug logging for intersection observer
                    if (process.env.NODE_ENV === 'production') {
                        console.log('Intersection observer - entry:', {
                            isIntersecting: entry?.isIntersecting,
                            intersectionRatio: entry?.intersectionRatio,
                            boundingClientRect: entry?.boundingClientRect,
                            rootBounds: entry?.rootBounds
                        });
                    }
                    dispatchVisibilityEvent(isVisible);
                },
                { 
                    threshold: 0.1,  // Much more sensitive - triggers when 10% is visible
                    rootMargin: '0px 0px -10% 0px'  // Trigger slightly before fully in view
                }
            );

            observer.observe(section);

            // Immediately check if section is already visible
            const initialVisibility = checkVisibility();
            if (initialVisibility) {
                dispatchVisibilityEvent(true);
            }

            // Fallback: also set up scroll listener as backup
            scrollHandler = () => {
                const isVisible = checkVisibility();
                dispatchVisibilityEvent(isVisible);
            };

            // Add scroll listener to the scroll container
            const scrollElement = scrollContainer?.current || window;
            scrollElement.addEventListener('scroll', scrollHandler, { passive: true });
        };

        // Start the setup process
        setupObserver();

        return () => {
            if (observer) observer.disconnect();
            if (retryTimeout) clearTimeout(retryTimeout);
            if (scrollHandler) {
                const scrollElement = scrollContainer?.current || window;
                scrollElement.removeEventListener('scroll', scrollHandler);
            }
        };
    }, [scrollContainer]);

    useEffect(() => {
        let cancelled = false;

        (async () => {
            try {
                const profile = user ? {
                    full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
                    email: user.email || null,
                    phone: user.user_metadata?.phone || null,
                } : null;

                let msg;
                if (openaiService.isConfigured()) {
                    msg = await openaiService.getWelcomeMessage(user?.id ?? null, profile);
                } else {
                    msg = "👋 Welcome! I'm here to help. What can I assist you with today?";
                }

                if (!cancelled && msg) {
                    const sessionId = getOrCreateChatSession();
                    const emittedKey = `welcome_emitted:${sessionId}`;
                    if (!sessionStorage.getItem(emittedKey)) {
                        sessionStorage.setItem(emittedKey, 'true');
                        emitWelcomePreview(msg); // writes pending_welcome_message & fires event
                    }
                }
            } catch (err) {
                // Silent fallback - welcome message will use default
            }
        })();

        return () => { cancelled = true; };
    }, [user?.id]);

    const ranRef = useRef(false);
    useEffect(() => {
      if (ranRef.current) return;
      ranRef.current = true;
      // side-effect here (emit toast, write to DB, etc.)
    }, []);

    return (
        <div
            id="page-top"
            className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#002147] to-[#ECEBE5] text-white px-4"
        >
            <HeroSection
                onScheduleConsultation={() => handleScheduleService('consultation')}
                onScheduleCoaching={(tier) => handleScheduleService('coaching', tier)}
                onScheduleInvestment={() => handleScheduleService('pitchdeck')}
            />
            <AboutMeSection />
            <div id="consultations-section" className="w-full">
                <ConsultationsSection onBookConsultation={() => handleScheduleService('consultation')} />
            </div>
            <div id="coaching-section" className="w-full">
                <CoachingSection onBookCoaching={(tier) => handleScheduleService('coaching', tier)} />
            </div>
            <div id="invest-section" className="w-full">
                <PitchDeckSection onBookPitchDeck={() => handleScheduleService('pitchdeck')} />
            </div>
            <div id="testimonials-section" className="w-full">
                <TestimonialsSection />
            </div>
            <div id="other-wins-section" className="w-full">
                <OtherWinsSection />
            </div>
            <div id="media-appearances-section" className="w-full">
                <MediaAppearancesSection />
            </div>
            <div id="signup-section" className="w-full">
                <SignupSection />
            </div>
            <div id="chatbot-section" className="w-full">
                <ChatWithMeSection />
            </div>
            <div id="scheduling-section" ref={schedulingRef} className="w-full">
                <div className="h-auto flex flex-col items-center justify-center py-4">
                    <div className="w-full max-w-2xl p-8 space-y-4 bg-[#002147] rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-200">
                        <h2 className="text-2xl font-bold text-white leading-tight md:text-3xl text-center mb-6">
                            {t('scheduling.serviceSelection.title')}
                        </h2>
                        <ServiceSelectionStep onSelectService={(serviceId) => handleScheduleService(serviceId)} />
                    </div>
                </div>
            </div>
            <div id="interactive-sections" className="w-full">
                <InteractiveSections />
            </div>
            
            {/* Scroll to Top Button */}
            <ScrollToTopButton />
        </div>
    );
}