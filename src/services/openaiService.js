// src/services/openaiService.js
import { callFunction } from './apiClient';
import OpenAI from 'openai';

class OpenAIService {
  constructor() {
    // In development, use OpenAI directly. In production, use Netlify functions.
    if (import.meta.env.DEV) {
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
      if (apiKey) {
        this.client = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
      } else {
        this.client = null;
      }
    } else {
      // Production: use Netlify functions
      this.client = {}; // sentinel to indicate configured
    }

    // System prompt for the chatbot personality and context
    this.systemPrompt = `System Prompt (Daniel Cluckins Receptionist / Sales / Support)
You are Daniel Cluckins Assistant, the official receptionist, secretary, sales agent and customer-support assistant for Daniel Cluckins Coaching (www.danielcluckins.com). Act professionally, courteously, confidently and persuasively. Your primary goals, in order:

Help the visitor quickly and accurately (answer questions about services, pricing, policies, account features, recordings, appointment scheduling, payment).

Convert and upsell when a relevant opportunity appears (present clear benefits and price/value comparisons; suggest the next step: booking a consultation, starting a plan, or upgrading).

Collect structured user data (consent first) to create a user profile/report for the coach (name, goals, budget, challenges, preferred contact, readiness to change).

Automate actions when permitted: schedule appointment, send invoice, create lead, provide pitch-deck request instruction, or escalate to human.

Tone & style: warm, focused, professional, motivational. Keep replies short and scannable for initial responses (1–4 short sentences) and expand when user asks. Use plain language, avoid jargon. Show urgency only when appropriate (e.g., limited availability for 1:1 coaching).

Safety & legal constraints: Always include these policy notes when relevant:

Offer coaching as guidance only — not medical, legal, financial, or psychological advice.

Do not promise guaranteed outcomes.

Respect user privacy: do not store or use sensitive personal data (health, sexual orientation, political beliefs, race) without explicit opt-in and documented lawful basis.

When users ask about policies, pricing, or recordings: provide precise, up-to-date policy text or link them to the site pages: Privacy Policy (/privacy-policy), Cookie Policy (/cookie-policy), Terms of Service (/terms-of-service). If unsure, say: “I’m checking that now” and escalate to a human if needed.

Current services and pricing (EUR):
- Consultation: €90/hour (i.e., €1.5 per minute)
- Coaching subscriptions: Basic €40/mo, Standard €90/mo (recommended), Premium €230/mo
- Pitch deck requests: free

Sales rules:
- If buying intent appears (e.g., “book”, “consultation”, “price”, “how much”), present price + one-sentence value + CTA (Book Now). Recommend the Standard plan by default.
- For objections (price/time), offer alternatives (shorter consult, entry plan, pay-as-you-go) and state succinct ROI (e.g., “For €90 you get 1-hour targeted coaching — typical clients report measurable progress in 4–6 weeks when they follow action plans.”).

Scheduling and automation behavior:
- Always show next steps clearly. After booking or payment, confirm and inform that an email & calendar invite will be sent.
- Ask permission before collecting additional personal data (e.g., phone, recordings). If consented, proceed.

Execution format (critical): When you have all info, output one of these command blocks exactly so the system can execute. Do not add extra commentary inside the block.

For consultations (requires Date, Time, Duration minutes; use profile Name/Email if available):
**BOOK_APPOINTMENT**
Date: YYYY-MM-DD
Time: HH:MM
Duration: [minutes as number]
Name: [profile name or collected]
Email: [profile email or collected]
Phone: [profile phone or "not provided"]

For coaching subscriptions (requires Plan = basic|standard|premium; use profile Name/Email if available):
**BOOK_SUBSCRIPTION**
Plan: [basic/standard/premium]
Name: [profile name or collected]
Email: [profile email or collected]
Phone: [profile phone or "not provided"]

For pitch decks (requires Project and Role; use profile Name/Email if available):
**REQUEST_PITCH_DECK**
Project: [GalowClub/Perspectiv]
Name: [profile name or collected]
Email: [profile email or collected]
Phone: [profile phone or "not provided"]
Role: [user role/title]

Greet within 2 messages and offer three options: Ask a question / Book consultation / View plans. You are an assistant, not a person; if asked “are you human?”, state you are a virtual assistant representing the business.`;

    // Intake mode prompt for post-payment ChatbotStep
    this.intakeSystemPrompt = `
 You are Daniel Cluckins' Intake Assistant. Your ONLY goal is to collect concise, high-signal information BEFORE the session to save the client time and money.

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
      // In development, use OpenAI directly if available
      if (import.meta.env.DEV && this.client && this.client.chat) {

        const sys = this.systemPrompt + this.buildProfileNote(userId, userProfile);
        const formatted = [
          { role: 'system', content: sys },
          ...messages.map(m => ({ role: m.role, content: m.content }))
        ];

        const completion = await this.client.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: formatted,
          max_tokens: 500,
          temperature: 0.7,
          presence_penalty: 0.1,
          frequency_penalty: 0.1,
        });

        const response = completion.choices?.[0]?.message?.content;
        if (!response) throw new Error('No response received from OpenAI');

        const bookingResult = await this.processBookingCommand(response, userId, userProfile);
        if (bookingResult) return bookingResult;

        return {
          success: true,
          content: response,
          usage: completion.usage
        };
      }

      // Production: use Netlify functions
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
      // Handle development mode gracefully
      if (import.meta.env.DEV && (!this.client || !this.client.chat)) {
        const mockResponse = "Hello! I'm Daniel Cluckins' assistant. I'm currently in development mode without an API key configured. Please visit the live site at danielcluckins.com to experience the full AI-powered assistant.";
        return { success: true, content: mockResponse, usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 } };
      }

      console.error('OpenAI (serverless) error:', error);
      throw error;
    }
  }

  /**
   * Get a welcome message for new chat sessions
   */
  async getWelcomeMessage(userId = null, userProfile = null) {
    try {
      // In development, generate welcome message directly if OpenAI client available
      if (import.meta.env.DEV && this.client && this.client.chat) {
        const variations = ['Ready to level up?', 'How can I help you today?', 'Let\'s get started!', 'What\'s on your mind?'];
        const randomVariation = variations[Math.floor(Math.random() * variations.length)];

        let personalizedPrompt = `Send a personal and with less than 50 characters welcome message to the user to welcome him and know what they need.
Access the user information, if needed, for more personalization.
The only thing you can output is the user message and don't start and end the message in quotes.`;
        if (userProfile?.full_name) {
          personalizedPrompt = `Generate a brief, personalized welcome message for ${userProfile.full_name}. ${personalizedPrompt}`;
        }

        const completion = await this.client.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: 'You are a helpful assistant for Daniel Cluckins\' platform.' },
            { role: 'user', content: personalizedPrompt }
          ],
          max_tokens: 50,
          temperature: 1.0
        });

        let welcomeMessage;
        try {
          welcomeMessage = this.stripQuotes(completion.choices[0].message.content.trim());
        } catch {
          welcomeMessage = `Welcome! How can I assist you with Daniel Cluckins services today?`;
        }

        return welcomeMessage;
      }

      // Production: use Netlify function
      const payload = { session_id: crypto?.randomUUID?.() || `${Date.now()}`, user_id: userId || null };
      const data = await callFunction('welcome-message', payload);
      return data.content;
    } catch (error) {
      // Silent fallback in development - only log in production
      if (import.meta.env.PROD) {
        console.error('Error generating welcome message (serverless):', error);
      }
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

            // Try payment booking first, fallback to direct booking
            let result;
            try {
              result = await consultationService.scheduleAppointmentWithPayment(bookingData);
            } catch (paymentError) {
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
        const subscriptionData = this.parseBookingData(response, 'BOOK_SUBSCRIPTION');

        if (subscriptionData && subscriptionData.Plan) {

          try {
            const bookingData = {
              plan: subscriptionData.Plan.toLowerCase(),
              userId: userId,
              name: userProfile?.full_name || subscriptionData.Name || 'Not provided',
              email: userProfile?.email || subscriptionData.Email || 'Not provided',
              phone: userProfile?.phone || (subscriptionData.Phone === 'not provided' ? null : subscriptionData.Phone)
            };

            // Try payment subscription first, fallback to direct subscription
            let result;
            try {
              result = await coachingService.subscribeToCoachingWithPayment(bookingData);
            } catch (paymentError) {
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
        const pitchData = this.parseBookingData(response, 'REQUEST_PITCH_DECK');

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

            const result = await pitchDeckService.requestPitchDeck(requestData);

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
  /**
   * Strip quotes from the beginning and end of a string
   */
  stripQuotes(str) {
    return str.replace(/^["']|["']$/g, '');
  }

  /**
   * Build profile note for system prompt (used in development mode)
   */
  buildProfileNote(userId, userProfile) {
    if (!userId && !userProfile) return '';
    const lines = [];
    if (userProfile) {
      lines.push(
        `USER PROFILE (use this for personalization):\n- Name: ${userProfile.full_name || 'Not provided'}\n- Email: ${userProfile.email || 'Not provided'}\n- Phone: ${userProfile.phone || 'Not provided'}`
      );
    }
    if (userId) {
      lines.push(`User ID: ${userId}`);
    }
    return `\n\n${lines.join('\n')}`;
  }

  /**
   * Check if the service is properly configured
   */
  isConfigured() {
    // Consider configured if we have either a client (dev) or are in production
    return !!(this.client || !import.meta.env.DEV);
  }
}

// Export a singleton instance
export const openaiService = new OpenAIService();
export default openaiService;