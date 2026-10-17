/** Launch allowances are processing units, not a guarantee of provider-dollar cost. */
export const COMMERCIAL_AI_REPLY_COST = 10;
export const COMMERCIAL_AI_MONTHLY_CREDITS = {
  'paris-assistant': 250,
  'ellie-assistant': 250,
  'lizzy-assistant': 400,
  'zora-assistant': 400,
  'ai-team': 1200,
} as const;
export const COMMERCIAL_AI_INPUT_LIMITS = {
  messageCharacters: 3000,
  contextCharacters: 4000,
  historyMessages: 8,
  historyMessageCharacters: 1500,
  outputTokens: 1000,
} as const;
