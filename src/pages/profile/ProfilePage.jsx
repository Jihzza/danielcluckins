// src/pages/profile/ProfilePage.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeftOnRectangleIcon } from '@heroicons/react/24/outline';

import { useAuth } from '../../contexts/AuthContext';
import { getProfile } from '../../services/authService';
import { getAppointmentsByUserId } from '../../services/appointmentService';
import { getSubscriptionsByUserId } from '../../services/subscriptionService';
import { getPitchDeckRequestsByUserId } from '../../services/pitchDeckServices';
import { getFinancialMetrics } from '../../services/financialService';
import ProfileHeader from '../../components/profile/ProfileHeader';
import FinancesBox from '../../components/profile/FinancesBox';
import ConsultationsBox from '../../components/profile/ConsultationsBox';
import SubscriptionsBox from '../../components/profile/SubscriptionsBox';
import PitchDeckBox from '../../components/profile/PitchDeckBox';
import AccountSettingsBox from '../../components/profile/AccountSettingsBox';
import ChatbotHistoryBox from '../../components/profile/ChatbotHistoryBox';
import { getConversationSummaries } from '../../services/chatService';

export default function ProfilePage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [profile, setProfile] = useState({
    full_name: '',
    avatar_url: '',
    role: 'user',
    phone: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dashboardData, setDashboardData] = useState({
    finances: {
      consultationEarnings: 0,
      coachingRevenue: 0,
      pitchDeckEarnings: 0
    },
    consultations: [],
    subscriptions: [],
    pitchDeckRequests: [],
    chatbotHistory: []
  });

  useEffect(() => {
    const fetchAllData = async () => {
      if (!user) return;
      setLoading(true);

      try {
        // Fetch profile data
        const { data: profileData, error: profileError } = await getProfile(user.id);
        if (profileError) throw profileError;

        if (profileData) {
          const finalProfile = {
            ...profileData,
            avatar_url: profileData.avatar_url || user.user_metadata?.avatar_url || '',
          };
          setProfile(finalProfile);
        }

        // Fetch all dashboard data in parallel
        const [
          { data: financialData, error: financialError },
          { data: appointmentsData, error: appointmentsError },
          { data: subscriptionsData, error: subscriptionsError },
          { data: pitchDeckData, error: pitchDeckError },
          chatbotSummaries
        ] = await Promise.all([
          getFinancialMetrics(user.id),
          getAppointmentsByUserId(user.id),
          getSubscriptionsByUserId(user.id),
          getPitchDeckRequestsByUserId(user.id),
          getConversationSummaries(user.id)
        ]);

        // Handle financial data
        if (financialError) {
          console.error('Financial data error:', financialError);
        }

        // Transform appointments data for the consultations box
        const consultationsData = appointmentsData?.map(appointment => ({
          duration: appointment.duration_minutes,
          status: appointment.status || 'Confirmed',
          price: appointment.price || (appointment.duration_minutes * 1.5) // Default €1.5 per minute
        })) || [];

        // Transform subscriptions data
        const planPricing = {
          'basic': 40,    // €40/month for basic plan
          'standard': 90, // €90/month for standard plan  
          'premium': 230  // €230/month for premium plan
        };

        const subscriptionsDataFormatted = subscriptionsData?.map(subscription => {
          const planId = subscription.plan_id?.toLowerCase();
          const price = planPricing[planId] || 0;
          return {
            planName: subscription.plan_id || 'Subscription',
            status: subscription.status || 'Active',
            price: price
          };
        }) || [];

        // Transform pitch deck requests data
        const pitchDeckDataFormatted = pitchDeckData?.map(request => ({
          company: request.company_name || request.project || request.name || 'Untitled Request',
          status: request.status || 'submitted',
          submittedAt: request.submitted_at || request.created_at
        })) || [];

        // Update dashboard data
        setDashboardData({
          finances: financialData || {
            consultationEarnings: 0,
            coachingRevenue: 0,
            pitchDeckEarnings: 0
          },
          consultations: consultationsData,
          subscriptions: subscriptionsDataFormatted,
          pitchDeckRequests: pitchDeckDataFormatted,
          chatbotHistory: chatbotSummaries || []
        });

      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(t('profile.errors.load'));
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [user, t]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };


  if (loading) {
    return <div className="p-4 text-center">{t('profile.loading')}</div>;
  }
  if (error) {
    return <div className="p-4 text-center text-red-500">{error}</div>;
  }

  return (
    <div className="min-h-[85vh] bg-[#002147]">
      <ProfileHeader
        fullName={profile.full_name}
        phone={profile.phone}
        avatarUrl={profile.avatar_url}
        onEdit={() => navigate('/profile/edit')}
      />

      <div className="p-2 md:p-4 space-y-2 md:space-y-3">
        {/* First row - 3 boxes */}
        <div className="flex flex-col lg:flex-row gap-2 md:gap-3">
          <div className="flex-1">
            <ConsultationsBox
              consultations={dashboardData.consultations}
              to="/profile/appointments"
            />
          </div>
          <div className="flex-1">
            <SubscriptionsBox
              subscriptions={dashboardData.subscriptions}
              to="/profile/subscriptions"
            />
          </div>
          <div className="flex-1">
            <PitchDeckBox
              requests={dashboardData.pitchDeckRequests}
              to="/profile/pitch-requests"
            />
          </div>
        </div>

        {/* Second row - 3 boxes */}
        <div className="flex flex-col lg:flex-row gap-2 md:gap-3">
          <div className="flex-1">
            <ChatbotHistoryBox
              items={dashboardData.chatbotHistory}
              to="/profile/chatbot-history"
            />
          </div>
          <div className="flex-1">
            <FinancesBox
              consultationEarnings={dashboardData.finances.consultationEarnings}
              coachingRevenue={dashboardData.finances.coachingRevenue}
              pitchDeckEarnings={dashboardData.finances.pitchDeckEarnings}
              to="/profile/finances"
            />
          </div>
          <div className="flex-1">
            <AccountSettingsBox
              user={user}
              to="/settings"
            />
          </div>
        </div>
      
        <div className="pt-2">
          <button
            onClick={handleLogout}
            className="flex items-center justify-center p-2 w-full text-left text-red-400 hover:bg-red-900/20 transition-colors duration-200 rounded-md border border-red-400/50"
          >
            <ArrowLeftOnRectangleIcon className="h-4 w-4 md:h-6 md:w-6 mr-2" />
            <span className="text-sm md:text-base font-medium">
              {t('profile.logout')}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}