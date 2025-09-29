// src/services/pitchDeckService.js
// Pitch deck request service

class PitchDeckService {
  /**
   * Request a pitch deck (always uses direct Supabase for reliability)
   */
  async requestPitchDeck(pitchData) {
    try {
      
      return await this.requestPitchDeckDirect(pitchData);
    } catch (error) {
      console.error('PitchDeck Service: Error requesting pitch deck:', error);
      return {
        success: false,
        message: `Sorry, I couldn't process your pitch deck request due to a technical issue: ${error.message}. Please try again or contact support.`
      };
    }
  }

  /**
   * Direct Supabase insertion for pitch deck request
   */
  async requestPitchDeckDirect(pitchData) {
    try {
      // Import the existing Supabase client
      const { supabase } = await import('../lib/supabaseClient.js');
      
      // Prepare data for insertion, ensuring no null values for required fields
      const insertData = {
        project: pitchData.project,
        user_id: pitchData.userId || null,
        name: pitchData.name || 'Not provided',
        email: pitchData.email || 'Not provided',
        phone: pitchData.phone || 'Not provided',
        role: pitchData.role || 'Not provided',
        status: 'submitted'
      };


      // Try insertion
      let { data, error } = await supabase
        .from('pitch_requests')
        .insert([insertData])
        .select()
        .single();

      if (error) {
        console.error('🔍 PitchDeck Service: First insert attempt failed:', error);
        
        // If RLS error, try without user_id
        if (error.code === '42501' || error.code === 'PGRST116') {
          const alternativeData = { ...insertData, user_id: null };
          
          const alternativeResult = await supabase
            .from('pitch_requests')
            .insert([alternativeData])
            .select()
            .single();
          
          data = alternativeResult.data;
          error = alternativeResult.error;
          
          if (error) {
            console.error('🔍 PitchDeck Service: Alternative insert failed:', error);
            throw new Error(`Alternative insert failed: ${error.message}`);
          }
        } else {
          throw new Error(`Insert failed: ${error.message}`);
        }
      }


      return {
        success: true,
        message: `✅ Perfect! Your ${pitchData.project} pitch deck request has been submitted.${pitchData.name ? `\n\n👤 **Name:** ${pitchData.name}` : ''}${pitchData.email ? `\n📧 **Email:** ${pitchData.email}` : ''}${pitchData.role ? `\n💼 **Role:** ${pitchData.role}` : ''}\n\n📧 **Next Steps:** We'll send the pitch deck to your email address within 24 hours.`,
        requestId: data.id
      };
    } catch (error) {
      console.error('PitchDeck Service: Direct Supabase pitch request failed:', error);
      return {
        success: false,
        message: `Sorry, I couldn't process your pitch deck request due to a technical issue: ${error.message}. Please try again or contact support.`
      };
    }
  }

  /**
   * Check if a message contains pitch deck request intent
   */
  isPitchDeckRequest(message) {
    const lowerMessage = message.toLowerCase();
    
    // Exclude informational questions about projects - these should go to OpenAI
    const informationalPatterns = [
      /what.*(?:galowclub|perspectiv|pitch|project)/i,
      /how.*(?:galowclub|perspectiv|work)/i,
      /tell me about.*(?:galowclub|perspectiv|pitch)/i,
      /explain.*(?:galowclub|perspectiv|pitch)/i,
      /describe.*(?:galowclub|perspectiv|pitch)/i,
      /can you.*(?:tell|explain|describe).*(?:galowclub|perspectiv|pitch)/i,
      /information about.*(?:galowclub|perspectiv|pitch)/i,
      /learn about.*(?:galowclub|perspectiv)/i,
      /know about.*(?:galowclub|perspectiv)/i,
      /details about.*(?:galowclub|perspectiv)/i
    ];
    
    // If it's clearly an informational question, don't trigger pitch form
    if (informationalPatterns.some(pattern => pattern.test(message))) {
      return false;
    }
    
    // Only trigger on clear pitch deck request patterns
    const pitchPatterns = [
      // Direct pitch deck requests
      /(?:want to|would like to|need to|can i).*(?:request|get|receive|see).*(?:pitch deck|pitchdeck)/i,
      /(?:request|get|receive|see).*(?:pitch deck|pitchdeck)/i,
      
      // Project specific requests
      /(?:want to|would like to|need to|can i).*(?:request|get|receive|see).*(?:galowclub|perspectiv)/i,
      /(?:request|get|receive|see).*(?:galowclub|perspectiv).*(?:pitch|deck)/i,
      
      // Direct mentions with clear intent
      /(?:galowclub|perspectiv).*(?:pitch deck|pitchdeck).*(?:please|request)/i,
      /i (?:want|would like|need).*(?:galowclub|perspectiv).*(?:pitch|deck)/i,
      
      // Investment/funding context
      /(?:interested in|looking at).*(?:galowclub|perspectiv|investment)/i,
      /(?:invest|funding|investor).*(?:galowclub|perspectiv)/i
    ];
    
    const hasPattern = pitchPatterns.some(pattern => pattern.test(message));
    
    return hasPattern;
  }

  /**
   * Parse pitch deck request from natural language
   */
  parsePitchDeckRequest(message) {
    
    const projectMatch = message.match(/\b(galowclub|perspectiv)\b/i);
    const project = projectMatch ? projectMatch[1].charAt(0).toUpperCase() + projectMatch[1].slice(1) : null;
    
    const contactInfo = this.extractContactInfo(message);
    const role = this.extractRole(message);
    

    return {
      project,
      // Extract contact info if provided
      name: contactInfo.name,
      email: contactInfo.email,
      phone: contactInfo.phone,
      role: role
    };
  }

  /**
   * Extract contact information from message
   */
  extractContactInfo(message) {
    const patterns = {
      name: /(?:name|call me|i'm)\s+([a-zA-Z\s]+)/i,
      email: /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i,
      phone: /(\+?[\d\s\-\(\)]{10,})/i
    };

    return {
      name: message.match(patterns.name)?.[1]?.trim() || null,
      email: message.match(patterns.email)?.[1] || null,
      phone: message.match(patterns.phone)?.[1] || null
    };
  }

  /**
   * Extract role/title from message
   */
  extractRole(message) {
    const roleMatch = message.match(/(?:role|title|position|i'm a|i am a)\s+([a-zA-Z\s]+)/i);
    return roleMatch ? roleMatch[1].trim() : null;
  }
}

// Export a singleton instance
export const pitchDeckService = new PitchDeckService();
export default pitchDeckService;