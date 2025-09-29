const OpenAI = require('openai');

// Server-side proxy for chat completions and intake kickoff.
// Reads API key from environment; nothing is exposed to the client.
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const INTAKE_SYSTEM_PROMPT = `You are Daniel DaGalow's Intake Assistant. Your ONLY goal is to collect concise, high-signal information BEFORE the session to save the client time and money.

PRINCIPLES:
- Be brief: one or two focused questions per turn.
- Never ask for info we already have (use provided profile/context).
- Prioritize: goals → current status → constraints → timeline → success criteria.
- Summarize occasionally in bullet points so the user can confirm or edit.
- Be warm, efficient, and non-salesy. Do not upsell here.

SERVICE-SPECIFIC STARTERS:
- Consultation: clarify main objective, background, constraints, and desired outcome for the booked duration.
- Coaching: clarify top 1–2 goals for this month, current habit/routine, and blockers; propose a first-week action check-in.
- Pitch deck: capture audience, use-case, stage, traction, and key ask (amount, terms).`.trim();

function buildProfileNote(userId, userProfile) {
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

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  if (!process.env.OPENAI_API_KEY) {
    return { statusCode: 500, body: 'Server missing OpenAI API key' };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  const {
    type = 'chat',
    model = 'gpt-3.5-turbo',
    messages = [],
    systemPrompt = null,
    // kickoff-specific
    paymentStatus = 'success',
    serviceType = 'consultation',
    intakeContext = {},
    // optional personalization context
    userId = null,
    userProfile = null,
  } = body;

  try {
    if (type === 'kickoff') {
      const guardrails = `\n\nWRITE THE FIRST MESSAGE WITH THESE RULES:\n  - If paymentStatus is "success", acknowledge it positively.\n  - Tailor wording to serviceType.\n  - Be warm and efficient (2 short sentences max).\n  - END WITH ONE open-ended question that nudges the user to answer (no yes/no).\n  - No lists, no follow-ups, no next steps—just one question.`;

      const contextNote = `\n  PAYMENT STATUS: ${paymentStatus}\n  SERVICE TYPE: ${serviceType}\n  INTAKE CONTEXT (do not re-ask if present): ${JSON.stringify(intakeContext)}\n  ${userId ? `USER ID: ${userId}` : ''}\n  ${userProfile ? `PROFILE: ${JSON.stringify(userProfile)}` : ''}`.trim();

      const completion = await openai.chat.completions.create({
        model,
        temperature: 0.6,
        messages: [
          { role: 'system', content: INTAKE_SYSTEM_PROMPT + guardrails },
          { role: 'user', content: `Compose the kickoff message now.\nRequirements reminder: acknowledge payment if success; end with a single open-ended question.\n${contextNote}` },
        ],
        max_tokens: 160,
        presence_penalty: 0.2,
        frequency_penalty: 0.1,
      });

      const content = completion.choices?.[0]?.message?.content?.trim();
      if (!content) throw new Error('No kickoff message returned from OpenAI.');
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true, content, usage: completion.usage })
      };
    }

    // Default: chat
    const sys = systemPrompt ? systemPrompt : `You are Daniel DaGalow's AI assistant, a professional coaching and business consultation chatbot.`;
    const fullSystem = sys + buildProfileNote(userId, userProfile);
    const formatted = [
      { role: 'system', content: fullSystem },
      ...messages.map(m => ({ role: m.role, content: m.content }))
    ];

    const completion = await openai.chat.completions.create({
      model,
      messages: formatted,
      max_tokens: 500,
      temperature: 0.7,
      presence_penalty: 0.1,
      frequency_penalty: 0.1,
    });

    const content = completion.choices?.[0]?.message?.content;
    if (!content) throw new Error('No response received from OpenAI');
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true, content, usage: completion.usage })
    };
  } catch (error) {
    const message = error?.message || 'Unknown error occurred';
    const isQuota = error?.code === 'insufficient_quota';
    const isInvalid = error?.code === 'invalid_api_key';
    const isRatelimit = error?.status === 429;
    const friendly = isQuota
      ? 'OpenAI API quota exceeded. Please check your billing settings.'
      : isInvalid
        ? 'Invalid OpenAI API key. Please check your configuration.'
        : isRatelimit
          ? 'Rate limit exceeded. Please try again in a moment.'
          : `AI service error: ${message}`;
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: false, error: friendly })
    };
  }
};


