export const TIME_SLOTS = [
  '10:00 am to 11:00 am',
  '11:00 am to 12:00 pm',
  '12:00 pm to 1:00 pm',
  '1:00 pm to 2:00 pm',
  '2:00 pm to 3:00 pm',
  '3:00 pm to 4:00 pm',
  '4:00 pm to 5:00 pm',
  '5:00 pm to 6:00 pm'
] as const;

export const LUNCH_SLOT = '1:00 pm to 2:00 pm';

export const PROVIDERS = {
  'Groq (Fastest)': {
    default_model: 'llama-3.1-8b-instant',
    api_key_required: true,
    timeout: 30000
  },
  'OpenAI (ChatGPT)': {
    default_model: 'gpt-4o-mini',
    api_key_required: true,
    timeout: 30000
  },
  'Google Gemini': {
    default_model: 'gemini-1.5-flash',
    api_key_required: true,
    timeout: 30000
  },
  'Ollama (local)': {
    default_model: 'phi3',
    api_key_required: false,
    timeout: 60000
  }
} as const;

export const TEMPLATES = {
  'Social Media & Content': 'Created 3 Instagram stories, replied to comments, prepared content calendar, wrote a blog post, scheduled posts.',
  'Meetings & Documentation': 'Attended 2 meetings, wrote meeting notes, updated project documentation, sent follow-up emails.',
  'Development & Testing': 'Fixed 3 bugs, deployed new feature, wrote unit tests, reviewed pull requests.'
} as const;