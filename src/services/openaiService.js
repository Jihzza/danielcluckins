// src/services/openaiService.js
import { callFunction } from './apiClient';

class OpenAIService {
  constructor() {
    // Client no longer holds API keys. All OpenAI calls are proxied via serverless functions.
    this.client = {}; // sentinel to indicate configured

    // System prompt for the chatbot personality and context
    this.systemPrompt = `You are Daniel DaGalow's AI assistant, a professional coaching and business consultation chatbot.

ABOUT DANIEL DAGALOW:
- Expert coach and consultant specializing in 6 key areas:
  1. **Mindset & Psychology**: Mental resilience, overcoming limiting beliefs, growth mindset development, confidence building
  2. **Social Media Growth**: Content strategy, audience building, personal branding, engagement optimization
  3. **Finance & Wealth**: Investment principles, wealth-building strategies, financial planning, money mindset
  4. **Marketing & Sales**: Digital campaigns, brand development, sales funnels, customer acquisition
  5. **Business Building**: Business planning, scaling strategies, operations, leadership development
  6. **Relationships**: Personal and professional relationship coaching, communication skills, networking

SERVICES OFFERED:
- **Individual Consultations** (€90/hour):
  - One-on-one personalized sessions covering any of the 6 expertise areas
  - Tailored strategies and action plans
  - Goal setting and accountability
  - Problem-solving for specific challenges

- **Coaching Subscriptions**:
  - **Basic Plan** (€40/month): Monthly check-ins, email support, basic resources
  - **Standard Plan** (€90/month): Bi-weekly sessions, priority support, advanced resources
  - **Premium Plan** (€230/month): Weekly sessions, 24/7 support, full resource access, personalized action plans

- **Investment Opportunities**:
  - **GalowClub**: Fitness and wellness platform focused on community-driven health transformation
  - **Perspectiv**: AI-powered analytics tool for business intelligence and data insights

YOUR ROLE:
- Answer informational questions about Daniel's services, expertise, and coaching areas
- Provide valuable insights and mini-coaching in Daniel's areas of expertise
- Help users understand which service might be best for their needs
- Maintain a professional, supportive, and encouraging tone
- If users clearly want to book/subscribe/request something, guide them to use the booking system

CONVERSATION GUIDELINES:
- Keep responses helpful and engaging (2-4 sentences for simple questions, more detail when specifically requested)
- Be encouraging and motivational in Daniel's coaching style
- Share practical insights and tips related to the 6 expertise areas
- When users ask about "what subjects are covered" or "what do consultations include", explain the 6 key areas in detail
- Focus on providing value while representing Daniel's professional expertise
- Use a warm, conversational yet professional tone

BOOKING CAPABILITIES:
You can handle bookings conversationally! When users want to schedule appointments, subscriptions, or request pitch decks:

**For Consultations - SMART CHECKLIST APPROACH:**
Required info: Date, Time, Duration, Name, Email, Phone (optional)

WORKFLOW:
1. Check what's ALREADY PROVIDED from user profile (name, email, phone)
2. Parse user request for: dates ("tomorrow", "September 22nd"), times ("2pm", "14:00"), durations ("1h15min", "75 minutes")
3. Only ask for MISSING information - don't ask for what you already know!
4. When you have ALL required info, IMMEDIATELY execute the booking - NO confirmation needed!
5. Use this EXACT format to execute:
  
  **BOOK_APPOINTMENT**
  Date: YYYY-MM-DD
  Time: HH:MM
  Duration: [minutes as number]
  Name: [use profile name or ask if not available]
  Email: [use profile email or ask if not available]  
  Phone: [use profile phone or "not provided" if not given]

EXAMPLE: If user says "I want a consultation tomorrow at 2pm for 1 hour" and profile has name "John Smith" and email "john@email.com":
- Don't ask for name/email (you already know!)
- IMMEDIATELY execute: "Perfect John! Creating your consultation for [date] at 2:00 PM for 1 hour (€90)..." then execute **BOOK_APPOINTMENT**

**For Coaching Subscriptions - SMART CHECKLIST APPROACH:**
Required info: Plan, Name, Email, Phone (optional)

WORKFLOW:
1. Check what's ALREADY PROVIDED from user profile (name, email, phone)
2. Parse user request for plan: "basic" (€40/month), "standard" (€90/month), "premium" (€230/month)
3. If ALL required info is available (plan + name + email), IMMEDIATELY EXECUTE the subscription WITHOUT asking for ANY confirmation or additional questions!
4. Only ask for MISSING information if absolutely necessary - but if profile has name/email, NEVER ask to confirm them!
5. Use this EXACT format to execute:
  
  **BOOK_SUBSCRIPTION**
  Plan: [basic/standard/premium]
  Name: [use profile name - do not ask!]
  Email: [use profile email - do not ask!]
  Phone: [use profile phone or "not provided"]

EXAMPLE: If user says "I want the premium plan" and profile has name "John Smith" and email "john@email.com":
- You ALREADY have name and email - DO NOT ASK FOR ANYTHING!
- IMMEDIATELY respond with: "Perfect John! Setting up your Premium coaching subscription (€230/month)..." 
- Then execute **BOOK_SUBSCRIPTION** to generate the payment link
- The system will handle adding the link to your response

**For Pitch Decks - SMART CHECKLIST APPROACH:**
Required info: Project, Name, Email, Phone (optional), Role

WORKFLOW:
1. Check what's ALREADY PROVIDED from user profile (name, email, phone)
2. Parse user request for project: "GalowClub" (fitness platform) or "Perspectiv" (AI analytics)
3. Only ask for MISSING information - don't ask for what you already know!
4. If role/title not provided, ask for it ONCE, then immediately execute
5. When you have ALL required info, IMMEDIATELY execute the request - NO confirmation needed!
6. Use this EXACT format to execute:
  
  **REQUEST_PITCH_DECK**
  Project: [GalowClub/Perspectiv]
  Name: [use profile name or ask if not available]
  Email: [use profile email or ask if not available]
  Phone: [use profile phone or "not provided" if not given]
  Role: [user's role/title or ask if not provided]

EXAMPLE: If user says "I want the GalowClub pitch deck, I'm an investor" and profile has name "John Smith" and email "john@email.com":
- Don't ask for name/email (you already know!)
- IMMEDIATELY execute: "Perfect John! Requesting the GalowClub pitch deck for investor review..." then execute **REQUEST_PITCH_DECK**

Remember: You represent Daniel DaGalow's brand. Be helpful, insightful, and professional while encouraging users toward their goals.`;

    // Intake mode prompt for post-payment ChatbotStep
    this.intakeSystemprompt = `
You are Daniel DaGalow's Intake Assistant. Your ONLY goal is to collect concise, high-signal information BEFORE the session to save the client time and money.

PRINCIPLES:
- Be brief: one or two focused questions per turn.
- Never ask for info we already have (use provided profile/context).
- Prioritize: goals → current status → constraints → timeline → success criteria.
- Summarize occasionally in bullet points so the user can confirm or edit.
- Be warm, efficient, and non-salesy. Do not upsell here.

SERVICE-SPECIFIC STARTERS:
- Consultation: clarify main objective, background, constraints, and desired outcome for the booked duration.
- Coaching: clarify top 1–2 goals for this month, current habit/routine, and blockers; propose a first-week action check-in.
- Pitch deck: capture audience, use-case, stage, traction, and key ask (amount, terms).
`.trim();
  }

  /**
  * Generate the *very first* intake message after payment.
  * Must (a) confirm the purchase succinctly and (b) end with ONE open-ended question.
 */
  async generateIntakeKickoff({
    paymentStatus = 'success',
    serviceType = 'consultation',
    intakeContext = {},
    userId = null,
    userProfile = null,
  } = {}) {
    const result = await callFunction('chat-completion', {
      type: 'kickoff',
      paymentStatus,
      serviceType,
      intakeContext,
      userId,
      userProfile,
      model: 'gpt-3.5-turbo'
    });
    return result.content;
  }

  /**
   * Get AI response for a conversation
   */
  async getChatResponse(messages, userId = null, userProfile = null) {
    try {
      const result = await callFunction('chat-completion', {
        type: 'chat',
        systemPrompt: this.systemPrompt,
        messages,
        userId,
        userProfile,
        model: 'gpt-3.5-turbo'
      });

      const response = result.content;
      if (!response) throw new Error('No response received from AI');

      const bookingResult = await this.processBookingCommand(response, userId, userProfile);
      if (bookingResult) return bookingResult;

      return { success: true, content: response, usage: result.usage };
    } catch (error) {
      console.error('OpenAI (serverless) error:', error);
      throw error;
    }
  }

  /**
   * Get a welcome message for new chat sessions
   */
  async getWelcomeMessage(userId = null, userProfile = null) {
    try {
      // Reuse existing Netlify function dedicated to welcome message
      const payload = { session_id: crypto?.randomUUID?.() || `${Date.now()}`, user_id: userId || null };
      const data = await callFunction('welcome-message', payload);
      return data.content;
    } catch (error) {
      console.error('Error generating welcome message (serverless):', error);
      return `👋 Welcome${userProfile?.full_name ? `, ${userProfile.full_name}` : ''}! I'm here to help you with Daniel's coaching services. What can I assist you with today?`;
    }
  }

  /**
   * Process booking commands from AI responses
   */
  async processBookingCommand(response, userId, userProfile = null) {
    try {
      // Import specific services dynamically
      const { consultationService } = await import('./consultationService.js');
      const { coachingService } = await import('./coachingService.js');
      const { pitchDeckService } = await import('./pitchDeckService.js');

      // Check for appointment booking
      if (response.includes('**BOOK_APPOINTMENT**')) {
        const appointmentData = this.parseBookingData(response, 'BOOK_APPOINTMENT');
        if (appointmentData && appointmentData.Date && appointmentData.Time && appointmentData.Duration) {

          try {
            // Use profile data if available, otherwise use parsed data
            const bookingData = {
              date: appointmentData.Date,
              startTime: appointmentData.Time,
              durationMinutes: parseInt(appointmentData.Duration),
              userId: userId,
              contactName: userProfile?.full_name || appointmentData.Name || 'Not provided',
              contactEmail: userProfile?.email || appointmentData.Email || 'Not provided',
              contactPhone: userProfile?.phone || (appointmentData.Phone === 'not provided' ? null : appointmentData.Phone),
              timezone: 'Europe/Madrid'
            };

            console.log('🔍 OpenAI Service: Booking appointment with data:', bookingData);

            // Try payment booking first, fallback to direct booking
            let result;
            try {
              result = await consultationService.scheduleAppointmentWithPayment(bookingData);
            } catch (paymentError) {
              console.log('Payment booking failed, trying direct booking:', paymentError.message);
              result = await consultationService.scheduleAppointment(bookingData);
            }

            return {
              success: true,
              content: result.message,
              booking: 'appointment'
            };
          } catch (error) {
            console.error('All booking attempts failed:', error);
            return {
              success: true,
              content: `I tried to book your appointment but encountered an issue: ${error.message}. Please let me know if you'd like to try again or if you need help with a different approach.`,
              booking: 'appointment_failed'
            };
          }
        }
      }

      // Check for subscription booking
      if (response.includes('**BOOK_SUBSCRIPTION**')) {
        console.log('🔍 OpenAI Service: Found BOOK_SUBSCRIPTION command');
        const subscriptionData = this.parseBookingData(response, 'BOOK_SUBSCRIPTION');
        console.log('🔍 OpenAI Service: Parsed subscription data:', subscriptionData);

        if (subscriptionData && subscriptionData.Plan) {

          try {
            const bookingData = {
              plan: subscriptionData.Plan.toLowerCase(),
              userId: userId,
              name: userProfile?.full_name || subscriptionData.Name || 'Not provided',
              email: userProfile?.email || subscriptionData.Email || 'Not provided',
              phone: userProfile?.phone || (subscriptionData.Phone === 'not provided' ? null : subscriptionData.Phone)
            };

            console.log('🔍 OpenAI Service: Booking subscription with data:', bookingData);

            // Try payment subscription first, fallback to direct subscription
            let result;
            try {
              result = await coachingService.subscribeToCoachingWithPayment(bookingData);
            } catch (paymentError) {
              console.log('Payment subscription failed, trying direct subscription:', paymentError.message);
              result = await coachingService.subscribeToCoaching(bookingData);
            }

            return {
              success: true,
              content: result.message,
              booking: 'subscription'
            };
          } catch (error) {
            console.error('All subscription attempts failed:', error);
            return {
              success: true,
              content: `I tried to set up your ${subscriptionData.Plan} subscription but encountered an issue: ${error.message}. Please let me know if you'd like to try again.`,
              booking: 'subscription_failed'
            };
          }
        }
      }

      // Check for pitch deck request
      if (response.includes('**REQUEST_PITCH_DECK**')) {
        console.log('🔍 OpenAI Service: Found REQUEST_PITCH_DECK command');
        const pitchData = this.parseBookingData(response, 'REQUEST_PITCH_DECK');
        console.log('🔍 OpenAI Service: Parsed pitch deck data:', pitchData);

        if (pitchData && pitchData.Project) {

          try {
            const requestData = {
              project: pitchData.Project,
              userId: userId,
              name: userProfile?.full_name || pitchData.Name || 'Not provided',
              email: userProfile?.email || pitchData.Email || 'Not provided',
              phone: userProfile?.phone || (pitchData.Phone === 'not provided' ? null : pitchData.Phone),
              role: pitchData.Role || 'Not provided'
            };

            console.log('🔍 OpenAI Service: Requesting pitch deck with data:', requestData);
            console.log('🔍 OpenAI Service: User profile data used:', userProfile);

            const result = await pitchDeckService.requestPitchDeck(requestData);
            console.log('🔍 OpenAI Service: Pitch deck request result:', result);

            if (!result.success) {
              return {
                success: true,
                content: result.message  // Return error message to user
              };
            }

            return {
              success: true,
              content: result.message,
              booking: 'pitch_deck'
            };
          } catch (error) {
            console.error('Pitch deck request failed:', error);
            return {
              success: true,
              content: `I tried to request the ${pitchData.Project} pitch deck but encountered an issue: ${error.message}. Please try again or contact support.`,
              booking: 'pitch_deck_failed'
            };
          }
        }
      }

      return null; // No booking command found
    } catch (error) {
      console.error('Error processing booking command:', error);
      return null;
    }
  }

  /**
   * Chat with selectable mode ('sales' | 'intake')
   */
  async getChatResponseWithMode(messages, { mode = 'sales', userId = null, userProfile = null, intakeContext = null } = {}) {
    const basePrompt = mode === 'intake' ? this.intakeSystemPrompt : this.systemPrompt;
    const result = await callFunction('chat-completion', {
      type: 'chat',
      systemPrompt: intakeContext
        ? `${basePrompt}\n\nINTAKE CONTEXT (do not ask for these again if present):\n${JSON.stringify(intakeContext)}`
        : basePrompt,
      messages,
      userId,
      userProfile,
      model: 'gpt-3.5-turbo'
    });

    const response = result.content;
    if (!response) throw new Error('No response received from AI');

    const bookingResult = await this.processBookingCommand(response, userId, userProfile);
    if (bookingResult) return bookingResult;

    return { success: true, content: response, usage: result.usage };
  }

  /**
   * Parse booking data from AI response
   */
  parseBookingData(response, commandType) {
    try {
      const startMarker = `**${commandType}**`;
      const startIndex = response.indexOf(startMarker);
      if (startIndex === -1) return null;

      // Extract the booking section
      const bookingSection = response.substring(startIndex + startMarker.length);
      const lines = bookingSection.split('\n').filter(line => line.trim() && !line.includes('**'));

      const data = {};
      for (const line of lines) {
        const colonIndex = line.indexOf(':');
        if (colonIndex > 0) {
          const key = line.substring(0, colonIndex).trim();
          const value = line.substring(colonIndex + 1).trim();
          if (key && value) {
            data[key] = value;
          }
        }
      }

      return data;
    } catch (error) {
      console.error('Error parsing booking data:', error);
      return null;
    }
  }

  /**
   * Check if the service is properly configured
   */
  isConfigured() {
    // Consider serverless available by default; client no longer needs the API key
    return true;
  }
}

// Export a singleton instance
export const openaiService = new OpenAIService();
export default openaiService;